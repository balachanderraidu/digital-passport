// Upload Bhooja floor plan PNGs to Firebase Storage
// Run: node scripts/upload-floorplans.mjs
// Uses: gcloud auth application-default credentials via token

import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const BUCKET  = 'digital-passport-peroneira.firebasestorage.app';
const PROJECT = 'digital-passport-peroneira';
const FS_HOST = 'firestore.googleapis.com';
const GCS_HOST = 'storage.googleapis.com';

const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
console.log('🔑 Got gcloud token');

// ── Simple HTTPS helper ───────────────────────────────────────────────────────
function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 300)}`));
        } else {
          resolve(text);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ── Upload a PNG file to GCS ─────────────────────────────────────────────────
async function uploadPng(localPath, gcsObject) {
  const bytes = readFileSync(localPath);
  const encodedName = encodeURIComponent(gcsObject);
  await request({
    hostname: GCS_HOST,
    path: `/upload/storage/v1/b/${encodeURIComponent(BUCKET)}/o?uploadType=media&name=${encodedName}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'image/png',
      'Content-Length': bytes.length,
    },
  }, bytes);
}

// ── Patch Firestore doc ───────────────────────────────────────────────────────
async function fsSet(docPath, fields) {
  const body = JSON.stringify({ fields });
  await request({
    hostname: FS_HOST,
    path: `/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = [
  { local: 'scripts/bhooja-fp16.png', gcsName: 'projects/myhome-bhooja/floorplans/page-16.png', page: 16 },
  { local: 'scripts/bhooja-fp17.png', gcsName: 'projects/myhome-bhooja/floorplans/page-17.png', page: 17 },
  { local: 'scripts/bhooja-fp19.png', gcsName: 'projects/myhome-bhooja/floorplans/page-19.png', page: 19 },
];

console.log('\n📤 Uploading floor plan images...');
const pageUrls = {};

await Promise.all(files.map(async (f) => {
  const fullPath = join(ROOT, f.local);
  const sizeKB = Math.round(statSync(fullPath).size / 1024);
  console.log(`   Page ${f.page} (${sizeKB}KB)... `);
  await uploadPng(fullPath, f.gcsName);
  // Firebase Storage public URL format for uniform-access bucket:
  // Needs a download token OR use the Firebase REST read (works with Storage rules)
  const url = `https://${GCS_HOST}/${BUCKET}/${f.gcsName}`;
  pageUrls[f.page] = url;
  console.log(`   ✅ Page ${f.page}`);
}));

console.log('\n💾 Updating Firestore unit types...');
const unitMap = [
  { id: '3bhk-type-a', page: 16 },
  { id: '3bhk-type-b', page: 16 },
  { id: '3bhk-type-c', page: 17 },
  { id: '4bhk',        page: 19 },
];

await Promise.all(unitMap.map(async (ut) => {
  const url = pageUrls[ut.page];
  await fsSet(`projects/myhome-bhooja/unitTypes/${ut.id}`, {
    genericDocs: { arrayValue: { values: [{ stringValue: url }] } },
    floorPlanUrl: { stringValue: url },
  });
  console.log(`   ✅ ${ut.id} → page ${ut.page}`);
}));

console.log('\n🎉 All done!');
console.log('Floor plan URLs:');
for (const [pg, url] of Object.entries(pageUrls)) console.log(`  Page ${pg}: ${url}`);
