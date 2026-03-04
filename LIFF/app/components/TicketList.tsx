import { TicketCard } from './TicketCard'

interface Ticket {
  message_id: string
  subject: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

interface TicketListProps {
  tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>ยังไม่มีปัญหาที่แจ้ง</p>
        <p className="text-sm mt-2">คลิก "+ สร้างปัญหาใหม่" เพื่อเริ่มต้น</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tickets.map(ticket => (
        <TicketCard key={ticket.message_id} ticket={ticket} />
      ))}
    </div>
  )
}
