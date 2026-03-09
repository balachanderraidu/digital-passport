'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, ChevronRight, ChevronLeft, Check, MapPin, Tag, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { addSnag, updateSnagPhotoUrl } from '@/lib/firestore'
import { uploadSnagPhoto } from '@/lib/storage'

const LOCATIONS = ['Living Area', 'Master Bedroom', 'Guest Room', 'Kitchen', 'Master Bathroom', 'Guest Bathroom', 'Balcony', 'Hallway', 'Study', 'Utility Room']
const CATEGORIES = ['Paint & Finish', 'Flooring', 'Doors & Windows', 'Plumbing', 'Electrical & Fixtures', 'Structural', 'Carpentry & Furniture', 'HVAC']
const URGENCY_OPTS = [
  { value: 'low', label: 'Low', desc: 'Minor, can wait', color: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { value: 'medium', label: 'Medium', desc: 'Needs attention', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  { value: 'high', label: 'High', desc: 'Urgent fix needed', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
]

export default function NewSnagPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activePropertyId } = useProperty()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | ''>('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!user || !location || !category || !urgency) return
    setSubmitting(true)
    try {
      const title = description || `${category} issue — ${location}`

      // Add snag scoped to the active property
      const docRef = await addSnag(user.uid, {
        title,
        location,
        category,
        urgency,
        status: 'open',
        photoUrl: null,
      }, activePropertyId)

      // Upload photo and update the snag with the URL
      if (photoFile) {
        const photoUrl = await uploadSnagPhoto(user.uid, docRef.id, photoFile)
        await updateSnagPhotoUrl(user.uid, docRef.id, photoUrl, activePropertyId)
      }

      router.push('/snags')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep((s) => (s - 1) as 1|2|3) : router.back()} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
            <ChevronLeft size={18} className="text-vault-text" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Log a Snag</h1>
            <p className="text-xs text-vault-text-muted">Step {step} of 3</p>
          </div>
        </div>
        <div className="flex gap-1.5 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn('h-1 flex-1 rounded-full transition-all duration-300', s <= step ? 'bg-gold-500' : 'bg-vault-muted')} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
        {/* Step 1: Photo */}
        {step === 1 && (
          <div className="py-4 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Capture Evidence</h2>
              <p className="text-sm text-vault-text-muted">Take or upload a photo of the defect</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: '280px' }}>
                <img src={photoPreview} alt="Snag photo" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <span className="text-white text-sm">✕</span>
                </button>
                <div className="absolute bottom-3 left-3 glass px-3 py-1.5 rounded-xl">
                  <p className="text-xs font-semibold text-white">Photo captured</p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-vault-border hover:border-gold-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
                style={{ height: '280px' }}
              >
                <div className="w-16 h-16 rounded-2xl glass-gold gold-border flex items-center justify-center">
                  <Camera size={28} className="text-gold-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-vault-text">Tap to capture photo</p>
                  <p className="text-xs text-vault-text-muted mt-1">Use camera or browse gallery</p>
                </div>
                <button className="flex items-center gap-2 text-xs font-semibold text-gold-500">
                  <Upload size={14} />
                  Or upload from device
                </button>
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all flex items-center justify-center gap-2"
            >
              Continue to Details <ChevronRight size={16} />
            </button>
            {!photoPreview && (
              <button onClick={() => setStep(2)} className="w-full py-2 text-xs text-vault-text-muted">
                Skip photo for now
              </button>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="py-4 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Describe the Snag</h2>
              <p className="text-sm text-vault-text-muted">Add location, category, and urgency</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> Location
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={cn(
                      'py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all',
                      location === loc
                        ? 'bg-gold-500/15 border border-gold-500/50 text-gold-500'
                        : 'card text-vault-text-muted hover:text-vault-text'
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Tag size={12} /> Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all',
                      category === cat
                        ? 'bg-gold-500/15 border border-gold-500/50 text-gold-500'
                        : 'card text-vault-text-muted hover:text-vault-text'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Urgency Level
              </label>
              <div className="space-y-2">
                {URGENCY_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUrgency(opt.value as 'low' | 'medium' | 'high')}
                    className={cn(
                      'w-full p-3.5 rounded-xl border flex items-center gap-3 transition-all',
                      urgency === opt.value ? opt.color : 'card text-vault-text-muted'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center', urgency === opt.value ? 'border-current' : 'border-vault-muted')}>
                      {urgency === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Description (optional)</label>
              <textarea
                className="w-full px-4 py-3 text-sm rounded-2xl resize-none h-24"
                placeholder="Describe the defect in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!location || !category || !urgency}
              className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm disabled:opacity-40 hover:shadow-gold-glow transition-all mb-6"
            >
              Review & Submit →
            </button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="py-4 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Review Summary</h2>
              <p className="text-sm text-vault-text-muted">Confirm details before submitting</p>
            </div>

            {photoPreview && (
              <div className="rounded-2xl overflow-hidden h-40">
                <img src={photoPreview} alt="Snag" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="card p-4 space-y-3">
              {[
                { label: 'Location', value: location },
                { label: 'Category', value: category },
                { label: 'Urgency', value: urgency.charAt(0).toUpperCase() + urgency.slice(1) },
                ...(description ? [{ label: 'Description', value: description }] : []),
              ].map((row) => (
                <div key={row.label} className="flex gap-3">
                  <span className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest w-20 mt-0.5 flex-shrink-0">{row.label}</span>
                  <span className="text-sm font-semibold text-vault-text">{row.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60 mb-6"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              ) : (
                <><Check size={16} /> Submit Snag Report</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
