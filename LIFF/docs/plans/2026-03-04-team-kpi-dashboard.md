# Team KPI Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Team Performance Dashboard showing KPI metrics (Total/Closed/Avg Time), monthly ticket volume bar chart, and staff performance rankings table.

**Architecture:** Client Component page fetching from API routes that query SQL Server for aggregated ticket data by month and by staff member. Recharts for monthly bar chart, Tailwind for responsive layout.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, Recharts, SQL Server (mssql)

---

## Prerequisites

### Task 0: Install Dependencies

**Files:**
- Modify: `LIFF/package.json`

**Step 1: Install recharts for charts**

```bash
cd c:/dev/LIFF
npm install recharts
```

Expected: Package added to package.json

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add recharts for KPI dashboard charts"
```

---

## API Routes

### Task 1: Create KPI Stats API

**Files:**
- Create: `LIFF/app/api/dashboard/kpi/route.ts`

**Step 1: Write the KPI stats API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month') // null = all months

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Build date range
    const currentYear = year ? parseInt(year) : new Date().getFullYear()
    const startMonth = month ? parseInt(month) : 1
    const endMonth = month ? parseInt(month) : 12

    const startDate = new Date(currentYear, startMonth - 1, 1)
    const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

    // Total tickets
    const totalResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT COUNT(*) as total
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
      `)
    const total = totalResult.recordset[0].total

    // Closed tickets
    const closedResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT COUNT(*) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status = 'closed'
      `)
    const closed = closedResult.recordset[0].closed

    // Average resolution time (in minutes)
    const avgTimeResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT AVG(close_time_minute) as avgTime
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status = 'closed'
        AND close_time_minute IS NOT NULL
      `)
    const avgTime = avgTimeResult.recordset[0].avgTime || 0

    // Pending tickets (not closed yet)
    const pendingResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT COUNT(*) as pending
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND status IN ('pending', 'assigned')
      `)
    const pending = pendingResult.recordset[0].pending

    // Close rate percentage
    const closeRate = total > 0 ? Math.round((closed / total) * 100) : 0

    return NextResponse.json({
      total,
      closed,
      closeRate,
      avgTime: Math.round(avgTime * 10) / 10, // 1 decimal place
      pending
    })
  } catch (error) {
    console.error('KPI API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Run: `npm run dev`

Test: `http://localhost:3000/api/dashboard/kpi?year=2026`

Expected: JSON with total, closed, closeRate, avgTime, pending

**Step 3: Commit**

```bash
git add app/api/dashboard/kpi/route.ts
git commit -m "feat: add KPI stats API endpoint"
```

---

### Task 2: Create Monthly Chart Data API

**Files:**
- Create: `LIFF/app/api/dashboard/monthly/route.ts`

**Step 1: Write the monthly chart data API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')

  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1)
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59)

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get monthly totals
    const monthlyResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT
          MONTH(created_date) as month,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        GROUP BY MONTH(created_date)
        ORDER BY month
      `)

    // Build data for all 12 months (fill missing with 0)
    const monthlyData = THAI_MONTHS.map((monthName, index) => {
      const found = monthlyResult.recordset.find(r => r.month === index + 1)
      return {
        month: monthName,
        total: found?.total || 0,
        closed: found?.closed || 0
      }
    })

    return NextResponse.json({ data: monthlyData })
  } catch (error) {
    console.error('Monthly API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Test: `http://localhost:3000/api/dashboard/monthly?year=2026`

Expected: JSON with data array of 12 months with total and closed counts

**Step 3: Commit**

```bash
git add app/api/dashboard/monthly/route.ts
git commit -m "feat: add monthly chart data API endpoint"
```

---

### Task 3: Create Staff Performance API

**Files:**
- Create: `LIFF/app/api/dashboard/staff/route.ts`

**Step 1: Write the staff performance API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import sql from 'mssql'

