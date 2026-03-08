'use client'

import { useState, useEffect } from 'react'
import { Clock, Copy, Trash2, Plus, Shield, Eye, Check, Loader2, X, AlertTriangle } from 'lucide-react'
import { cn, formatCountdown } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { subscribeShareLinks, createShareLink, revokeShareLink, type ShareLink } from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'

const EXPIRY_OPTIONS: { label: string; hours: number }[] = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 168 },
]

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" onClick={onCancel} />
      <div className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-50 card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white">Confirm Revoke</h3>
        </div>
        <p className="text-sm text-vault-text-muted mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl glass gold-border text-sm font-semibold text-vault-text">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500/80 text-sm font-bold text-white hover:bg-red-500 transition-colors">
            Revoke Link
          </button>
        </div>
      </div>
    </>
  )
}

function CreateModal({ uid, pid, open, onClose }: { uid: string; pid: string; open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ recipient: '', scope: '', password: false, expiryHours: 48, watermark: false })
  const [linkToken, setLinkToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  if (!open) return null

  async function generate() {
    setGenerating(true)
    try {
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + config.expiryHours * 60 * 60 * 1000))
      const result = await createShareLink(uid, {
        recipient: config.recipient,
        scope: config.scope,
        expiresAt,
        passwordProtected: config.password,
        watermark: config.watermark,
      }, pid)
      setLinkToken(result.token)
      setStep(3)
    } finally {
      setGenerating(false)
    }
  }

  const shareUrl = `https://digitalpassport.peroneira.com/view/${linkToken}`

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setStep(1)
    setConfig({ recipient: '', scope: '', password: false, expiryHours: 48, watermark: false })
    setLinkToken('')
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={handleClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-vault-muted" /></div>
        <div className="px-6 pb-10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-white">
              {step === 1 && 'Select Document'}
              {step === 2 && 'Configure Access'}
              {step === 3 && 'Secure Link Ready'}
            </h3>
            <button onClick={handleClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
              <X size={15} className="text-vault-text-muted" />
            </button>
          </div>
          <p className="text-xs text-vault-text-muted mb-5">Step {Math.min(step, 3)} of 3</p>
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((s) => <div key={s} className={cn('h-1 flex-1 rounded-full transition-all', s <= step ? 'bg-gold-500' : 'bg-vault-muted')} />)}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Recipient</label>
                <input className="w-full px-4 py-3.5 text-sm rounded-2xl" placeholder="Vendor / contractor name" value={config.recipient} onChange={(e) => setConfig({ ...config, recipient: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Document / Scope</label>
                <input className="w-full px-4 py-3.5 text-sm rounded-2xl" placeholder="e.g. Bathroom specs, AC manual..." value={config.scope} onChange={(e) => setConfig({ ...config, scope: e.target.value })} />
              </div>
              <button onClick={() => setStep(2)} disabled={!config.recipient || !config.scope} className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm disabled:opacity-40 hover:shadow-gold-glow transition-all mt-2">
                Next: Configure Access →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[
                { key: 'password', icon: '🔒', label: 'Password Protection', desc: 'Require a PIN to open' },
                { key: 'watermark', icon: '💧', label: '"For Quotation Only" Watermark', desc: 'Visible on every page' },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} className="card p-4 flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-vault-text">{label}</p>
                    <p className="text-xs text-vault-text-muted mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => setConfig({ ...config, [key]: !(config as Record<string, unknown>)[key] })} className={cn('w-12 h-6 rounded-full transition-all relative', (config as Record<string, unknown>)[key] ? 'bg-gold-500' : 'bg-vault-muted')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', (config as Record<string, unknown>)[key] ? 'left-6' : 'left-0.5')} />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Link Expiry</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button key={opt.label} onClick={() => setConfig({ ...config, expiryHours: opt.hours })} className={cn('py-2.5 rounded-xl font-bold text-sm transition-all', config.expiryHours === opt.hours ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm' : 'card text-vault-text-muted hover:text-vault-text')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generate} disabled={generating} className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {generating ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : 'Generate Secure Link'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="card p-4 border-green-500/20 bg-green-500/5 text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-sm font-bold text-green-400">Secure link created successfully</p>
                <p className="text-xs text-vault-text-muted mt-1">Expires in {EXPIRY_OPTIONS.find((o) => o.hours === config.expiryHours)?.label}</p>
              </div>
              <div className="glass-gold gold-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-gold-500 mb-1.5">Your Secure Link</p>
                <p className="text-sm font-mono text-vault-text break-all">{shareUrl}</p>
              </div>
              <button onClick={handleCopy} className={cn('w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all', copied ? 'bg-green-500 text-white' : 'bg-gold-gradient text-charcoal-300 hover:shadow-gold-glow')}>
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
              <button onClick={handleClose} className="w-full py-3 rounded-2xl glass gold-border text-vault-text font-semibold text-sm">Done</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function SharePage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  const [showCreate, setShowCreate] = useState(false)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeShareLinks(user.uid, (data) => {
      setLinks(data)
      setLoading(false)
    }, activePropertyId)
    return unsub
  }, [user, activePropertyId])

  async function handleRevoke(id: string) {
    if (!user) return
    await revokeShareLink(user.uid, id, activePropertyId)
    setRevokeTarget(null)
  }

  function isExpired(link: ShareLink) {
    return link.expiresAt.toDate() < new Date()
  }

  if (authLoading) {
    return <div className="min-h-dvh bg-vault-bg flex items-center justify-center"><Loader2 size={28} className="text-gold-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-dvh bg-vault-bg">
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Secure Share</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Burn after reading · Magic Links</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all">
            <Plus size={15} /> New Link
          </button>
        </div>
      </div>

      <div className="px-5 mt-2 pb-28">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Active Links</h2>
          <span className="text-xs text-gold-500 font-semibold">{links.filter((l) => !isExpired(l) && l.status === 'active').length} active</span>
        </div>

        {loading && <div className="flex flex-col items-center py-12 gap-3"><Loader2 size={28} className="text-gold-500 animate-spin" /><p className="text-sm text-vault-text-muted">Loading links…</p></div>}

        {!loading && links.length === 0 && (
          <div className="text-center py-16 text-vault-text-muted">
            <span className="text-4xl block mb-3">🔗</span>
            <p className="text-sm font-medium">No share links yet</p>
            <p className="text-xs mt-1">Create a secure link to share documents</p>
          </div>
        )}

        <div className="space-y-3">
          {links.map((link) => {
            const expired = isExpired(link) || link.status !== 'active'
            return (
              <div key={link.id} className={cn('card p-4', expired && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={14} className={expired ? 'text-vault-text-muted' : 'text-gold-500'} />
                      <p className="text-sm font-bold text-vault-text truncate">{link.recipient}</p>
                    </div>
                    <p className="text-xs text-vault-text-muted truncate">{link.scope}</p>
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {!expired ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-gold-500"><Clock size={12} />{formatCountdown(link.expiresAt.toDate())}</div>
                      ) : (
                        <span className="text-xs font-semibold text-red-400">Expired</span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-vault-text-muted"><Eye size={12} />{link.views} views</div>
                      {link.passwordProtected && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">🔒 Protected</span>}
                      {link.watermark && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">💧 Watermark</span>}
                    </div>
                  </div>
                  {!expired && (
                    <button onClick={() => setRevokeTarget(link.id)} className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 hover:bg-red-500/20 transition-all">
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {user && <CreateModal uid={user.uid} pid={activePropertyId} open={showCreate} onClose={() => setShowCreate(false)} />}
      {revokeTarget && (
        <ConfirmModal
          message="Recipients will lose access to this link immediately. This cannot be undone."
          onConfirm={() => handleRevoke(revokeTarget)}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  )
}
