'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import {
  subscribeAllProperties,
  subscribeUserProfile,
  setActiveProperty,
  createNewProperty,
  type Property,
} from '@/lib/firestore'
import { PropertyContext } from '@/lib/useProperty'
import { DEMO_PROPERTIES } from '@/lib/demo-data'

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  // Pre-seed with demo properties so the PropertySwitcher is never empty on first render.
  // Real user properties will be prepended once the Firestore subscription fires.
  const [allProperties, setAllProperties] = useState<Property[]>(DEMO_PROPERTIES)
  
  const [activePropertyId, setActivePropertyIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dp_active_pid') ?? 'p_villa'
    }
    return 'p_villa'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    // Demo Mode handling
    if (!user) {
      setAllProperties(DEMO_PROPERTIES)
      
      // Ensure the ID maps to a valid demo property
      if (!DEMO_PROPERTIES.find(p => p.id === activePropertyId)) {
        setActivePropertyIdState('p_villa')
      }
      
      setIsLoading(false)
      return
    }

    const u1 = subscribeAllProperties(user.uid, (props) => {
      // Inject Demo Sandbox items into the authenticated user's portfolio
      const merged = [...props, ...DEMO_PROPERTIES]
      setAllProperties(merged)
      
      // Auto-fallback if the user has no properties but is somehow explicitly selecting a non-existent one
      if (merged.length > 0 && !merged.find((p) => p.id === activePropertyId)) {
        setActivePropertyIdState(merged[0].id)
      }
      setIsLoading(false)
    })

    const u2 = subscribeUserProfile(user.uid, (profile) => {
      if (profile?.activePropertyId) {
        setActivePropertyIdState(profile.activePropertyId)
        if (typeof window !== 'undefined') {
          localStorage.setItem('dp_active_pid', profile.activePropertyId)
        }
      }
    })

    return () => { u1(); u2() }
  }, [user])

  const switchProperty = useCallback(async (pid: string) => {
    setActivePropertyIdState(pid)
    if (typeof window !== 'undefined') localStorage.setItem('dp_active_pid', pid)
    if (user) await setActiveProperty(user.uid, pid)
  }, [user])

  const addProperty = useCallback(async (data: Omit<Property, 'id' | 'createdAt'>): Promise<string> => {
    if (!user) return ''
    const pid = await createNewProperty(user.uid, data)
    await switchProperty(pid)
    return pid
  }, [user, switchProperty])

  const activeProperty = allProperties.find((p) => p.id === activePropertyId) ?? null

  return (
    <PropertyContext.Provider value={{
      activePropertyId,
      activeProperty,
      allProperties,
      isLoading,
      switchProperty,
      addProperty,
    }}>
      {children}
    </PropertyContext.Provider>
  )
}
