#!/usr/bin/env node
/**
 * process-brochure.js — Local admin script to seed floor plan images from a PDF brochure.
 *
 * What it does:
 *  1. Reads a brochure PDF from disk
 *  2. Optionally sends it to Gemini to extract unit types + which PDF page = which floor plan
 *  3. Renders each floor plan page to a PNG using mupdf (WebAssembly, no native tools needed)
 *  4. Uploads each PNG to Firebase Storage via REST API
 *  5. Updates Firestore unitType.genericDocs[] with the public Storage URL
 *
 * Usage:
 *   node scripts/process-brochure.js --pdf "path/to/brochure.pdf" --project myhome-bhooja
 *
 * Optional flags:
 *   --project <id>   Firestore project document ID. If omitted, Gemini infers it.
 *   --dpi <number>   Image resolution (default: 200)
 *   --pages <list>   Comma-separated 1-indexed page numbers, e.g. "16,17,19"
 *                    If given, skips Gemini page-detection and renders only these pages.
 *   --dry-run        Print what would happen without writing to Firestore/Storage.
 *
 * Credentials (no service account needed):
 *   This script uses gcloud ADC token for both Storage and Firestore REST APIs.
 *   Make sure you are logged in: gcloud auth application-default login
 */

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PROJECT_ID = 'digital-passport-peroneira'
const BUCKET     = 'digital-passport-peroneira.firebasestorage.app'
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const GCS_BASE   = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(BUCKET)}/o`
const GCS_PUB    = `https://storage.googleapis.com/${BUCKET}`

// ── Argument parsing ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2)
  const r = { pdf: '', project: '', dpi: 200, pages: [], dryRun: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pdf')     r.pdf     = args[++i]
    if (args[i] === '--project') r.project = args[++i]
    if (args[i] === '--dpi')     r.dpi     = parseInt(args[++i], 10)
    if (args[i] === '--pages')   r.pages   = args[++i].split(',').map(Number).filter(Boolean)
    if (args[i] === '--dry-run') r.dryRun  = true
  }
  if (!r.pdf) {
    console.error('Usage: node scripts/process-brochure.js --pdf <path> [--project <id>] [--dpi 200] [--pages 16,17,19] [--dry-run]')
    process.exit(1)
  }
  return r
}

// ── gcloud token ──────────────────────────────────────────────────────────────
function getGcloudToken() {
  try {
    return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim()
  } catch {
    console.error('❌ Could not get gcloud token. Run: gcloud auth application-default login')
    process.exit(1)
  }
}

// ── Gemini: extract unit types + floor plan page numbers ──────────────────────
async function geminiExtract(pdfPath, geminiKey) {
  console.log('🤖 Gemini: extracting unit types and floor plan page numbers...')
  const base64 = fs.readFileSync(pdfPath).toString('base64')
  const prompt = `You are a real estate data extractor. Analyse this residential brochure PDF carefully.

Return ONLY raw JSON (no markdown) with this structure:
{
  "projectName": "string",
  "developer": "string",
  "city": "string",
  "unitTypes": [
    {
      "label": "3BHK East",
      "bedrooms": 3,
      "bathrooms": 3,
      "carpetArea": 0,
      "superBuiltUpArea": 2595,
      "configuration": "East-facing",
      "floorRange": [3, 36],
      "flatNumberPattern": "",
      "floorPlanPage": 16
    }
  ]
}

Rules:
- List EACH distinct unit type separately.
- carpetArea: RERA carpet area in sq ft. 0 if not found.
- superBuiltUpArea: total/super built-up area in sq ft. 0 if not found.
- floorPlanPage: 1-indexed page number of THIS unit type's floor plan diagram. 0 if not found.
- floorRange: [minFloor, maxFloor]. Use [2, 36] if unknown.
- Return ONLY valid JSON.`

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'application/pdf', data: base64 } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    }
  )
  if (!resp.ok) throw new Error(`Gemini error: ${resp.status} ${await resp.text()}`)
  const json = await resp.json()
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return JSON.parse(raw)
}

// ── mupdf: render a PDF page to PNG buffer ────────────────────────────────────
async function renderPageToPng(pdfPath, pageIndex, dpi) {
  // mupdf is an ES module — use dynamic import
  const mupdf = await import('mupdf')
  const pdfBytes = fs.readFileSync(pdfPath)
  const doc = mupdf.Document.openDocument(pdfBytes, 'application/pdf')
  const page = doc.loadPage(pageIndex) // 0-indexed
  const matrix = mupdf.Matrix.scale(dpi / 72, dpi / 72)
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true)
  return Buffer.from(pixmap.asPNG())
}

