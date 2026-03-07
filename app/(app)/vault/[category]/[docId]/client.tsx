'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Maximize2, Trash2, FileText, FileImage } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  ownership: { label: 'Ownership Docs', icon: '🏠' },
  maintenance: { label: 'Maintenance Logs', icon: '🔧' },
  interior: { label: 'Interior Specs', icon: '🎨' },
  tax: { label: 'Tax & Invoices', icon: '🧾' },
  manuals: { label: 'Tech Manuals', icon: '📘' },
  warranties: { label: 'Warranties', icon: '🛡️' },
}

const DEMO_DOCS: Record<string, { name: string; type: string; size: number; date: string; ocr: boolean }> = {
  'doc-001': { name: 'Sale Deed — Final.pdf', type: 'pdf', size: 2840000, date: '2026-03-04', ocr: true },
  'doc-002': { name: 'Possession Letter.pdf', type: 'pdf', size: 890000, date: '2023-06-15', ocr: true },
  'doc-003': { name: 'Home Loan Sanction Letter.pdf', type: 'pdf', size: 1200000, date: '2022-11-20', ocr: false },
  'doc-004': { name: 'Society NOC.pdf', type: 'pdf', size: 340000, date: '2023-07-01', ocr: false },
  'doc-005': { name: 'Electrical Panel Inspection.pdf', type: 'pdf', size: 670000, date: '2024-03-22', ocr: true },
  'doc-006': { name: 'Wardrobe Design Drawing.pdf', type: 'pdf', size: 950000, date: '2023-02-15', ocr: false },
}

export default function VaultDocClient({ category, docId }: { category: string; docId: string }) {
  const router = useRouter()
  const catMeta = CATEGORY_META[category] ?? { label: category, icon: '📁' }
  const doc = DEMO_DOCS[docId] ?? { name: docId, type: 'pdf', size: 0, date: '', ocr: false }

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-vault-text-muted" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate leading-tight">{doc.name}</h1>
            <p className="text-xs text-vault-text-muted mt-0.5">{catMeta.icon} {catMeta.label} · {formatFileSize(doc.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Share2 size={16} className="text-gold-500" />
            </button>
            <button className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Download size={16} className="text-gold-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* Document Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-vault-border bg-vault-surface mb-4" style={{ height: '280px' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {doc.type === 'image'
              ? <FileImage size={48} className="text-blue-400/40" />
              : <FileText size={48} className="text-red-400/40" />}
            <div className="text-center">
              <p className="text-sm font-bold text-white">{doc.name.split('.')[0].toUpperCase()}</p>
              <div className="mt-3 space-y-1.5 px-8">
                {[100, 80, 95, 70].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-vault-muted" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
          {doc.ocr && (
            <div className="absolute bottom-3 left-3">
              <span className="text-[10px] font-bold text-gold-500 bg-gold-500/15 border border-gold-500/30 px-2 py-1 rounded-lg">
                OCR Indexed ✓
              </span>
            </div>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { label: 'Category', value: catMeta.label },
            { label: 'File Size', value: formatFileSize(doc.size) },
            { label: 'Uploaded', value: doc.date ? formatDate(doc.date) : '—' },
            { label: 'Type', value: doc.type === 'pdf' ? 'PDF Document' : doc.type === 'image' ? 'Image File' : 'File' },
          ].map(({ label, value }) => (
            <div key={label} className="card p-3">
              <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest mb-1">{label}</p>
              <p className="text-xs font-bold text-vault-text">{value}</p>
            </div>
          ))}
          {doc.ocr && (
            <div className="col-span-2 card p-3 border-gold-500/20 bg-gold-500/5">
              <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest mb-1">OCR</p>
              <p className="text-xs font-bold text-gold-500">Enabled — Text Indexed ✓</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all">
            <Download size={16} />
            Download
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm hover:gold-border-active transition-all">
            <Share2 size={16} className="text-gold-500" />
            Share Link
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass text-vault-text font-semibold text-sm transition-all">
            <Maximize2 size={16} className="text-vault-text-muted" />
            Full Screen
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
