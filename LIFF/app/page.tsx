'use client'

import { useState, useEffect } from 'react'
import HeaderFilter from './components/dashboard/HeaderFilter'
import KPICards from './components/dashboard/KPICards'
import MonthlyBarChart from './components/dashboard/MonthlyBarChart'
import StaffPerformanceTable from './components/dashboard/StaffPerformanceTable'

interface KPIStats {
  total: number
  closed: number
  closeRate: number
  avgTime: number
  pending: number
}

interface MonthlyData {
  month: string
  total: number
  closed: number
}

interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  avgTime: number
}

export default function TeamKPIDashboard() {
  // Filter states
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState<number | null>(null)

  // Data states
  const [kpi, setKpi] = useState<KPIStats>({
    total: 0,
    closed: 0,
    closeRate: 0,
    avgTime: 0,
    pending: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [staffData, setStaffData] = useState<StaffData[]>([])

  // Loading state
  const [loading, setLoading] = useState(true)

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Build query params
        const monthParam = month ? `&month=${month}` : ''
        const yearParam = `year=${year}`

        // Fetch KPI stats
        const kpiRes = await fetch(`/api/dashboard/kpi?${yearParam}${monthParam}`)
        const kpiData = await kpiRes.json()
        setKpi(kpiData)

        // Fetch monthly data (always for the selected year)
        const monthlyRes = await fetch(`/api/dashboard/monthly?${yearParam}`)
        const monthlyData = await monthlyRes.json()
        setMonthlyData(monthlyData.data)

        // Fetch staff performance
        const staffRes = await fetch(`/api/dashboard/staff?${yearParam}${monthParam}`)
        const staffData = await staffRes.json()
        setStaffData(staffData.staff)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [year, month])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Filters */}
      <HeaderFilter
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Cards */}
        <KPICards
          total={kpi.total}
          closed={kpi.closed}
          closeRate={kpi.closeRate}
          avgTime={kpi.avgTime}
          pending={kpi.pending}
        />

        {/* Monthly Bar Chart */}
        <MonthlyBarChart data={monthlyData} />

        {/* Staff Performance Table */}
        <StaffPerformanceTable staff={staffData} />
      </div>
    </div>
  )
}
