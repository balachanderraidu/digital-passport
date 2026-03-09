'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle, X, BedDouble, Bath, Ruler, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type UnitType } from '@/lib/firestore'
import { ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/lib/firebase'

interface BrochureUploadStepProps {
  uid: string
  onUnitTypesExtracted: (
    projectId: string,
    projectName: string,
    unitTypes: UnitType[]
  ) => void
  onSkipToManual: () => void
}

type StepState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export function BrochureUploadStep({ uid, onUnitTypesExtracted, onSkipToManual }: BrochureUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [stepState, setStepState] = useState<StepState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [extractedProject, setExtractedProject] = useState('')
  const [extractedTypes, setExtractedTypes] = useState<UnitType[]>([])
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null)
  const [flatNumber, setFlatNumber] = useState('')
  const [flatError, setFlatError] = useState('')
  const [projectId, setProjectId] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setError('Please upload a PDF file (brochure or floor plan)')
      return
    }
    if (selected.size > 50 * 1024 * 1024) {
      setError('File too large. Please upload a PDF under 50MB.')
      return
    }
    setFile(selected)
    setError('')
  }

  const handleUploadAndProcess = async () => {
    if (!file || !app) return
    setStepState('uploading')
    setError('')

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage!, `brochures/${uid}/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
          },
          reject,
          resolve
        )
      })

      const storagePath = storageRef.fullPath
      setStepState('processing')

      // 2. Call Cloud Function to process brochure
      const functions = getFunctions(app)
      const processBrochure = httpsCallable<
        { storagePath: string; uid: string },
        { projectId: string; projectName: string; unitTypes: UnitType[] }
      >(functions, 'processBrochure')

      const result = await processBrochure({ storagePath, uid })
      const { projectId: pid, projectName, unitTypes } = result.data

      setProjectId(pid)
      setExtractedProject(projectName)
      setExtractedTypes(unitTypes)
      setStepState('done')
    } catch (err) {
      console.error('[brochure process]', err)
      setError('Could not process the brochure. Please try a clearer scan or skip to manual entry.')
      setStepState('error')
    }
  }

  const handleConfirm = () => {
    if (!selectedUnit) return
    if (!flatNumber.trim()) {
      setFlatError('Please enter your flat/unit number')
      return
    }
    onUnitTypesExtracted(projectId, extractedProject, [selectedUnit])
  }

  // ── Done state: pick unit type ─────────────────────────────────────────────
  if (stepState === 'done' && extractedTypes.length > 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="card p-4 border-green-500/20 bg-green-500/5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">Brochure processed!</p>
            <p className="text-xs text-vault-text-muted mt-0.5">
              Found <span className="text-white font-semibold">{extractedProject}</span> with {extractedTypes.length} unit type{extractedTypes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
            Your Flat / Unit Number
          </label>
          <input
            type="text"
            className={cn(
              "w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-surface border text-white placeholder:text-vault-text-muted focus:outline-none transition-colors",
              flatError ? 'border-red-500/50' : 'border-vault-border focus:border-gold-500/60'
            )}
            placeholder="e.g. 3301 or Block K, 3301"
            value={flatNumber}
            onChange={(e) => { setFlatNumber(e.target.value); setFlatError('') }}
          />
          {flatError && <p className="text-xs text-red-400 mt-1.5 ml-1">{flatError}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">
            Select Your Unit Type
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {extractedTypes.map((ut) => {
              const isSelected = selectedUnit?.id === ut.id
              return (
                <button
                  key={ut.id}
                  onClick={() => setSelectedUnit(ut)}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all',
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500/60 shadow-gold-glow-sm'
                      : 'card border-vault-border hover:border-gold-500/30'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={cn('text-xs font-bold leading-tight', isSelected ? 'text-gold-500' : 'text-white')}>
                      {ut.label}
                    </p>
                    {isSelected && <CheckCircle2 size={14} className="text-gold-500 flex-shrink-0" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <BedDouble size={10} className="text-vault-text-muted" />
                      <span className="text-[10px] text-vault-text-muted">{ut.bedrooms} Bed</span>
                      <Bath size={10} className="text-vault-text-muted ml-1" />
                      <span className="text-[10px] text-vault-text-muted">{ut.bathrooms} Bath</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler size={10} className="text-vault-text-muted" />
                      <span className="text-[10px] text-vault-text-muted">{ut.area.toLocaleString()} sq ft</span>
                    </div>
                    <p className="text-[9px] text-vault-text-muted/70">{ut.configuration}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedUnit}
          className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-gold-glow transition-all disabled:opacity-40"
        >
          Confirm Unit <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  // ── Main upload UI ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Sparkles size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Upload Brochure</h2>
          <p className="text-xs text-vault-text-muted">AI will extract your unit types automatically</p>
        </div>
      </div>

      <div className="card p-4 space-y-2 border-purple-500/10 bg-purple-500/5">
        {[
          '📄 Upload a PDF brochure or floor plan',
          '🤖 Gemini AI extracts all unit types and areas',
          '🏢 Your project is added for future users too',
          '📐 Floor plans can be added to the vault later',
        ].map((item) => (
          <p key={item} className="text-xs text-vault-text-muted flex items-start gap-2">
            <span>{item.slice(0, 2)}</span>
            <span>{item.slice(3)}</span>
          </p>
        ))}
      </div>

      {/* File picker */}
      {stepState === 'idle' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="brochure-upload-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-3 transition-all',
              file
                ? 'border-gold-500/40 bg-gold-500/5'
                : 'border-vault-border hover:border-gold-500/30 bg-vault-surface/50'
            )}
          >
            {file ? (
              <>
                <FileText size={28} className="text-gold-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-vault-text-muted mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <p className="text-xs text-gold-500 font-medium">Tap to change file</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-vault-text-muted" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Tap to upload PDF</p>
                  <p className="text-xs text-vault-text-muted mt-0.5">Brochure, floor plan, or apartment guide</p>
                </div>
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {file && (
            <button
              onClick={handleUploadAndProcess}
              className="w-full py-4 mt-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles size={16} /> Process with AI
            </button>
          )}
        </div>
      )}

      {/* Upload progress */}
      {stepState === 'uploading' && (
        <div className="card p-5 text-center space-y-4 border-purple-500/20 bg-purple-500/5">
          <Upload size={28} className="text-purple-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-white mb-2">Uploading…</p>
            <div className="w-full bg-vault-muted rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-vault-text-muted mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* AI processing */}
      {stepState === 'processing' && (
        <div className="card p-5 text-center space-y-3 border-purple-500/20 bg-purple-500/5">
          <Loader2 size={28} className="text-purple-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-purple-300">Gemini is reading your brochure…</p>
          <p className="text-xs text-vault-text-muted">Extracting unit types, areas, and configurations</p>
        </div>
      )}

      {/* Error state */}
      {stepState === 'error' && (
        <div className="space-y-3">
          <div className="card p-4 border-red-500/20 bg-red-500/5 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
          <button
            onClick={() => { setStepState('idle'); setFile(null); setError('') }}
            className="w-full py-3.5 rounded-2xl card text-vault-text font-semibold text-sm border-vault-border"
          >
            Try again
          </button>
        </div>
      )}

      {/* Skip */}
      {(stepState === 'idle' || stepState === 'error') && (
        <button
          onClick={onSkipToManual}
          className="w-full py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm"
        >
          Skip — I'll enter details manually
        </button>
      )}
    </div>
  )
}
