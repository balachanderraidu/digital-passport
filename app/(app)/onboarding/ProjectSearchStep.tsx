'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Building2, ChevronRight, Loader2, BedDouble, Bath, Ruler, Sparkles, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchProjects, getProjectUnitTypes, matchUnitTypeByFlat, type ProjectListing, type UnitType } from '@/lib/firestore'

interface ProjectSearchStepProps {
  onProjectSelected: (
    project: ProjectListing,
    unitType: UnitType,
    flatNumber: string
  ) => void
  onSkipToManual: () => void
  onNotFound: () => void
}

export function ProjectSearchStep({ onProjectSelected, onSkipToManual, onNotFound }: ProjectSearchStepProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ProjectListing[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectListing | null>(null)
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null)
  const [flatNumber, setFlatNumber] = useState('')
  const [flatError, setFlatError] = useState('')
  const [autoDetected, setAutoDetected] = useState(false)

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await searchProjects(q)
      setResults(res)
    } catch (err) {
      console.error('[project search]', err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const handleSelectProject = async (project: ProjectListing) => {
    setSelectedProject(project)
    setResults([])
    setQuery('')
    setUnitTypes([])
    setSelectedUnit(null)
    setFlatNumber('')
    setLoadingUnits(true)
    try {
      const types = await getProjectUnitTypes(project.id)
      setUnitTypes(types)
    } catch (err) {
      console.error('[load unit types]', err)
    } finally {
      setLoadingUnits(false)
    }
  }

  const handleFlatNumberChange = (value: string) => {
    setFlatNumber(value)
    setFlatError('')
    setAutoDetected(false)
    if (value.trim().length >= 3 && unitTypes.length > 0) {
      const matched = matchUnitTypeByFlat(value.trim(), unitTypes)
      if (matched) {
        setSelectedUnit(matched)
        setAutoDetected(true)
      }
    }
  }

  const handleConfirm = () => {
    if (!selectedProject || !selectedUnit) return
    if (!flatNumber.trim()) {
      setFlatError('Please enter your flat/unit number')
      return
    }
    onProjectSelected(selectedProject, selectedUnit, flatNumber.trim())
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Building2 size={20} className="text-gold-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Find Your Project</h2>
          <p className="text-xs text-vault-text-muted">Search our database of residential projects</p>
        </div>
      </div>

      {/* Search box */}
      {!selectedProject && (
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searching
              ? <Loader2 size={16} className="text-gold-500 animate-spin" />
              : <Search size={16} className="text-vault-text-muted" />
            }
          </div>
          <input
            id="project-search"
            type="text"
            className="w-full pl-10 pr-4 py-3.5 text-sm rounded-2xl bg-vault-surface border border-vault-border text-white placeholder:text-vault-text-muted focus:outline-none focus:border-gold-500/60 transition-colors"
            placeholder="e.g. Myhome Bhooja, Prestige Elysian…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {/* Dropdown results */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-vault-border bg-vault-surface shadow-xl z-20 overflow-hidden">
              {results.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-vault-muted/50 transition-colors text-left border-b border-vault-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 size={14} className="text-gold-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{project.name}</p>
                    <p className="text-xs text-vault-text-muted">{project.developer} · {project.city}</p>
                    {project.totalUnits && (
                      <p className="text-[10px] text-vault-text-muted mt-0.5">{project.totalUnits} units</p>
                    )}
                  </div>
                  {!project.verified && (
                    <span className="text-[9px] font-bold text-yellow-400/70 border border-yellow-400/20 rounded-md px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                      COMMUNITY
                    </span>
                  )}
                  {project.verified && (
                    <span className="text-[9px] font-bold text-green-400/80 border border-green-400/20 rounded-md px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                      VERIFIED
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected project banner */}
      {selectedProject && (
        <div className="card p-4 border-gold-500/20 bg-gold-500/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{selectedProject.name}</p>
            <p className="text-xs text-vault-text-muted">{selectedProject.developer} · {selectedProject.city}</p>
          </div>
          <button
            onClick={() => { setSelectedProject(null); setUnitTypes([]); setSelectedUnit(null); setFlatNumber('') }}
            className="w-7 h-7 rounded-xl glass flex items-center justify-center flex-shrink-0"
          >
            <X size={12} className="text-vault-text-muted" />
          </button>
        </div>
      )}

      {/* Flat number input (shown once project picked) */}
      {selectedProject && (
        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
            Your Flat / Unit Number
          </label>
          <input
            id="flat-number"
            type="text"
            className={cn(
              "w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-surface border text-white placeholder:text-vault-text-muted focus:outline-none transition-colors",
              flatError ? 'border-red-500/50' : 'border-vault-border focus:border-gold-500/60'
            )}
            placeholder="e.g. 3301 or K-3301"
            value={flatNumber}
            onChange={(e) => handleFlatNumberChange(e.target.value)}
          />
          {flatError && <p className="text-xs text-red-400 mt-1.5 ml-1">{flatError}</p>}
          {autoDetected && selectedUnit && (
            <div className="mt-2 flex items-center gap-1.5 ml-1">
              <Sparkles size={11} className="text-gold-500" />
              <p className="text-xs text-gold-500 font-medium">Auto-detected: {selectedUnit.label}</p>
            </div>
          )}
        </div>
      )}

      {/* Unit type grid */}
      {selectedProject && (
        <div>
          <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-3 block">
            {autoDetected ? 'Your Unit Type (auto-detected)' : 'Select Your Unit Type'}
          </label>

          {loadingUnits ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 size={20} className="text-gold-500 animate-spin" />
              <span className="text-sm text-vault-text-muted">Loading unit types…</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {unitTypes.map((ut) => {
                const isSelected = selectedUnit?.id === ut.id
                return (
                  <button
                    key={ut.id}
                    id={`unit-type-${ut.id}`}
                    onClick={() => { setSelectedUnit(ut); setAutoDetected(false) }}
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
                      <p className="text-[9px] text-vault-text-muted/70 mt-0.5">{ut.configuration}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CTA buttons */}
      {selectedProject ? (
        <div className="space-y-3 pt-1">
          <button
            id="confirm-unit-btn"
            onClick={handleConfirm}
            disabled={!selectedUnit}
            className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-gold-glow transition-all disabled:opacity-40"
          >
            Confirm Unit <ChevronRight size={16} />
          </button>
          <button
            onClick={() => { setSelectedProject(null); setUnitTypes([]); setSelectedUnit(null) }}
            className="w-full py-3 text-xs text-vault-text-muted font-medium"
          >
            Search a different project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <div className="card p-4 border-yellow-500/20 bg-yellow-500/5">
              <p className="text-sm font-semibold text-yellow-400 mb-1">Project not found in our database</p>
              <p className="text-xs text-vault-text-muted mb-3">
                You can upload a brochure or floor plan and our AI will extract the unit types automatically.
              </p>
              <button
                id="upload-brochure-btn"
                onClick={onNotFound}
                className="w-full py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-yellow-500/15 transition-all"
              >
                <Sparkles size={14} /> Upload Brochure / Floor Plan
              </button>
            </div>
          )}
          <button
            id="skip-to-manual-btn"
            onClick={onSkipToManual}
            className="w-full py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm"
          >
            Skip — I'll enter details manually
          </button>
        </div>
      )}
    </div>
  )
}
