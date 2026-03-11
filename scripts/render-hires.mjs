// Render specific pages at high DPI so we can identify flat crop coordinates
// Usage: node scripts/render-hires.mjs
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

const outDir = join(rootDir, 'scripts', 'brochure-hires');
fs.mkdirSync(outDir, { recursive: true });

// Pages we care about for cropping (0-indexed)
const PAGES = [
  { idx: 13, name: 'page-14-blocks-BC', dpi: 150 },  // 4070 WF top, 2595 WF sides, 3430 EF bottom-corner, 2680 EF bottom-mid
  { idx: 15, name: 'page-16-block-F',   dpi: 150 },  // 3430 WF top-corner, 2595 WF top-mid, 4070 EF bottom
  { idx: 18, name: 'page-19-blocks-JK', dpi: 150 },  // 3430 WF top-corner, 2595 WF top-mid, 4070 EF bottom-mid, 2680 EF bottom-side
];

for (const { idx, name, dpi } of PAGES) {
  const page = doc.loadPage(idx);
  const scale = dpi / 72;
  const matrix = mupdf.default.Matrix.scale(scale, scale);
  const pixmap = page.toPixmap(matrix, mupdf.default.ColorSpace.DeviceRGB, false, true);
  const pngData = Buffer.from(pixmap.asPNG());
  const bounds = page.getBounds();
  const w = Math.round(bounds.x1 * scale);
  const h = Math.round(bounds.y1 * scale);
  const outFile = join(outDir, `${name}.png`);
  fs.writeFileSync(outFile, pngData);
  console.log(`${name}: ${w}x${h}px → ${Math.round(pngData.length/1024)}KB`);
}
console.log('Done!');
