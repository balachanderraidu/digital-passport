/**
 * mupdf-render.js — Pure JS helper (not compiled by TypeScript) for mupdf PDF rendering.
 * Imported from index.ts via require('./mupdf-render').
 */

'use strict'

/**
 * Render a single PDF page to a PNG Buffer using mupdf (WebAssembly).
 * @param {Buffer} pdfBuffer  - raw bytes of the PDF
 * @param {number} pageIndex  - 0-based page index
 * @param {number} dpi        - output resolution (default 100)
 * @returns {Promise<Buffer>} PNG image as a Node.js Buffer
 */
async function renderPdfPageToPng(pdfBuffer, pageIndex, dpi = 100) {
  const mupdf = await import('mupdf')
  const lib = mupdf.default ?? mupdf
  const doc  = lib.Document.openDocument(pdfBuffer, 'application/pdf')
  const page = doc.loadPage(pageIndex)
  const matrix  = lib.Matrix.scale(dpi / 72, dpi / 72)
  const pixmap  = page.toPixmap(matrix, lib.ColorSpace.DeviceRGB, false, true)
  return Buffer.from(pixmap.asPNG())
}

module.exports = { renderPdfPageToPng }
