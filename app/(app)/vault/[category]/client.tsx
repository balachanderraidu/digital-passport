'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, FileImage, File, ChevronRight, Upload } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  ownership: { label: 'Ownership Docs', icon: '🏠' },
  maintenance: { label: 'Maintenance Logs', icon: '🔧' },
  interior: { label: 'Interior Specs', icon: '🎨' },
  tax: { label: 'Tax & Invoices', icon: '🧾' },
  manuals: { label: 'Tech Manuals', icon: '📘' },
  warranties: { label: 'Warranties', icon: '🛡️' },
}

const DEMO_DOCS: Record<string, { id: string; name: string; type: string; size: number; date: string; ocr: boolean }[]> = {
  ownership: [
    { id: 'doc-001', name: 'Sale Deed — Final.pdf', type: 'pdf', size: 2840000, date: '2026-03-04', ocr: true },
    { id: 'doc-002', name: 'Possession Letter.pdf', type: 'pdf', size: 890000, date: '2023-06-15', ocr: true },
    { id: 'doc-003', name: 'Home Loan Sanction Letter.pdf', type: 'pdf', size: 1200000, date: '2022-11-20', ocr: false },
    { id: 'doc-004', name: 'Society NOC.pdf', type: 'pdf', size: 340000, date: '2023-07-01', ocr: false },
  ],
  maintenance: [
    { id: 'doc-001', name: 'AC Service Report Jan 2026.pdf', type: 'pdf', size: 540000, date: '2026-01-12', ocr: true },
    { id: 'doc-002', name: 'Plumbing Repair Invoice.pdf', type: 'pdf', size: 220000, date: '2025-09-08', ocr: true },
    { id: 'doc-003', name: 'Annual AMC Agreement.pdf', type: 'pdf', size: 1100000, date: '2025-04-01', ocr: false },
    { id: 'doc-004', name: 'Pest Control Certificate.pdf', type: 'pdf', size: 190000, date: '2025-11-15', ocr: false },
    { id: 'doc-005', name: 'Electrical Panel Inspection.pdf', type: 'pdf', size: 670000, date: '2024-03-22', ocr: true },
  ],
  interior: [
    { id: 'doc-001', name: 'Floor Plan — Unit 12B.png', type: 'image', size: 4200000, date: '2025-12-20', ocr: false },
    { id: 'doc-002', name: 'Paint Scheme — All Rooms.pdf', type: 'pdf', size: 880000, date: '2023-02-10', ocr: false },
    { id: 'doc-003', name: 'Furniture Layout — Living.png', type: 'image', size: 2800000, date: '2023-03-15', ocr: false },
    { id: 'doc-004', name: 'Modular Kitchen Specs.pdf', type: 'pdf', size: 1500000, date: '2023-01-25', ocr: false },
    { id: 'doc-005', name: 'Lighting Design — Electrical.pdf', type: 'pdf', size: 2100000, date: '2023-02-28', ocr: false },
    { id: 'doc-006', name: 'Wardrobe Design Drawing.pdf', type: 'pdf', size: 950000, date: '2023-02-15', ocr: false },
  ],
  tax: [
    { id: 'doc-001', name: 'Property Tax FY25–26.pdf', type: 'pdf', size: 320000, date: '2025-04-15', ocr: true },
    { id: 'doc-002', name: 'Society Maintenance FY25–26.pdf', type: 'pdf', size: 280000, date: '2025-04-01', ocr: false },
    { id: 'doc-003', name: 'Interior GST Invoice.pdf', type: 'pdf', size: 740000, date: '2023-05-12', ocr: true },
    { id: 'doc-004', name: 'Stamp Duty Receipt.pdf', type: 'pdf', size: 190000, date: '2023-06-14', ocr: false },
  ],
  manuals: [
    { id: 'doc-001', name: 'Daikin AC Manual.pdf', type: 'pdf', size: 12000000, date: '2023-04-15', ocr: false },
    { id: 'doc-002', name: 'Bosch Washer User Guide.pdf', type: 'pdf', size: 8700000, date: '2023-04-01', ocr: false },
    { id: 'doc-003', name: 'Sony Bravia Setup Guide.pdf', type: 'pdf', size: 6200000, date: '2023-05-10', ocr: false },
    { id: 'doc-004', name: 'Elica Hob Manual.pdf', type: 'pdf', size: 3400000, date: '2023-03-12', ocr: false },
  ],
  warranties: [
    { id: 'doc-001', name: 'Daikin AC Warranty Card.pdf', type: 'pdf', size: 340000, date: '2023-04-15', ocr: true },
    { id: 'doc-002', name: 'Sony Bravia Warranty.pdf', type: 'pdf', size: 280000, date: '2023-05-10', ocr: false },
    { id: 'doc-003', name: 'Bosch Washer Warranty.pdf', type: 'pdf', size: 310000, date: '2023-04-01', ocr: false },
    { id: 'doc-004', name: 'Spacewood Wardrobe Warranty.pdf', type: 'pdf', size: 490000, date: '2023-02-28', ocr: true },
  ],
}

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText size={18} className="text-red-400" />
  if (type === 'image') return <FileImage size={18} className="text-blue-400" />
  return <File size={18} className="text-vault-text-muted" />
}

export default function VaultCategoryClient({ category }: { category: string }) {
  const router = useRouter()
  const meta = CATEGORY_META[category] ?? { label: category, icon: '📁' }
  const docs = DEMO_DOCS[category] ?? []

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
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.icon}</span>
              <h1 className="text-xl font-bold text-white">{meta.label}</h1>
            </div>
            <p className="text-xs text-vault-text-muted mt-0.5">{docs.length} documents</p>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="px-5 mt-2 pb-28 space-y-2.5">
        {docs.length === 0 && (
          <div className="text-center py-16 text-vault-text-muted">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">Tap Upload to add your first file</p>
          </div>
        )}
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/vault/${category}/${doc.id}`}
            className="card p-3.5 flex items-center gap-3 card-hover block"
          >
            <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0">
              <FileIcon type={doc.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-vault-text truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-vault-text-muted">{formatFileSize(doc.size)}</span>
                <span className="text-vault-border">·</span>
                <span className="text-xs text-vault-text-muted">{formatDate(doc.date)}</span>
                {doc.ocr && (
                  <>
                    <span className="text-vault-border">·</span>
                    <span className="text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded-md">OCR ✓</span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Upload FAB */}
      <button className="fixed bottom-24 right-5 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all shadow-card z-30">
        <Upload size={16} />
        Upload
      </button>
    </div>
  )
}
