'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyData {
  month: string
  total: number
  closed: number
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ปริมาณงานรายเดือน</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#3b82f6" name="ทั้งหมด" radius={[4, 4, 0, 0]} />
          <Bar dataKey="closed" fill="#22c55e" name="ปิดแล้ว" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