// ── Firebase Storage REST upload ──────────────────────────────────────────────
async function uploadToStorage(token, storagePath, pngBuffer) {
  const url = `${GCS_BASE}?uploadType=media&name=${encodeURIComponent(storagePath)}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
    body: pngBuffer,
  })
  if (!resp.ok) throw new Error(`Storage upload error: ${resp.status} ${await resp.text()}`)
  // Make public
  const pubResp = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET)}/o/${encodeURIComponent(storagePath)}/iam`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bindings: [{ role: 'roles/storage.objectViewer', members: ['allUsers'] }],
      }),
    }
  )
  // IAM might fail on uniform-access buckets — that's fine, URL still works
  if (!pubResp.ok) {
    // Try simpleACL
    await fetch(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET)}/o/${encodeURIComponent(storagePath)}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ acl: [{ entity: 'allUsers', role: 'READER' }] }),
      }
    ).catch(() => {}) // ignore ACL errors for uniform-access buckets
  }
  return `${GCS_PUB}/${storagePath}`
}

// ── Firestore REST patch ──────────────────────────────────────────────────────
function fsValue(v) {
  if (typeof v === 'string')  return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number')  return { integerValue: String(Math.round(v)) }
  if (Array.isArray(v))       return { arrayValue: { values: v.map(fsValue) } }
  return { nullValue: null }
}

