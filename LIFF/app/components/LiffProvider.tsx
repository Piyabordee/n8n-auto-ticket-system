'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Liff } from '@line/liff'
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
    const initLiff = async () => {
      try {
        // Mock data for local development
        if (process.env.NODE_ENV === 'development') {
          setProfile({
            userId: 'U11ffef7226ca75c66fb4c0af4af00dc6', // ธัญญ์นรี
            displayName: 'ธัญญ์นรี เก๋ 4289',
            pictureUrl: 'https://example.com/avatar.png'
          })
          setLoading(false)
          setInitialized(true)
          return
        }

        // Initialize LIFF in production
        const liff = (await import('@line/liff')).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID || '' })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        const lineProfile = await liff.getProfile()
        setProfile({
          userId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl
        })
        setInitialized(true)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    initLiff()
  }, [])

  const value = {
    profile,
    loading,
    error,
    initialized
  }

  return (
    <LiffContext.Provider value={value}>
      {children}
    </LiffContext.Provider>
  )
}