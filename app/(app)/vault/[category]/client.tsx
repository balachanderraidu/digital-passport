'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, FileImage, File, ChevronRight, Upload, X, Loader2, Trash2 } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { subscribeVaultDocs, addVaultDoc, deleteVaultDoc, type VaultDoc } from '@/lib/firestore'
import { uploadVaultFile } from '@/lib/storage'
import { cn } from '@/lib/utils'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  ownership: { label: 'Ownership Docs', icon: '🏠' },
  maintenance: { label: 'Maintenance Logs', icon: '🔧' },
  interior: { label: 'Interior Specs', icon: '🎨' },
  tax: { label: 'Tax & Invoices', icon: '🧾' },
  manuals: { label: 'Tech Manuals', icon: '📘' },
  warranties: { label: 'Warranties', icon: '🛡️' },
}

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText size={18} className="text-red-400" />
  if (type === 'image') return <FileImage size={18} className="text-blue-400" />
  return <File size={18} className="text-vault-text-muted" />
}

export default function VaultCategoryClient({ category }: { category: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const meta = CATEGORY_META[category] ?? { label: category, icon: '📁' }

  const [docs, setDocs] = useState<VaultDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeVaultDocs(user.uid, category, (data) => {
      setDocs(data)
      setLoading(false)
    })
    return unsub
  }, [user, category])

  async function handleUpload() {
    if (!user || !file) return
    setUploading(true)
    try {
      const { url, size, type } = await uploadVaultFile(user.uid, category, file)
      await addVaultDoc(user.uid, category, {
        name: file.name,
        type,
        size,
        url,
        ocr: false,
        notes,
        category,
      })
      setFile(null)
      setNotes('')
      setShowUpload(false)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string, docName: string) {
    if (!user) return
    if (!confirm(`Delete "${docName}"? This cannot be undone.`)) return
    await deleteVaultDoc(user.uid, category, docId)
  }

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
            <p className="text-xs text-vault-text-muted mt-0.5">
              {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="px-5 mt-2 pb-28 space-y-2.5">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 size={28} className="text-gold-500 animate-spin" />
            <p className="text-sm text-vault-text-muted">Loading documents…</p>
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="text-center py-16 text-vault-text-muted">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">Tap Upload to add your first file</p>
          </div>
        )}

        {!loading && docs.map((doc) => (
          <div key={doc.id} className="relative group">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
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
                  <span className="text-xs text-vault-text-muted">
                    {doc.createdAt ? formatDate(doc.createdAt.toDate().toISOString().split('T')[0]) : '—'}
                  </span>
                  {doc.ocr && (
                    <>
                      <span className="text-vault-border">·</span>
                      <span className="text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded-md">OCR ✓</span>
                    </>
                  )}
                </div>
                {doc.notes && (
                  <p className="text-[10px] text-vault-text-muted mt-1 italic truncate">{doc.notes}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
            </a>
            <button
              onClick={() => handleDelete(doc.id, doc.name)}
              className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 items-center justify-center hidden group-hover:flex hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={13} className="text-red-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Upload FAB */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-5 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all shadow-card z-30"
      >
        <Upload size={16} />
        Upload
      </button>

      {/* Upload Drawer */}
      {showUpload && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setShowUpload(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-vault-muted" />
            </div>
            <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Upload Document</h3>
                  <p className="text-xs text-vault-text-muted mt-0.5">Add to {meta.label}</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
                  <X size={16} className="text-vault-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File picker */}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                    file ? 'border-gold-500/60 bg-gold-500/5' : 'border-vault-border hover:border-gold-500/30'
                  )}
                >
                  {file ? (
                    <>
                      <span className="text-3xl">📄</span>
                      <p className="text-sm font-semibold text-vault-text text-center">{file.name}</p>
                      <p className="text-xs text-vault-text-muted">{formatFileSize(file.size)}</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-vault-text-muted" />
                      <p className="text-sm text-vault-text-muted text-center">Tap to choose a file</p>
                      <p className="text-xs text-vault-muted">PDF, images, Word, Excel</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Notes (optional)</label>
                  <input
                    className="w-full px-4 py-3.5 text-sm rounded-2xl"
                    placeholder="e.g. Annual AC service report"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Upload File</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
