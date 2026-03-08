'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Upload, HardDrive, ChevronRight, FileText, FileImage, File, X, CloudUpload, Loader2 } from 'lucide-react'
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

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; border: string }> = {
  ownership:   { label: 'Ownership Docs',   icon: '🏠', color: 'from-gold-500/20 to-gold-500/5',     border: 'border-gold-500/20' },
  maintenance: { label: 'Maintenance Logs', icon: '🔧', color: 'from-blue-500/20 to-blue-500/5',    border: 'border-blue-500/20' },
  interior:    { label: 'Interior Specs',   icon: '🎨', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20' },
  tax:         { label: 'Tax & Invoices',   icon: '🧾', color: 'from-green-500/20 to-green-500/5',   border: 'border-green-500/20' },
  manuals:     { label: 'Tech Manuals',     icon: '📘', color: 'from-cyan-500/20 to-cyan-500/5',     border: 'border-cyan-500/20' },
  warranties:  { label: 'Warranties',       icon: '🛡️', color: 'from-red-500/20 to-red-500/5',       border: 'border-red-500/20' },
}

const STORAGE_TOTAL_BYTES = 10 * 1024 * 1024 * 1024 // 10 GB

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText size={18} className="text-red-400" />
  if (type === 'image') return <FileImage size={18} className="text-blue-400" />
  return <File size={18} className="text-vault-text-muted" />
}

export default function VaultPage() {
  const { user } = useAuth()
  const { activePropertyId } = useProperty()
  const [vaultData, setVaultData] = useState<Record<string, VaultDoc[]>>({})
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ownership')
  const [notes, setNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeAllVaultCategories(user.uid, setVaultData, activePropertyId)
    return unsub
  }, [user, activePropertyId])

  // Derive stats
  const allDocs = Object.values(vaultData).flat()
  const totalBytes = allDocs.reduce((sum, d) => sum + (d.size || 0), 0)
  const storagePct = Math.min((totalBytes / STORAGE_TOTAL_BYTES) * 100, 100)
  const storageUsedGB = (totalBytes / (1024 ** 3)).toFixed(2)

  // Recent docs: last 5 across all categories
  const recentDocs = [...allDocs]
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis() ?? 0
      const tb = b.createdAt?.toMillis() ?? 0
      return tb - ta
    })
    .slice(0, 5)

  async function handleUpload() {
    if (!user || !selectedFile) return
    setSaving(true)
    try {
      const { url, size, type } = await uploadVaultFile(user.uid, selectedCategory, selectedFile)
      await addVaultDoc(user.uid, selectedCategory, {
        name: selectedFile.name,
        type,
        size,
        url,
        ocr: false,
        notes,
        category: selectedCategory,
      }, activePropertyId)
      await addEvent(user.uid, {
        type: 'vault_upload',
        title: selectedFile.name,
        subtitle: CATEGORY_META[selectedCategory].label,
        icon: CATEGORY_META[selectedCategory].icon,
      }, activePropertyId)
      setSelectedFile(null)
      setNotes('')
      setUploading(false)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setSaving(false)
    }
  }

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

        {/* Live storage meter */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-gold-500" />
              <span className="text-sm font-semibold text-vault-text">Vault Storage</span>
            </div>
            <span className="text-xs font-medium text-vault-text-muted">
              {storageUsedGB} GB of 10 GB used
            </span>
          </div>
          <div className="h-2 bg-vault-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <p className="text-[10px] text-vault-text-muted mt-1.5">
            {(10 - parseFloat(storageUsedGB)).toFixed(2)} GB remaining · {allDocs.length} files
          </p>
        </div>
      </div>

      {/* Category grid — live counts */}
      <div className="px-5 mt-2">
        <h2 className="text-sm font-bold text-white mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {VAULT_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat]
            const count = vaultData[cat]?.length ?? 0
            return (
              <Link
                key={cat}
                href={`/vault/${cat}`}
                className={cn(
                  'relative rounded-2xl border p-4 bg-gradient-to-br overflow-hidden',
                  'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                  meta.color, meta.border
                )}
              >
                <div className="text-2xl mb-2">{meta.icon}</div>
                <p className="text-sm font-bold text-vault-text leading-tight">{meta.label}</p>
                <p className="text-xs text-vault-text-muted mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                <ChevronRight
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted"
                />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent documents — live */}
      <div className="px-5 mt-5 pb-28">
        <h2 className="text-sm font-bold text-white mb-3">Recent Documents</h2>
        {recentDocs.length === 0 ? (
          <div className="text-center py-10 text-vault-text-muted">
            <span className="text-4xl block mb-3">📂</span>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">Tap Upload to add your first file</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentDocs.map((d) => (
              <Link
                key={d.id}
                href={`/vault/${d.category}/${d.id}`}
                className="card p-3.5 flex items-center gap-3 card-hover block"
              >
                <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0">
                  <FileIcon type={d.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-vault-text truncate">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-vault-text-muted">{formatFileSize(d.size)}</span>
                    <span className="text-vault-border">·</span>
                    <span className="text-xs text-vault-text-muted">
                      {CATEGORY_META[d.category]?.icon} {CATEGORY_META[d.category]?.label}
                    </span>
                    {d.ocr && (
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
        )}
      </div>

      {/* Upload Drawer */}
      {uploading && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={() => !saving && setUploading(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-vault-muted" />
            </div>
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

              {/* File picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 mb-5 cursor-pointer transition-all',
                  selectedFile ? 'border-gold-500/60 bg-gold-500/5' : 'border-vault-border hover:border-gold-500/40'
                )}
              >
                <CloudUpload size={36} className="text-gold-500" />
                {selectedFile ? (
                  <>
                    <p className="text-sm font-bold text-vault-text text-center">{selectedFile.name}</p>
                    <p className="text-xs text-gold-500">{formatFileSize(selectedFile.size)} · tap to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-vault-text">Tap to select file</p>
                    <p className="text-xs text-vault-text-muted">PDF, JPG, PNG, DOC up to 50 MB</p>
                  </>
                )}
              </div>

              {/* Category selector */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {VAULT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2',
                        selectedCategory === cat
                          ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                          : 'border-vault-border text-vault-text-muted hover:border-gold-500/40 hover:text-vault-text'
                      )}
                    >
                      <span>{CATEGORY_META[cat].icon}</span>
                      {CATEGORY_META[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Note (optional)</label>
                <textarea
                  className="w-full px-4 py-3.5 text-sm rounded-2xl resize-none"
                  rows={3}
                  placeholder="Add a description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={saving || !selectedFile}
                className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : 'Upload Document'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
