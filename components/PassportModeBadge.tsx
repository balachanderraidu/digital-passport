/**
 * PassportModeBadge
 *
 * Displays the current passport mode based on occupancy status.
 *
 * Active  — renovation/construction in progress  → amber/orange
 * Passive — handed over, living / rented / empty → emerald green
 */

import { cn } from '@/lib/utils'

type Occupancy = 'residing' | 'rented' | 'empty' | 'renovation' | undefined

interface Props {
  occupancy: Occupancy
  className?: string
}

export function PassportModeBadge({ occupancy, className }: Props) {
  const isActive = occupancy === 'renovation'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border',
        isActive
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        className
      )}
    >
      <span className="text-[10px]">{isActive ? '🔨' : '🏠'}</span>
      {isActive ? 'Active' : 'Passive'}
    </span>
  )
}