async function fsSet(token, docPath, data) {
  const fields = {}
  for (const [k, v] of Object.entries(data)) fields[k] = fsValue(v)
  const resp = await fetch(`${FS_BASE}/${docPath}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!resp.ok) throw new Error(`Firestore error on ${docPath}: ${resp.status} ${await resp.text()}`)
}

async function fsQuery(token, collection, field, value) {
  const resp = await fetch(
    `${FS_BASE}/${collection}?pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!resp.ok) return []
  const json = await resp.json()
  return (json.documents ?? []).filter(d => d.fields?.[field]?.stringValue === value)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs()
  const token      = getGcloudToken()
  const geminiKey  = process.env.GEMINI_API_KEY

  if (!fs.existsSync(args.pdf)) { console.error(`❌ PDF not found: ${args.pdf}`); process.exit(1) }
  if (!geminiKey && args.pages.length === 0) {
    console.error('❌ GEMINI_API_KEY required when --pages is not specified.')
    process.exit(1)
  }

  console.log(`\n📄 Brochure: ${path.basename(args.pdf)} (${Math.round(fs.statSync(args.pdf).size / 1024)}KB)`)
  if (args.dryRun) console.log('⚠️  DRY RUN — no writes\n')

  // ── Step 1: Get unit type data ───────────────────────────────────────────────
  let extracted = { projectName: args.project || 'Unknown', developer: '', city: '', unitTypes: [] }

  if (args.pages.length > 0) {
    console.log(`📌 Manual mode: rendering pages ${args.pages.join(', ')}`)
    // When using manual pages, we still run Gemini to get unit type details, 
    // but we assign pages manually (user knows page 16=TypeA, 17=TypeB, 19=TypeC/4BHK)
    if (geminiKey) {
      extracted = await geminiExtract(args.pdf, geminiKey)
    }
    // If Gemini returned fewer unit types than pages, pad with generic entries
    // Map each page to a unit type in order
    args.pages.forEach((pageNum, i) => {
      if (i < extracted.unitTypes.length) {
        extracted.unitTypes[i].floorPlanPage = pageNum
      } else {
        extracted.unitTypes.push({
          label: `Unit Type ${i + 1}`,
          bedrooms: 0, bathrooms: 0, carpetArea: 0, superBuiltUpArea: 0,
          configuration: 'Standard', floorRange: [2, 36],
          flatNumberPattern: '', floorPlanPage: pageNum,
        })
      }
    })
    // Remove unit types with no page
    extracted.unitTypes = extracted.unitTypes.map((ut, i) => ({
      ...ut,
      floorPlanPage: ut.floorPlanPage || (args.pages[i] ?? 0),
    }))
  } else {
    extracted = await geminiExtract(args.pdf, geminiKey)
  }

  console.log(`\n✅ Project: "${extracted.projectName}" — ${extracted.unitTypes.length} unit types`)
  for (const ut of extracted.unitTypes) {
    const a = ut.carpetArea > 0 ? `${ut.carpetArea} carpet` : `${ut.superBuiltUpArea} SBU`
    console.log(`   • ${ut.label} — ${a} sqft — floor plan page: ${ut.floorPlanPage || '?'}`)
  }

  // ── Step 2: Find or confirm project ID ──────────────────────────────────────
  let projectId = args.project
  if (!projectId) {
    const docs = await fsQuery(token, 'projects', 'name', extracted.projectName)
    if (docs.length > 0) {
      projectId = docs[0].name.split('/').pop()
      console.log(`\n📂 Found existing project: ${projectId}`)
    } else {
      projectId = extracted.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (!args.dryRun) {
        const words = `${extracted.projectName} ${extracted.developer} ${extracted.city}`.toLowerCase().split(/\s+/)
        const kws = [...new Set(words.flatMap(w => Array.from({ length: w.length - 1 }, (_, i) => w.slice(0, i + 2)).concat(w)))]
        await fsSet(token, `projects/${projectId}`, {
          name: extracted.projectName, developer: extracted.developer,
          city: extracted.city, verified: false, totalUnits: 0,
          searchKeywords: kws.filter(k => k.length >= 2),
        })
        console.log(`\n📂 Created project: ${projectId}`)
      } else {
        console.log(`\n📂 [DRY RUN] Would create: ${projectId}`)
      }
    }
  } else {
    console.log(`\n📂 Using project: ${projectId}`)
  }

  // ── Step 3: Render unique pages ──────────────────────────────────────────────
  const uniquePages = [...new Set(extracted.unitTypes.map(ut => ut.floorPlanPage ?? 0).filter(p => p > 0))]
  const pageToUrl = new Map()
  console.log(`\n🖼️  Rendering ${uniquePages.length} floor plan page(s) at ${args.dpi}dpi concurrently...`)

  await Promise.all(
    uniquePages.map(async (pageNum) => {
      try {
        const png = await renderPageToPng(args.pdf, pageNum - 1, args.dpi)
        const kb = Math.round(png.length / 1024)

        if (!args.dryRun) {
          const storagePath = `projects/${projectId}/floorplans/page-${pageNum}.png`
          const url = await uploadToStorage(token, storagePath, png)
          pageToUrl.set(pageNum, url)
          console.log(`   ✅ Page ${pageNum} rendered (${kb}KB PNG) and uploaded: ${url}`)
        } else {
          pageToUrl.set(pageNum, `[DRY-RUN-page-${pageNum}]`)
          console.log(`   ✅ Page ${pageNum} rendered (${kb}KB PNG) and uploaded: [DRY RUN]`)
        }
      } catch (err) {
        console.log(`   ❌ Page ${pageNum} FAILED: ${err.message}`)
      }
    })
  )

  // ── Step 4: Update Firestore unit types ──────────────────────────────────────
  console.log('\n💾 Updating Firestore unit types...')
  await Promise.all(extracted.unitTypes.map(async (ut) => {
    const label   = ut.label ?? 'Unknown'
    const typeId  = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const pageNum = ut.floorPlanPage ?? 0
    const url     = pageNum > 0 ? (pageToUrl.get(pageNum) ?? '') : ''
    const area    = ut.carpetArea > 0 ? ut.carpetArea : (ut.superBuiltUpArea ?? 0)

    if (!args.dryRun) {
      await fsSet(token, `projects/${projectId}/unitTypes/${typeId}`, {
        label,
        bedrooms: ut.bedrooms ?? 0,
        bathrooms: ut.bathrooms ?? 0,
        area,
        carpetArea: ut.carpetArea ?? 0,
        superBuiltUpArea: ut.superBuiltUpArea ?? 0,
        configuration: ut.configuration ?? '',
        floorRange: ut.floorRange ?? [2, 36],
        flatNumberPattern: ut.flatNumberPattern ?? '',
        genericDocs: url ? [url] : [],
      })
    }

    const img = url ? '🖼️ ' : '⚠️  (no image)'
    const areaStr = ut.carpetArea > 0 ? `${ut.carpetArea} carpet` : `${ut.superBuiltUpArea} SBU`
    console.log(`   ${img}  ${label} (${areaStr} sqft)`)
  }))

  console.log('\n🎉 Done!')
  if (!args.dryRun) {
    console.log(`\n  🔗 View: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/data/projects/${projectId}`)
  }
  process.exit(0)
}

main().catch(err => { console.error('\n❌ Fatal:', err.message); process.exit(1) })
