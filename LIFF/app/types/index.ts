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
  login: (userId: string, displayName?: string) => void
  logout: () => void
}

export interface Ticket {
  message_id: string
  subject: string
  status: 'pending' | 'assigned' | 'closed' | 'unsent'
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

export interface TicketsResponse {
  kpi: {
    total: number
    closed: number
  }
  tickets: Ticket[]
}