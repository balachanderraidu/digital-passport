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

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [activePropertyId, setActivePropertyIdState] = useState<string>(() => {
    // Fast init from localStorage to avoid flash
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dp_active_pid') ?? 'primary'
    }
    return 'primary'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const u1 = subscribeAllProperties(user.uid, (props) => {
      setAllProperties(props)
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
