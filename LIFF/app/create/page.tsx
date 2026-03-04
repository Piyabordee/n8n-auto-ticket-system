'use client'

import { useLiff } from '@/components/LiffProvider'
import { TicketForm } from '@/components/TicketForm'

export default function CreateTicketPage() {
  const { profile, loading } = useLiff()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
      <TicketForm />
    </div>
  )
}