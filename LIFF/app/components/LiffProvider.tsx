'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { LiffContextType, LiffProfile } from '@/types'

const LiffContext = createContext<LiffContextType | undefined>(undefined)

export function useLiff() {
  const context = useContext(LiffContext)
  if (!context) {
    throw new Error('useLiff must be used within a LiffProvider')
  }
  return context
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LiffProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Get userId from localStorage or prompt user
    const storedUserId = localStorage.getItem('liff_user_id')
    const storedDisplayName = localStorage.getItem('liff_display_name')

    if (storedUserId) {
      setProfile({
        userId: storedUserId,
        displayName: storedDisplayName || 'User',
        pictureUrl: undefined
      })
      setInitialized(true)
    }
    setLoading(false)
  }, [])

  const login = (userId: string, displayName?: string) => {
    localStorage.setItem('liff_user_id', userId)
    if (displayName) {
      localStorage.setItem('liff_display_name', displayName)
    }
    setProfile({
      userId,
      displayName: displayName || 'User',
      pictureUrl: undefined
    })
    setInitialized(true)
  }

  const logout = () => {
    localStorage.removeItem('liff_user_id')
    localStorage.removeItem('liff_display_name')
    setProfile(null)
    setInitialized(false)
  }

  const value = {
    profile,
    loading,
    error,
    initialized,
    login,
    logout
  }

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  )
}