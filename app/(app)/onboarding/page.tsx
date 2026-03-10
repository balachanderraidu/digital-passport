'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Loader2, Mail, CheckCircle2, Home, X, AlertCircle, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { createProperty, createNewProperty, setActiveProperty, type ProjectListing, type UnitType } from '@/lib/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/lib/firebase'
import { ProjectSearchStep } from './ProjectSearchStep'
import { BrochureUploadStep } from './BrochureUploadStep'

const FLOOR_PLAN_TYPES = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Villa', 'Custom']

type FlowStep =
  | 'project-search'     // Step 1: Search database
  | 'brochure-upload'    // Step 1b: Brochure upload (not in DB)
  | 'manual-details'     // Step 2: Manual property details  
  | 'gmail-sync'         // Step 3: Gmail procurement sync
  | 'review'             // Step 4: Review & launch

interface PropertyForm {
  name: string
  unit: string
  area: string
  floorPlanType: string
  location: string
}

const DEFAULT_FORM: PropertyForm = {
  name: '',
  unit: '',
  area: '',
  floorPlanType: '3BHK',
  location: '',
}

// Maps flow step names to human-readable step numbers for the progress bar
const STEP_ORDER: FlowStep[] = ['project-search', 'manual-details', 'gmail-sync', 'review']
const STEP_LABELS: Record<FlowStep, string> = {
  'project-search': 'Find Project',
  'brochure-upload': 'Find Project',
  'manual-details': 'Property Details',
  'gmail-sync': 'Gmail Sync',
  'review': 'Review',
}

function getDisplayStep(step: FlowStep): number {
  const idx = STEP_ORDER.indexOf(step === 'brochure-upload' ? 'project-search' : step)
  return Math.max(idx + 1, 1)
}

// ─── Linked project data (set when user picks from DB or uploads brochure) ────
interface LinkedProject {
  project: ProjectListing
  unitType: UnitType
  flatNumber: string
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isNewProperty = searchParams?.get('new') === '1'

  const [step, setStep] = useState<FlowStep>('project-search')
  const [form, setForm] = useState<PropertyForm>(DEFAULT_FORM)
  const [linkedProject, setLinkedProject] = useState<LinkedProject | null>(null)
  const [gmailStatus, setGmailStatus] = useState<'idle' | 'linking' | 'syncing' | 'done' | 'error'>('idle')
  const [syncResult, setSyncResult] = useState<{ matched: number; pending: number } | null>(null)
  const [gmailError, setGmailError] = useState('')
  const [saving, setSaving] = useState(false)

  // Handle OAuth return: /onboarding?code=XXX
  useEffect(() => {
    const code = searchParams?.get('code')
    if (!code || !user || gmailStatus !== 'idle') return
    void handleOAuthReturn(code)
  }, [searchParams, user]) // eslint-disable-line react-hooks/exhaustive-deps

  function isManualValid() {
    return form.name.trim() && form.unit.trim() && form.location.trim()
  }

  // ── Gmail handlers ────────────────────────────────────────────────────────
  async function handleGmailConnect() {
    if (!user || !app) {
      setGmailError('Please sign in with a real account to connect Gmail — this feature is not available in Demo Mode.')
      return
    }
    setGmailStatus('linking')
    setGmailError('')
    try {
      const functions = getFunctions(app)
      const initAuth = httpsCallable<unknown, { authUrl: string }>(functions, 'initGmailAuth')
      const result = await initAuth({})
      window.location.href = result.data.authUrl
    } catch (err) {
      console.error('[Gmail connect]', err)
      setGmailError('Could not start Gmail auth. Please try again.')
      setGmailStatus('idle')
    }
  }

