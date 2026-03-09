// Render Myhome Bhooja floor plan pages 16, 17, 19 to PNG files
// Run from: c:\GitHub\Digital Passport
// node scripts/render-floorplans.mjs

import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dir, '..');

// Load mupdf from functions/node_modules using file:// URL (required on Windows)
const mupdfPath = join(rootDir, 'functions', 'node_modules', 'mupdf', 'dist', 'mupdf.js');
const mupdf = await import(pathToFileURL(mupdfPath).href);


const pdfPath = join(rootDir, 'scripts', 'myhome-bhooja-brochure.pdf');
const bytes = fs.readFileSync(pdfPath);
const doc = mupdf.default.Document.openDocument(bytes, 'application/pdf');

const PAGES = [16, 17, 19];
const DPI = 100;  // 100dpi = ~2MB per page — good quality for mobile

for (const pageNum of PAGES) {
  const page = doc.loadPage(pageNum - 1);
  const scale = DPI / 72;
  const matrix = mupdf.default.Matrix.scale(scale, scale);
  const pixmap = page.toPixmap(matrix, mupdf.default.ColorSpace.DeviceRGB, false, true);
  const pngData = Buffer.from(pixmap.asPNG());
  const outFile = join(rootDir, 'scripts', `bhooja-fp${pageNum}.png`);
  fs.writeFileSync(outFile, pngData);
  console.log(`✅ Page ${pageNum} → ${outFile} (${Math.round(pngData.length / 1024)}KB)`);
}

console.log('\nAll pages rendered!');

