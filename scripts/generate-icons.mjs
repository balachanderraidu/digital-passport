#!/usr/bin/env node
/**
 * create-icons.mjs
 * Copies a source PNG to /public/icons/ at required PWA sizes.
 * Uses PowerShell's System.Drawing to resize on Windows.
 */
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sourceImage = process.argv[2]

if (!sourceImage) {
  console.error('Usage: node scripts/create-icons.mjs <source-image-path>')
  process.exit(1)
}

const iconsDir = join(__dirname, '../public/icons')
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true })
  console.log('[create-icons] Created /public/icons/')
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  const output = join(iconsDir, name).replace(/\\/g, '\\\\')
  const src = sourceImage.replace(/\\/g, '\\\\')
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${src}')
$bmp = New-Object System.Drawing.Bitmap ${size}, ${size}
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, ${size}, ${size})
$bmp.Save('${output}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
`
  execSync(`powershell -Command "${ps.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`)
  console.log(`[create-icons] ✅ Generated ${name} (${size}x${size})`)
}
