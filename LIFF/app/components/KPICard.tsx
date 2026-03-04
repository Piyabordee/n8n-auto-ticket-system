interface KPICardProps {
  label: string
  value: number
  icon: string
}

export function KPICard({ label, value, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  )
}
