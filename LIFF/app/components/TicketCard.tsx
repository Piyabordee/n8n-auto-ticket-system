interface Ticket {
  message_id: string
  subject: string
  status: string
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

interface TicketCardProps {
  ticket: Ticket
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
  unsent: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  assigned: 'มอบหมายแล้ว',
  closed: 'เสร็จสิ้น',
  unsent: 'ยกเลิก'
}

export function TicketCard({ ticket }: TicketCardProps) {
  const colorClass = statusColors[ticket.status] || statusColors.pending
  const statusLabel = statusLabels[ticket.status] || ticket.status

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 flex-1">{ticket.subject || '(ไม่ระบุหัวข้อ)'}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {statusLabel}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>📂</span>
          <span>{ticket.category} - {ticket.sub_category}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>🏢</span>
          <span>{ticket.branch_name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>📅</span>
          <span>{formatDate(ticket.created_date)}</span>
        </div>
      </div>
    </div>
  )
}
