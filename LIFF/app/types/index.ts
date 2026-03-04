export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

export interface LiffContextType {
  profile: LiffProfile | null
  loading: boolean
  error: Error | null
  initialized: boolean
}