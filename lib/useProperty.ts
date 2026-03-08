'use client'

import { createContext, useContext } from 'react'
import type { Property } from './firestore'

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