const sqlConfig = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const currentYear = year ? parseInt(year) : new Date().getFullYear()
  const startMonth = month ? parseInt(month) : 1
  const endMonth = month ? parseInt(month) : 12

  const startDate = new Date(currentYear, startMonth - 1, 1)
  const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59)

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Get staff performance stats
    const staffResult = await pool.request()
      .input('startDate', sql.DateTime(startDate))
      .input('endDate', sql.DateTime(endDate))
      .query(`
        SELECT
          assigned_to,
          COUNT(*) as totalAssigned,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as totalClosed,
          AVG(CASE WHEN status = 'closed' AND close_time_minute IS NOT NULL THEN close_time_minute END) as avgTime
        FROM [Dev_Born].[dbo].[ticket]
        WHERE created_date >= @startDate AND created_date <= @endDate
        AND assigned_to IS NOT NULL
        AND assigned_to != ''
        GROUP BY assigned_to
        ORDER BY totalClosed DESC
      `)

    // Format results with ranking
    const staffData = staffResult.recordset.map((row, index) => ({
      rank: index + 1,
      name: row.assigned_to,
      totalAssigned: row.totalAssigned,
      totalClosed: row.totalClosed,
      avgTime: row.avgTime ? Math.round(row.avgTime * 10) / 10 : 0
    }))

    return NextResponse.json({ staff: staffData })
  } catch (error) {
    console.error('Staff API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff performance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Test: `http://localhost:3000/api/dashboard/staff?year=2026`

Expected: JSON with staff array containing rank, name, totalAssigned, totalClosed, avgTime

**Step 3: Commit**

```bash
git add app/api/dashboard/staff/route.ts
git commit -m "feat: add staff performance API endpoint"
```

---

## Dashboard Components

### Task 4: Create Dashboard Components Directory

**Files:**
- Create: `LIFF/app/components/dashboard/` directory

**Step 1: Create directory structure**

```bash
mkdir -p c:/dev/LIFF/app/components/dashboard
```

**Step 2: Commit**

```bash
git add app/components/dashboard/
git commit -m "chore: create dashboard components directory"
```

---

### Task 5: Create KPICards Component

**Files:**
- Create: `LIFF/app/components/dashboard/KPICards.tsx`

**Step 1: Write the KPI Cards component**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/components/dashboard/KPICards.tsx
git commit -m "feat: add KPI Cards component"
```

---

### Task 6: Create MonthlyBarChart Component

**Files:**
- Create: `LIFF/app/components/dashboard/MonthlyBarChart.tsx`

**Step 1: Write the Monthly Bar Chart component**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/components/dashboard/MonthlyBarChart.tsx
git commit -m "feat: add Monthly Bar Chart component"
```

---

### Task 7: Create StaffPerformanceTable Component

**Files:**
- Create: `LIFF/app/components/dashboard/StaffPerformanceTable.tsx`

**Step 1: Write the Staff Performance Table component**

```typescript
'use client'

interface StaffData {
  rank: number
  name: string
  totalAssigned: number
  totalClosed: number
  avgTime: number
}

interface StaffPerformanceTableProps {
  staff: StaffData[]
}

export default function StaffPerformanceTable({ staff }: StaffPerformanceTableProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800'
    if (rank === 2) return 'bg-gray-100 text-gray-600'
    if (rank === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-50 text-gray-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">ผลงานทีม (Staff Performance)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อันดับ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อพนักงาน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">รับงาน</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ปิดแล้ว</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">เวลาเฉลี่ย (นาที)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((person) => (
              <tr key={person.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankBadge(person.rank)}`}>
                    {getRankIcon(person.rank)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {person.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {person.totalAssigned}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  <span className="text-green-600 font-semibold">{person.totalClosed}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {person.avgTime > 0 ? person.avgTime.toFixed(1) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/StaffPerformanceTable.tsx
git commit -m "feat: add Staff Performance Table component"
```

---

### Task 8: Create Header Filter Component

**Files:**
- Create: `LIFF/app/components/dashboard/HeaderFilter.tsx`

**Step 1: Write the Header Filter component**

```typescript
'use client'

interface HeaderFilterProps {
  year: number
  setYear: (year: number) => void
  month: number | null
  setMonth: (month: number | null) => void
}

export default function HeaderFilter({ year, setYear, month, setMonth }: HeaderFilterProps) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  const months = [
    { value: null, label: 'ทั้งปี' },
    { value: 1, label: 'ม.ค.' },
    { value: 2, label: 'ก.พ.' },
    { value: 3, label: 'มี.ค.' },
    { value: 4, label: 'เม.ย.' },
    { value: 5, label: 'พ.ค.' },
    { value: 6, label: 'มิ.ย.' },
    { value: 7, label: 'ก.ค.' },
    { value: 8, label: 'ส.ค.' },
    { value: 9, label: 'ก.ย.' },
    { value: 10, label: 'ต.ค.' },
    { value: 11, label: 'พ.ย.' },
    { value: 12, label: 'ธ.ค.' },
  ]

  return (
    <div className="bg-header-yellow">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Team KPI Dashboard</h1>
              <p className="text-sm text-gray-700">ระบบวัดผลงานทีม IT Support</p>
            </div>
          </div>

          {/* Right: Filters */}
          <div className="flex items-center gap-3">
            {/* Year Filter */}
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={month ?? 'all'}
              onChange={(e) => setMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m.label} value={m.value ?? 'all'}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/HeaderFilter.tsx
git commit -m "feat: add Header Filter component"
```

---

## Main Dashboard Page

### Task 9: Create Main Dashboard Page

**Files:**
- Modify: `LIFF/app/page.tsx`

**Step 1: Replace page.tsx with Team KPI Dashboard**

```typescript
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
```

**Step 2: Test the Dashboard**

Run: `npm run dev`

Visit: `http://localhost:3000`

Expected:
- Yellow header with year/month filters
- 4 KPI cards showing total, closed, close rate, avg time
- Bar chart showing monthly ticket volume
- Staff table with rankings

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement Team KPI Dashboard page"
```

---

## Tailwind Configuration

### Task 10: Update Tailwind Config

**Files:**
- Modify: `LIFF/tailwind.config.js`

**Step 1: Add custom colors**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'header-yellow': '#FBBF24',
      }
    },
  },
  plugins: [],
}
```

**Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "style: add header-yellow color for dashboard"
```

---

## Testing

### Task 11: Manual Testing Checklist

**Step 1: Test KPI Cards**

- [ ] Total tickets matches database
- [ ] Closed tickets count is correct
- [ ] Close rate percentage is accurate
- [ ] Average time displays correctly

**Step 2: Test Monthly Bar Chart**

- [ ] All 12 months display
- [ ] Total and closed bars show correctly
- [ ] Tooltips work on hover
- [ ] Legend displays

**Step 3: Test Staff Table**

- [ ] Rankings are correct (ordered by totalClosed DESC)
- [ ] Each staff member's stats are accurate
- [ ] Top 3 have badge colors
- [ ] Avg time shows 1 decimal place

**Step 4: Test Filters**

- [ ] Year filter changes data
- [ ] Month filter changes data
- [ ] "All months" shows full year data
- [ ] Specific month shows only that month

**Step 5: Test Edge Cases**

- [ ] No data for selected period
- [ ] Staff with zero avg time (not closed any)
- [ ] Year with very few tickets

---

## Completion

### Task 12: Final Review

**Step 1: Verify all features work**

- [ ] Header with yellow background displays
- [ ] KPI cards show 4 metrics
- [ ] Monthly bar chart renders
- [ ] Staff table with rankings displays
- [ ] Year/month filters work
- [ ] Data refreshes when filters change

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete Team KPI Dashboard implementation

- Add KPI stats API (total, closed, close rate, avg time)
- Add monthly chart data API (12 months)
- Add staff performance API with rankings
- Implement HeaderFilter component
- Implement KPICards (4 metrics)
- Implement MonthlyBarChart (Recharts)
- Implement StaffPerformanceTable with rankings
- Add responsive layout with Tailwind CSS"
```

---

## Notes

- KPI cards use border-left colors to distinguish metric types
- Bar chart uses Recharts with blue (total) and green (closed) colors
- Staff ranking is based on totalClosed DESC (most closed tickets first)
- Avg time is calculated from close_time_minute field in database
- Month filter supports "all months" (null) for full year view
- Thai month names are hardcoded for display
