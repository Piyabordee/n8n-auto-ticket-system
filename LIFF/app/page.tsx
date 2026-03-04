'use client'

import { useState, useEffect } from 'react'
import { useLiff } from '@/components/LiffProvider'
import { KPICard } from '@/components/KPICard'
import { TicketList } from '@/components/TicketList'
import { RefreshButton } from '@/components/RefreshButton'
import { useRouter } from 'next/navigation'

const LAST_SYNC_KEY = 'liff_last_sync'
const SYNC_INTERVAL = 24 * 60 * 60 * 1000  // 24 hours

interface KPI {
  total: number
  closed: number
}

interface Ticket {
  message_id: string
  subject: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

interface TicketsResponse {
  kpi: KPI
  tickets: Ticket[]
}

export default function DashboardPage() {
  const { profile, loading } = useLiff()
  const router = useRouter()
  const [data, setData] = useState<TicketsResponse | null>(null)
  const [fetching, setFetching] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchTickets = async () => {
    if (!profile?.userId) return

    setFetching(true)
    try {
      const response = await fetch(`/api/tickets?userId=${profile.userId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
        setLastUpdate(new Date())
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!loading && profile?.userId) {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY)
      const now = Date.now()

      if (!lastSync || (now - parseInt(lastSync)) > SYNC_INTERVAL) {
        fetchTickets()
      } else {
        setLastUpdate(new Date(parseInt(lastSync)))
      }
    }
  }, [loading, profile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">🏠 IT Helpdesk</h1>
          {profile && (
            <p className="text-sm text-gray-600">👤 {profile.displayName}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        {data && (
          <div className="grid grid-cols-2 gap-4">
            <KPICard label="ทั้งหมด" value={data.kpi.total} icon="🎫" />
            <KPICard label="เสร็จสิ้น" value={data.kpi.closed} icon="✅" />
          </div>
        )}

        {/* Refresh Bar */}
        <RefreshButton
          onRefresh={fetchTickets}
          loading={fetching}
          lastUpdate={lastUpdate}
        />

        {/* Ticket List */}
        {data ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              🎫 ปัญหาล่าสุดของฉัน
            </h2>
            <TicketList tickets={data.tickets} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/create')}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-2xl"
      >
        +
      </button>
    </div>
  )
}
