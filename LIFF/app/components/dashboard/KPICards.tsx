'use client'

interface KPICardsProps {
  total: number
  closed: number
  closeRate: number
  avgTime: number
  pending: number
}

export default function KPICards({
  total,
  closed,
  closeRate,
  avgTime,
  pending
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Total Tickets */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
        <div className="text-sm text-gray-600 mb-1">จำนวนงานทั้งหมด</div>
        <div className="text-3xl font-bold text-gray-900">{total}</div>
        <div className="text-xs text-gray-500 mt-1">Tickets</div>
      </div>

      {/* Closed Tickets */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
        <div className="text-sm text-gray-600 mb-1">ปิดแล้ว</div>
        <div className="text-3xl font-bold text-green-600">{closed}</div>
        <div className="text-xs text-gray-500 mt-1">Tickets</div>
      </div>

      {/* Close Rate */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
        <div className="text-sm text-gray-600 mb-1">อัตราการปิดงาน</div>
        <div className="text-3xl font-bold text-purple-600">{closeRate}%</div>
        <div className="text-xs text-gray-500 mt-1">Closed / Total</div>
      </div>

      {/* Avg Resolution Time */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
        <div className="text-sm text-gray-600 mb-1">เวลาเฉลี่ย</div>
        <div className="text-3xl font-bold text-orange-600">
          {avgTime > 0 ? `${avgTime} นาที` : '-'}
        </div>
        <div className="text-xs text-gray-500 mt-1">ต่อ Ticket</div>
      </div>
    </div>
  )
}
