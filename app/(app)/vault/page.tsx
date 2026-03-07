'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Upload, HardDrive, ChevronRight, FileText, FileImage, File } from 'lucide-react'
import { cn, formatDate, formatFileSize } from '@/lib/utils'

const CATEGORIES = [
  { id: 'ownership', label: 'Ownership Docs', icon: '🏠', count: 4, color: 'from-gold-500/20 to-gold-500/5', border: 'border-gold-500/20' },
  { id: 'maintenance', label: 'Maintenance Logs', icon: '🔧', count: 12, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20' },
  { id: 'interior', label: 'Interior Specs', icon: '🎨', count: 8, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20' },
  { id: 'tax', label: 'Tax & Invoices', icon: '🧾', count: 21, color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/20' },
  { id: 'manuals', label: 'Tech Manuals', icon: '📘', count: 9, color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20' },
  { id: 'warranties', label: 'Warranties', icon: '🛡️', count: 15, color: 'from-red-500/20 to-red-500/5', border: 'border-red-500/20' },
]

const RECENT_DOCS = [
  { name: 'Sale Deed — Final.pdf', type: 'pdf', size: 2840000, date: '2026-03-04', category: 'ownership', ocr: true },
  { name: 'AC Service Report Jan 2026.pdf', type: 'pdf', size: 540000, date: '2026-01-12', category: 'maintenance', ocr: true },
  { name: 'Floor Plan — Unit 12B.png', type: 'image', size: 4200000, date: '2025-12-20', category: 'interior', ocr: false },
  { name: 'Daikin AC Manual.pdf', type: 'pdf', size: 12000000, date: '2023-04-15', category: 'manuals', ocr: false },
]

const STORAGE_USED_GB = 1.2
const STORAGE_TOTAL_GB = 10
const STORAGE_PCT = (STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText size={18} className="text-red-400" />
  if (type === 'image') return <FileImage size={18} className="text-blue-400" />
  return <File size={18} className="text-vault-text-muted" />
}

export default function VaultPage() {
  const [uploading, setUploading] = useState(false)

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Home Vault</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Secure document repository</p>
          </div>
          <button
            onClick={() => setUploading(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Upload size={15} />
            Upload
          </button>
        </div>

        {/* Storage meter */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gold-500" />
              <span className="text-sm font-semibold text-vault-text">Vault Storage</span>
            </div>
            <span className="text-xs font-medium text-vault-text-muted">
              {STORAGE_USED_GB} GB of {STORAGE_TOTAL_GB} GB used
            </span>
          </div>
          <div className="h-2 bg-vault-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient rounded-full transition-all duration-500"
              style={{ width: `${STORAGE_PCT}%` }}
            />
          </div>
          <p className="text-[10px] text-vault-text-muted mt-1.5">
            {(STORAGE_TOTAL_GB - STORAGE_USED_GB).toFixed(1)} GB remaining
          </p>
        </div>
      </div>

      {/* Category grid */}
      <div className="px-5 mt-2">
        <h2 className="text-sm font-bold text-white mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/vault/${cat.id}`}
              className={cn(
                'relative rounded-2xl border p-4 bg-gradient-to-br overflow-hidden',
                'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                cat.color, cat.border
              )}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className="text-sm font-bold text-vault-text leading-tight">{cat.label}</p>
              <p className="text-xs text-vault-text-muted mt-0.5">{cat.count} files</p>
              <ChevronRight
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      <div className="px-5 mt-5 pb-4">
        <h2 className="text-sm font-bold text-white mb-3">Recent Documents</h2>
        <div className="space-y-2.5">
          {RECENT_DOCS.map((doc) => (
            <Link
              key={doc.name}
              href={`/vault/${doc.category}/doc-001`}
              className="card p-3.5 flex items-center gap-3 card-hover block"
            >
              <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0">
                <FileIcon type={doc.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-vault-text truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-vault-text-muted">{formatFileSize(doc.size)}</span>
                  <span className="text-vault-border">·</span>
                  <span className="text-xs text-vault-text-muted">{formatDate(doc.date)}</span>
                  {doc.ocr && (
                    <>
                      <span className="text-vault-border">·</span>
                      <span className="text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded-md">
                        OCR ✓
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
