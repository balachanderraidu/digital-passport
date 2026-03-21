'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Upload, HardDrive, FileText, FileImage, File, X,
  CloudUpload, Loader2, Eye, Lock, StickyNote, Calendar, Search,
} from 'lucide-react'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import {
  subscribeAllVaultCategories,
  addVaultDoc,
  type VaultDoc,
  VAULT_CATEGORIES,
} from '@/lib/firestore'
import { addEvent } from '@/lib/firestore'
import { uploadVaultFile } from '@/lib/storage'
import { DEMO_VAULT_DOCS } from '@/lib/demo-data'

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; border: string }> = {
  ownership:   { label: 'Ownership',   icon: '🏠', color: 'bg-gold-500/15 text-gold-400 border-gold-500/30',     border: 'border-gold-500/20'   },
  maintenance: { label: 'Maintenance', icon: '🔧', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     border: 'border-blue-500/20'   },
  interior:    { label: 'Interior',    icon: '🎨', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', border: 'border-purple-500/20' },
  tax:         { label: 'Tax',         icon: '🧾', color: 'bg-green-500/15 text-green-400 border-green-500/30',   border: 'border-green-500/20'  },
  manuals:     { label: 'Manuals',     icon: '📘', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',     border: 'border-cyan-500/20'   },
  warranties:  { label: 'Warranties',  icon: '🛡️', color: 'bg-red-500/15 text-red-400 border-red-500/30',        border: 'border-red-500/20'    },
}

const STORAGE_TOTAL_BYTES = 10 * 1024 * 1024 * 1024

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf')   return <FileText  size={18} className="text-red-400" />
  if (type === 'image') return <FileImage size={18} className="text-blue-400" />
  return <File size={18} className="text-vault-text-muted" />
}

// ─── Document Preview Sheet ───────────────────────────────────────────────────

function DocPreviewSheet({ doc, onClose }: { doc: VaultDoc | null; onClose: () => void }) {
  useEffect(() => {
    if (doc) document.body.style.overflow = 'hidden'
    else     document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [doc])

  if (!doc) return null
  const meta = CATEGORY_META[doc.category]

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border shadow-2xl"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1) forwards' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-vault-muted rounded-full" />
        </div>
        <div className="px-5 pt-1 pb-3 border-b border-vault-border flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-vault-muted/30 flex items-center justify-center flex-shrink-0 text-2xl">
            {meta?.icon ?? '📎'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight">{doc.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', meta?.color ?? 'border-vault-border text-vault-text-muted')}>
                {meta?.label}
              </span>
              {doc.ocr && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500">
                  OCR Indexed ✓
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-vault-muted/30 flex items-center justify-center">
            <X size={16} className="text-vault-text-muted" />
          </button>
        </div>

        <div className="px-5 py-3 space-y-2.5">
          {[
            { icon: HardDrive, label: 'File Size', value: formatFileSize(doc.size) },
            { icon: File,      label: 'Type',      value: (doc.type ?? 'pdf').toUpperCase() },
            { icon: Calendar,  label: 'Added',     value: doc.createdAt ? formatDate(doc.createdAt.toDate().toISOString()) : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-vault-card/60 border border-vault-border">
              <Icon size={14} className="text-vault-text-muted flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest">{label}</p>
                <p className="text-xs font-semibold text-vault-text mt-0.5">{value}</p>
              </div>
            </div>
          ))}
          {doc.notes && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-vault-card/60 border border-vault-border">
              <StickyNote size={14} className="text-vault-text-muted flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest">Notes</p>
                <p className="text-xs text-vault-text mt-0.5 leading-relaxed">{doc.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-8 pt-1 grid grid-cols-2 gap-3">
          {doc.url ? (
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm">
              <Eye size={16} /> View File ↗
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl glass gold-border font-semibold text-sm text-vault-text-muted">
              <Lock size={14} /> Demo Only
            </div>
          )}
          <button onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl glass gold-border font-semibold text-sm text-vault-text">
            Close
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </>
  )
}

// ─── Demo Upload Prompt ───────────────────────────────────────────────────────

function DemoUploadSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border shadow-2xl px-6 pb-10"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1) forwards' }}
      >
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-vault-muted rounded-full" />
        </div>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-white">Sign In to Upload</h3>
          <p className="text-sm text-vault-text-muted mt-2 leading-relaxed max-w-xs mx-auto">
            Create your Digital Passport to securely store property documents and access them from anywhere.
          </p>
        </div>
        <Link href="/login"
          className="block w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm text-center mb-2">
          Create Free Account →
        </Link>
        <button onClick={onClose} className="w-full py-3 text-sm font-semibold text-vault-text-muted">
          Continue Exploring
        </button>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  const [vaultData, setVaultData] = useState<Record<string, VaultDoc[]>>({})
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ownership')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<VaultDoc | null>(null)
  const [showDemoPrompt, setShowDemoPrompt] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDemo = !authLoading && !user

  useEffect(() => { if (isDemo) setVaultData(DEMO_VAULT_DOCS) }, [isDemo])
  useEffect(() => {
    if (!user) return
    return subscribeAllVaultCategories(user.uid, setVaultData, activePropertyId)
  }, [user, activePropertyId])

  // Check URL for quick action triggers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('upload=true')) {
      if (isDemo) setShowDemoPrompt(true)
      else setUploading(true)
    }
  }, [isDemo])

  const allDocs = Object.values(vaultData).flat()
  const totalBytes = allDocs.reduce((sum, d) => sum + (d.size || 0), 0)
  const storagePct = Math.min((totalBytes / STORAGE_TOTAL_BYTES) * 100, 100)
  const storageUsedGB = (totalBytes / (1024 ** 3)).toFixed(2)

  // Filter + search
  const filteredDocs = allDocs
    .filter(d => activeFilter === 'all' || d.category === activeFilter)
    .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.notes ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))

  async function handleUpload() {
    if (!user || !selectedFile) return
    setSaving(true)
    try {
      const { url, size, type } = await uploadVaultFile(user.uid, selectedCategory, selectedFile)
      await addVaultDoc(user.uid, selectedCategory, {
        name: selectedFile.name, type, size, url, ocr: false, notes, category: selectedCategory,
      }, activePropertyId)
      await addEvent(user.uid, {
        type: 'vault_upload', title: selectedFile.name,
        subtitle: CATEGORY_META[selectedCategory].label,
        icon: CATEGORY_META[selectedCategory].icon,
      }, activePropertyId)
      setSelectedFile(null); setNotes(''); setUploading(false)
    } catch (err) {
      console.error('Upload failed', err)
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-dvh bg-vault-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Home Vault</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">All your property documents in one place</p>
          </div>
          <button
            onClick={() => isDemo ? setShowDemoPrompt(true) : setUploading(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Upload size={15} /> Upload
          </button>
        </div>

        {/* Storage meter */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gold-500" />
              <span className="text-sm font-semibold text-vault-text">Vault Storage</span>
            </div>
            <span className="text-xs text-vault-text-muted">{storageUsedGB} GB / 10 GB</span>
          </div>
          <div className="h-2 bg-vault-muted rounded-full overflow-hidden">
            <div className="h-full bg-gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${Math.max(storagePct, 0.3)}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-vault-text-muted">{allDocs.length} files · {(10 - parseFloat(storageUsedGB)).toFixed(2)} GB remaining</p>
            {isDemo && <span className="text-[9px] text-vault-text-muted italic">Sample data</span>}
          </div>
        </div>
      </div>

      {/* ── Search + filter pills ───────────────────────────────────────────── */}
      <div className="px-5 mt-2">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-vault-muted/30 border border-vault-border text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-gold-500/40 transition-all"
          />
        </div>

        {/* Category pill filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all flex-shrink-0',
              activeFilter === 'all'
                ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                : 'bg-vault-muted/20 text-vault-text-muted border-vault-border hover:border-gold-500/30'
            )}
          >
            All <span className="text-[9px]">({allDocs.length})</span>
          </button>
          {VAULT_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat]
            const count = vaultData[cat]?.length ?? 0
            if (count === 0 && !isDemo) return null
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(activeFilter === cat ? 'all' : cat)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all flex-shrink-0',
                  activeFilter === cat ? meta.color : 'bg-vault-muted/20 text-vault-text-muted border-vault-border hover:border-gold-500/30'
                )}
              >
                {meta.icon} {meta.label} <span className="text-[9px]">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Unified document list ───────────────────────────────────────────── */}
      <div className="px-5 mt-3 pb-28">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 text-vault-text-muted">
            <span className="text-4xl block mb-3">📂</span>
            <p className="text-sm font-medium">{searchQuery ? 'No documents match your search' : 'No documents yet'}</p>
            {!searchQuery && <p className="text-xs mt-1">Tap Upload to add your first file</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map(d => {
              const meta = CATEGORY_META[d.category]
              return (
                <button
                  key={d.id}
                  onClick={() => setPreviewDoc(d)}
                  className="w-full card p-3.5 flex items-center gap-3 text-left hover:border-gold-500/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0">
                    <FileIcon type={d.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-vault-text truncate">{d.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md border', meta?.color ?? 'text-vault-text-muted border-vault-border')}>
                        {meta?.icon} {meta?.label}
                      </span>
                      <span className="text-[9px] text-vault-text-muted">{formatFileSize(d.size)}</span>
                      {d.ocr && <span className="text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded-md">OCR ✓</span>}
                      {d.notes && <span className="text-[10px] text-vault-text-muted truncate max-w-[160px]">{d.notes}</span>}
                    </div>
                  </div>
                  <Eye size={14} className="text-vault-text-muted flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <DocPreviewSheet doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      {showDemoPrompt && <DemoUploadSheet onClose={() => setShowDemoPrompt(false)} />}

      {/* Upload drawer (real users only) */}
      {uploading && !isDemo && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => !saving && setUploading(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-vault-muted" /></div>
            <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Upload Document</h3>
                  <p className="text-xs text-vault-text-muted mt-0.5">Add to your secure vault</p>
                </div>
                <button onClick={() => setUploading(false)} disabled={saving} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
                  <X size={16} className="text-vault-text-muted" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,image/*,.doc,.docx" className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
              <div onClick={() => fileInputRef.current?.click()}
                className={cn('border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 mb-5 cursor-pointer transition-all',
                  selectedFile ? 'border-gold-500/60 bg-gold-500/5' : 'border-vault-border hover:border-gold-500/40')}>
                <CloudUpload size={36} className="text-gold-500" />
                {selectedFile ? (
                  <><p className="text-sm font-bold text-vault-text text-center">{selectedFile.name}</p>
                    <p className="text-xs text-gold-500">{formatFileSize(selectedFile.size)} · tap to change</p></>
                ) : (
                  <><p className="text-sm font-bold text-vault-text">Tap to select file</p>
                    <p className="text-xs text-vault-text-muted">PDF, JPG, PNG, DOC up to 50 MB</p></>
                )}
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {VAULT_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={cn('py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2',
                        selectedCategory === cat ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-vault-border text-vault-text-muted hover:border-gold-500/40')}>
                      <span>{CATEGORY_META[cat].icon}</span>{CATEGORY_META[cat].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Note (optional)</label>
                <textarea className="w-full px-4 py-3.5 text-sm rounded-2xl resize-none" rows={3}
                  placeholder="Add a description…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <button onClick={handleUpload} disabled={saving || !selectedFile}
                className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : 'Upload Document'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
