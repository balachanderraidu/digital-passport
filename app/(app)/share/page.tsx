'use client'

import { useState } from 'react'
import { Clock, Copy, Trash2, Plus, Shield, Eye, Check } from 'lucide-react'
import { cn, formatCountdown } from '@/lib/utils'

const ACTIVE_LINKS = [
  {
    id: 'lnk-001',
    recipient: 'Rahul Nair (Plumber)',
    scope: 'Bathroom Renovation Specs',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 36), // 36h
    protected: true,
    watermark: false,
    views: 2,
    status: 'active' as const,
  },
  {
    id: 'lnk-002',
    recipient: 'Aishwarya Interior Studio',
    scope: 'Living Room Floor Plan + Paint Spec',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 5), // 5h
    protected: false,
    watermark: true,
    views: 7,
    status: 'active' as const,
  },
  {
    id: 'lnk-003',
    recipient: 'Skyline HVAC Services',
    scope: 'AC Technical Manual',
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // expired 2h ago
    protected: false,
    watermark: false,
    views: 4,
    status: 'expired' as const,
  },
]

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

function CreateModal({ open, onClose }: CreateModalProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({
    recipient: '',
    scope: '',
    password: false,
    expiry: '48h',
    watermark: false,
  })
  const [linkGenerated, setLinkGenerated] = useState('')
  const [copied, setCopied] = useState(false)

  if (!open) return null

  function generate() {
    // In production: write to Firestore, generate real token
    const token = Math.random().toString(36).slice(2, 12).toUpperCase()
    setLinkGenerated(`https://passport.io/share/${token}`)
    setStep(3)
  }

  function handleCopy() {
    navigator.clipboard.writeText(linkGenerated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-vault-muted" />
        </div>
        <div className="px-6 pb-10">
          <h3 className="text-lg font-bold text-white mb-1">
            {step === 1 && 'Select Document'}
            {step === 2 && 'Configure Access'}
            {step === 3 && 'Secure Link Ready'}
          </h3>
          <p className="text-xs text-vault-text-muted mb-5">Step {Math.min(step, 3)} of 3</p>

          {/* Step progress */}
          <div className="flex gap-1.5 mb-6">
            {[1,2,3].map(s => (
              <div key={s} className={cn('h-1 flex-1 rounded-full transition-all', s <= step ? 'bg-gold-500' : 'bg-vault-muted')} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Recipient</label>
                <input
                  className="w-full px-4 py-3.5 text-sm rounded-2xl"
                  placeholder="Vendor / contractor name"
                  value={config.recipient}
                  onChange={e => setConfig({...config, recipient: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Document / Scope</label>
                <input
                  className="w-full px-4 py-3.5 text-sm rounded-2xl"
                  placeholder="e.g. Bathroom specs, AC manual..."
                  value={config.scope}
                  onChange={e => setConfig({...config, scope: e.target.value})}
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!config.recipient || !config.scope}
                className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm disabled:opacity-40 hover:shadow-gold-glow transition-all mt-2"
              >
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
                  <button
                    onClick={() => setConfig({...config, [key]: !(config as Record<string, unknown>)[key]})}
                    className={cn(
                      'w-12 h-6 rounded-full transition-all relative',
                      (config as Record<string, unknown>)[key] ? 'bg-gold-500' : 'bg-vault-muted'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                      (config as Record<string, unknown>)[key] ? 'left-6' : 'left-0.5'
                    )} />
                  </button>
                </div>
              ))}

              <div>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Link Expiry</label>
                <div className="grid grid-cols-3 gap-2">
                  {['24h', '48h', '7d'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setConfig({...config, expiry: opt})}
                      className={cn(
                        'py-2.5 rounded-xl font-bold text-sm transition-all',
                        config.expiry === opt
                          ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                          : 'card text-vault-text-muted hover:text-vault-text'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generate}
                className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
              >
                Generate Secure Link
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="card p-4 border-green-500/20 bg-green-500/5 text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-sm font-bold text-green-400">Secure link created successfully</p>
                <p className="text-xs text-vault-text-muted mt-1">Expires in {config.expiry}</p>
              </div>
              <div className="glass-gold gold-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-gold-500 mb-1.5">Your Secure Link</p>
                <p className="text-sm font-mono text-vault-text break-all">{linkGenerated}</p>
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  'w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gold-gradient text-charcoal-300 hover:shadow-gold-glow'
                )}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
              <button onClick={onClose} className="w-full py-3 rounded-2xl glass gold-border text-vault-text font-semibold text-sm">Done</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function SharePage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Secure Share</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Burn after reading · Magic Links</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Plus size={15} />
            New Link
          </button>
        </div>
      </div>

      {/* Active links */}
      <div className="px-5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Active Links</h2>
          <span className="text-xs text-gold-500 font-semibold">
            {ACTIVE_LINKS.filter(l => l.status === 'active').length} active
          </span>
        </div>

        <div className="space-y-3">
          {ACTIVE_LINKS.map((link) => (
            <div key={link.id} className={cn('card p-4', link.status === 'expired' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className={link.status === 'active' ? 'text-gold-500' : 'text-vault-text-muted'} />
                    <p className="text-sm font-bold text-vault-text truncate">{link.recipient}</p>
                  </div>
                  <p className="text-xs text-vault-text-muted truncate">{link.scope}</p>

                  <div className="flex items-center gap-3 mt-2.5">
                    {link.status === 'active' ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-gold-500">
                        <Clock size={12} />
                        {formatCountdown(link.expiresAt)}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-red-400">Expired</span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-vault-text-muted">
                      <Eye size={12} />
                      {link.views} views
                    </div>
                    {link.protected && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">🔒 Protected</span>}
                    {link.watermark && <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">💧 Watermark</span>}
                  </div>
                </div>

                {link.status === 'active' && (
                  <button className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 hover:bg-red-500/20 transition-all">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
