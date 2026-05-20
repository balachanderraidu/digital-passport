'use client'

import { createContext, useContext } from 'react'
import type { Property } from './firestore'
import { useAuth } from './useAuth'

export interface PropertyContextValue {
  activePropertyId: string
  activeProperty: Property | null
  allProperties: Property[]
  isLoading: boolean
  switchProperty: (pid: string) => void
  addProperty: (data: Omit<Property, 'id' | 'createdAt'>) => Promise<string>
}

export const PropertyContext = createContext<PropertyContextValue>({
  activePropertyId: 'primary',
  activeProperty: null,
  allProperties: [],
  isLoading: true,
  switchProperty: () => {},
  addProperty: async () => '',
})

export function useProperty() {
  return useContext(PropertyContext)
}

/**
 * Single source of truth for demo-mode detection.
 * A session is in demo when:
 *  a) the user is not authenticated, OR
 *  b) the active property is one of the 4 built-in demo properties (p_villa, p_rental, etc.)
 */
export function useIsDemo() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  return (!authLoading && !user) || !!(activePropertyId?.startsWith('p_'))
}