  async function handleOAuthReturn(code: string) {
    if (!user || !app) return
    setStep('gmail-sync')
    setGmailStatus('syncing')
    try {
      const functions = getFunctions(app)
      const callback = httpsCallable(functions, 'gmailOAuthCallback')
      await callback({ code })
      const sync = httpsCallable<unknown, { matched: number; pending: number; processed: number }>(functions, 'syncGmailReceipts')
      const syncRes = await sync({})
      setSyncResult({ matched: syncRes.data.matched, pending: syncRes.data.pending })
      setGmailStatus('done')
      router.replace('/onboarding')
    } catch (err) {
      console.error('[Gmail sync]', err)
      setGmailError('Gmail sync failed. You can skip and try again later.')
      setGmailStatus('error')
    }
  }

  // ── Save & finish ─────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!user) return
    setSaving(true)
    try {
      // Build property data — prefer linked project data when available
      const propertyData = linkedProject
        ? {
            name: linkedProject.project.name,
            unit: linkedProject.flatNumber,
            area: linkedProject.unitType.area,
            floorPlanType: linkedProject.unitType.label,
            location: linkedProject.project.city,
            gmailLinked: gmailStatus === 'done',
            projectId: linkedProject.project.id,
            unitTypeId: linkedProject.unitType.id,
            unitTypeLabel: linkedProject.unitType.label,
          }
        : {
            name: form.name,
            unit: form.unit,
            area: parseFloat(form.area) || 0,
            floorPlanType: form.floorPlanType,
            location: form.location,
            gmailLinked: gmailStatus === 'done',
          }

      if (isNewProperty) {
        const newPid = await createNewProperty(user.uid, propertyData)
        await setActiveProperty(user.uid, newPid)
      } else {
        await createProperty(user.uid, propertyData)
      }
      router.replace('/dashboard')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  // ── Handlers for step transitions ─────────────────────────────────────────
  function handleProjectSelected(project: ProjectListing, unitType: UnitType, flatNumber: string) {
    setLinkedProject({ project, unitType, flatNumber })
    // Pre-fill form as fallback
    setForm({
      name: project.name,
      unit: flatNumber,
      area: String(unitType.area),
      floorPlanType: unitType.label,
      location: project.city,
    })
    setStep('gmail-sync')
  }

  function handleBrochureExtracted(projectId: string, projectName: string, unitTypes: UnitType[]) {
    // For brochure flow, we get a synthetic project + the user-selected type
    const unitType = unitTypes[0]
    if (!unitType) return
    const syntheticProject: ProjectListing = {
      id: projectId,
      name: projectName,
      city: '',
      developer: '',
      verified: false,
      searchKeywords: [],
      createdAt: null,
    }
    setLinkedProject({ project: syntheticProject, unitType, flatNumber: form.unit })
    setForm((f) => ({
      ...f,
      name: projectName,
      area: String(unitType.area),
      floorPlanType: unitType.label,
    }))
    setStep('gmail-sync')
  }

  // ── Progress display ──────────────────────────────────────────────────────
  const displayStep = getDisplayStep(step)
  const totalSteps = 4

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
              <Home size={16} className="text-gold-500" />
            </div>
            <span className="text-xs font-bold text-gold-500 uppercase tracking-widest">
              {isNewProperty ? 'Add Property' : 'Digital Passport'}
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center"
          >
            <X size={16} className="text-vault-text-muted" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">Set Up Your Passport</h1>
        <p className="text-sm text-vault-text-muted mt-1">
          {step === 'project-search' && "Let's find your home in our database"}
          {step === 'brochure-upload' && "Upload your project brochure for AI processing"}
          {step === 'manual-details' && "Tell us about your property"}
          {step === 'gmail-sync' && "Auto-import your purchase receipts"}
          {step === 'review' && "Review your passport setup"}
        </p>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                i < displayStep ? 'bg-gold-500' : 'bg-vault-muted'
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-vault-text-muted">Step {displayStep} of {totalSteps}</p>
          <p className="text-xs text-vault-text-muted font-medium">{STEP_LABELS[step]}</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-4">

        {/* ── Step 1A: Project Search ── */}
        {step === 'project-search' && (
          <ProjectSearchStep
            onProjectSelected={handleProjectSelected}
            onSkipToManual={() => setStep('manual-details')}
            onNotFound={() => setStep('brochure-upload')}
          />
        )}

        {/* ── Step 1B: Brochure Upload ── */}
        {step === 'brochure-upload' && user && (
          <BrochureUploadStep
            uid={user.uid}
            onUnitTypesExtracted={handleBrochureExtracted}
            onSkipToManual={() => setStep('manual-details')}
          />
        )}

        {/* ── Step 2: Manual Details ── */}
        {step === 'manual-details' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <Building2 size={20} className="text-gold-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Property Details</h2>
                <p className="text-xs text-vault-text-muted">Tell us about your home</p>
              </div>
            </div>

            {([
              { label: 'Property Name', key: 'name' as const, placeholder: 'e.g. Oberoi Residences' },
              { label: 'Unit / Flat Number', key: 'unit' as const, placeholder: 'e.g. 12B, Tower A' },
              { label: 'Location', key: 'location' as const, placeholder: 'e.g. Worli, Mumbai' },
              { label: 'Area (sq ft)', key: 'area' as const, placeholder: 'e.g. 1850' },
            ] as { label: string; key: keyof PropertyForm; placeholder: string }[]).map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">{label}</label>
                <input
                  className="w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-surface border border-vault-border text-white placeholder:text-vault-text-muted focus:outline-none focus:border-gold-500/60 transition-colors"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  type={key === 'area' ? 'number' : 'text'}
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">Floor Plan Type</label>
              <div className="grid grid-cols-4 gap-2">
                {FLOOR_PLAN_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, floorPlanType: t })}
                    className={cn(
                      'py-2.5 rounded-xl text-xs font-bold transition-all border',
                      form.floorPlanType === t
                        ? 'bg-gold-500 text-charcoal-300 border-gold-500 shadow-gold-glow-sm'
                        : 'card text-vault-text-muted border-vault-border hover:border-gold-500/40'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('gmail-sync')}
              disabled={!isManualValid()}
              className="w-full py-4 mt-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-gold-glow transition-all disabled:opacity-40"
            >
              Next: Gmail Sync <ChevronRight size={16} />
            </button>

            <button
              onClick={() => setStep('project-search')}
              className="w-full py-2 text-xs text-vault-text-muted font-medium text-center"
            >
              ← Back to project search
            </button>
          </div>
        )}

