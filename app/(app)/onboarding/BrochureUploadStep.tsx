'use client'

import { useState, useRef } from 'react'
import {
  Upload, FileText, Loader2, Sparkles, CheckCircle2,
  AlertCircle, BedDouble, Bath, Ruler, ChevronRight, Building2,
} from 'lucide-react'
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
    unitTypes: UnitType[],
    flatNumber: string,
  ) => void
  onSkipToManual: () => void
}

type StepState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

/** Derive floor number from a raw unit number string.
 *  e.g. "3301" with maxFloor=36  → 33
 *       "1001" with maxFloor=15  → 10
 */
function deriveFloor(unitNum: string, maxFloor: number): number | null {
  const digits = unitNum.replace(/\D/g, '')
  if (!digits || digits.length < 2) return null
  const floorDigits = maxFloor >= 100 ? 3 : maxFloor >= 10 ? 2 : 1
  const floor = parseInt(digits.slice(0, floorDigits), 10)
  return floor > 0 && floor <= maxFloor ? floor : null
}

export function BrochureUploadStep({
  uid,
  onUnitTypesExtracted,
  onSkipToManual,
}: BrochureUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [stepState, setStepState] = useState<StepState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  // Extraction results
  const [extractedProject, setExtractedProject] = useState('')
  const [extractedTypes, setExtractedTypes] = useState<UnitType[]>([])
  const [towers, setTowers] = useState<string[]>([])
  const [projectId, setProjectId] = useState('')

  // Unit selection
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null)
  const [selectedTower, setSelectedTower] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [unitError, setUnitError] = useState('')

  const derivedFloor = selectedUnit
    ? deriveFloor(unitNumber, selectedUnit.floorRange?.[1] ?? 40)
    : null

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
      const storageRef = ref(storage!, `brochures/${uid}/${Date.now()}_${file.name}`)
      const uploadTask = uploadBytesResumable(storageRef, file)

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          reject,
          resolve,
        )
      })

      const storagePath = storageRef.fullPath
      setStepState('processing')

      const functions = getFunctions(app)
      const processBrochure = httpsCallable<
        { storagePath: string; uid: string },
        { projectId: string; projectName: string; towers: string[]; unitTypes: UnitType[] }
      >(functions, 'processBrochure', { timeout: 300_000 })

      const result = await processBrochure({ storagePath, uid })
      const { projectId: pid, projectName, towers: extractedTowers, unitTypes } = result.data

      setProjectId(pid)
      setExtractedProject(projectName)
      setExtractedTypes(unitTypes)
      setTowers(extractedTowers ?? [])
      setStepState('done')
    } catch (err) {
      console.error('[brochure process]', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Processing failed: ${msg}`)
      setStepState('error')
    }
  }

  const handleConfirm = () => {
    if (!selectedUnit) return
    if (!unitNumber.trim()) {
      setUnitError('Please enter your flat/unit number')
      return
    }
    const fullUnit = [selectedTower, unitNumber.trim()].filter(Boolean).join('-')
    onUnitTypesExtracted(projectId, extractedProject, [selectedUnit], fullUnit)
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (stepState === 'done' && extractedTypes.length > 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Success banner */}
        <div className="card p-4 border-green-500/20 bg-green-500/5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">Brochure processed!</p>
            <p className="text-xs text-vault-text-muted mt-0.5">
              Found <span className="text-white font-semibold">{extractedProject}</span> with{' '}
              {extractedTypes.length} unit type{extractedTypes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Unit type picker */}
        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">
            Select Your Unit Type
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {extractedTypes.map((ut) => {
              const unitKey = `${ut.label}-${ut.area}`
              const isSelected = selectedUnit
                ? `${selectedUnit.label}-${selectedUnit.area}` === unitKey
                : false
              return (
                <button
                  key={unitKey}
                  onClick={() => { setSelectedUnit(ut); setUnitError('') }}
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
                      <span className="text-[10px] text-vault-text-muted">{(ut.area ?? 0).toLocaleString()} sq ft</span>
                    </div>
                    <p className="text-[9px] text-vault-text-muted/70">{ut.configuration}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Floor plan image for selected unit */}
        {selectedUnit?.floorPlanUrl && (
          <div className="rounded-2xl overflow-hidden border border-vault-border bg-vault-surface">
            <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest px-3 pt-3 pb-2">
              Floor Plan — {selectedUnit.label}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedUnit.floorPlanUrl}
              alt={`${selectedUnit.label} floor plan`}
              className="w-full object-contain max-h-64"
              loading="lazy"
            />
          </div>
        )}

        {/* Tower / Block dropdown */}
        {towers.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
              Tower / Block
            </label>
            <div className="flex flex-wrap gap-2">
              {towers.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTower(t)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                    selectedTower === t
                      ? 'bg-gold-500/10 border-gold-500/60 text-gold-500'
                      : 'card border-vault-border text-vault-text hover:border-gold-500/30'
                  )}
                >
                  <Building2 size={12} className="inline mr-1.5 opacity-70" />
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flat/Unit number */}
        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
            Your Flat / Unit Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            className={cn(
              'w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-surface border text-white placeholder:text-vault-text-muted focus:outline-none transition-colors',
              unitError ? 'border-red-500/50' : 'border-vault-border focus:border-gold-500/60'
            )}
            placeholder="e.g. 3301"
            value={unitNumber}
            onChange={(e) => { setUnitNumber(e.target.value); setUnitError('') }}
          />
          {unitError && <p className="text-xs text-red-400 mt-1.5 ml-1">{unitError}</p>}
          {/* Auto-derived floor */}
          {derivedFloor && (
            <p className="text-xs text-vault-text-muted mt-1.5 ml-1">
              📍 Floor <span className="text-gold-500 font-semibold">{derivedFloor}</span>
              {selectedUnit?.floorRange && (
                <span className="opacity-60"> of {selectedUnit.floorRange[1]}</span>
              )}
            </p>
          )}
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
          <p className="text-xs text-vault-text-muted">Extracting unit types, floor plans, and towers</p>
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
