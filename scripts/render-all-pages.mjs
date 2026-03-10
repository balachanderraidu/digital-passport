// Render all pages of the Myhome Bhooja brochure at very low resolution (50 DPI)
// for a quick overview of all pages — output as bhooja-page-{N}.png in scripts/brochure-pages/
// Run: node scripts/render-all-pages.mjs

import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dir, '..');

const mupdfPath = join(rootDir, 'functions', 'node_modules', 'mupdf', 'dist', 'mupdf.js');
const mupdf = await import(pathToFileURL(mupdfPath).href);

const pdfPath = join(rootDir, 'scripts', 'myhome-bhooja-brochure.pdf');
const bytes = fs.readFileSync(pdfPath);
const doc = mupdf.default.Document.openDocument(bytes, 'application/pdf');
const pageCount = doc.countPages();

const outDir = join(rootDir, 'scripts', 'brochure-pages');
fs.mkdirSync(outDir, { recursive: true });

const DPI = 50; // very low res = fast thumbnails, small files
console.log(`Rendering ${pageCount} pages at ${DPI} DPI...\n`);

for (let i = 0; i < pageCount; i++) {
  const pageNum = i + 1;
  const page = doc.loadPage(i);
  const scale = DPI / 72;
  const matrix = mupdf.default.Matrix.scale(scale, scale);
  const pixmap = page.toPixmap(matrix, mupdf.default.ColorSpace.DeviceRGB, false, true);
  const pngData = Buffer.from(pixmap.asPNG());
  const outFile = join(outDir, `page-${String(pageNum).padStart(2, '0')}.png`);
  fs.writeFileSync(outFile, pngData);
  const sizeKB = Math.round(pngData.length / 1024);
  process.stdout.write(`  Page ${pageNum}/${pageCount} → ${sizeKB}KB\r`);
}

console.log(`\nDone! All ${pageCount} pages rendered to scripts/brochure-pages/`);