        {/* ── Step 3: Gmail Sync ── */}
        {step === 'gmail-sync' && (
          <div className="space-y-4 animate-fade-in">
            {/* Linked project summary (if set) */}
            {linkedProject && (
              <div className="card p-4 border-gold-500/20 bg-gold-500/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-gold-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{linkedProject.project.name}</p>
                  <p className="text-xs text-vault-text-muted">
                    Unit {linkedProject.flatNumber} · {linkedProject.unitType.label} · {(linkedProject.unitType.area ?? 0).toLocaleString()} sq ft
                  </p>
                </div>
                <CheckCircle2 size={16} className="text-gold-500 flex-shrink-0" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Mail size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Gmail Procurement Sync</h2>
                <p className="text-xs text-vault-text-muted">Auto-import your purchase receipts</p>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <p className="text-sm text-vault-text leading-relaxed">
                Connect your Gmail to automatically <span className="text-gold-500 font-semibold">scan for purchase receipts, invoices, and warranty emails</span>. Our AI extracts product details, purchase dates, and warranty periods — zero manual entry.
              </p>
              <ul className="space-y-2">
                {[
                  '🔍 Scans only purchase & shipping emails',
                  '🔐 Read-only access, never modifies Gmail',
                  '🤖 Gemini AI extracts metadata automatically',
                  '🔗 Auto-links invoices to warranty assets',
                ].map((item) => (
                  <li key={item} className="text-xs text-vault-text-muted flex items-start gap-2">
                    <span className="mt-0.5">{item.slice(0, 2)}</span>
                    <span>{item.slice(3)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {gmailStatus === 'idle' && (
              <button
                onClick={handleGmailConnect}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Mail size={16} /> Connect Gmail
              </button>
            )}

            {(gmailStatus === 'linking' || gmailStatus === 'syncing') && (
              <div className="card p-5 text-center space-y-3 border-blue-500/20 bg-blue-500/5">
                <Loader2 size={28} className="text-blue-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-blue-400">
                  {gmailStatus === 'linking' ? 'Redirecting to Google…' : 'Scanning & extracting receipts…'}
                </p>
                <p className="text-xs text-vault-text-muted">
                  {gmailStatus === 'syncing' ? 'Gemini AI is reading your purchase emails' : 'One moment'}
                </p>
              </div>
            )}

            {gmailStatus === 'done' && syncResult && (
              <div className="card p-5 border-green-500/30 bg-green-500/5 text-center space-y-2">
                <CheckCircle2 size={32} className="text-green-400 mx-auto" />
                <p className="text-sm font-bold text-green-400">{syncResult.matched} assets auto-added!</p>
                {syncResult.pending > 0 && (
                  <p className="text-xs text-yellow-400">{syncResult.pending} items need manual review (low confidence)</p>
                )}
              </div>
            )}

            {gmailError && (
              <div className="card p-4 border-red-500/20 bg-red-500/5 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{gmailError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('review')}
                className="flex-1 py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm"
              >
                Skip for now
              </button>
              {gmailStatus === 'done' && (
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-gold-glow transition-all"
                >
                  Continue <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Launch ── */}
        {step === 'review' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🏡</div>
              <h2 className="text-xl font-bold text-white">Passport Ready!</h2>
              <p className="text-sm text-vault-text-muted mt-1">Here's a summary of your setup</p>
            </div>

            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {linkedProject ? (
                  <>
                    {[
                      { label: 'Project', value: linkedProject.project.name },
                      { label: 'Unit', value: linkedProject.flatNumber },
                      { label: 'Type', value: linkedProject.unitType.label },
                      { label: 'Area', value: `${(linkedProject.unitType.area ?? 0).toLocaleString()} sq ft` },
                      { label: 'Config', value: linkedProject.unitType.configuration },
                      {
                        label: 'Gmail Sync',
                        value: gmailStatus === 'done'
                          ? `✅ ${syncResult?.matched ?? 0} assets added`
                          : '⏭ Skipped',
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-semibold text-vault-text mt-0.5">{value}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Property', value: form.name || '—' },
                      { label: 'Unit', value: form.unit || '—' },
                      { label: 'Location', value: form.location || '—' },
                      { label: 'Floor Plan', value: form.floorPlanType },
                      { label: 'Area', value: form.area ? `${form.area} sq ft` : '—' },
                      {
                        label: 'Gmail Sync',
                        value: gmailStatus === 'done'
                          ? `✅ ${syncResult?.matched ?? 0} assets added`
                          : '⏭ Skipped',
                      },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-semibold text-vault-text mt-0.5">{value}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {linkedProject && (
                <div className="pt-3 border-t border-vault-border/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-gold-500" />
                    <p className="text-[10px] text-gold-500 font-semibold">Linked to project database</p>
                  </div>
                  <p className="text-[10px] text-vault-text-muted mt-1 ml-4.5">
                    Floor plans and specs will be synced as they become available
                  </p>
                </div>
              )}
            </div>

            <div className="card p-4 border-gold-500/20 bg-gold-500/5">
              <p className="text-xs text-gold-500 font-semibold mb-1">✦ What happens next</p>
              <p className="text-xs text-vault-text-muted leading-relaxed">
                Your Digital Passport is now configured. Add warranty assets, upload documents, and use the AI Assistant to query your home data instantly.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-gold-glow transition-all disabled:opacity-60"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Launch My Passport 🚀'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-vault-bg flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  )
}
