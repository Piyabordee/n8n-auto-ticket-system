# IT Helpdesk Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a dashboard UI matching the reference image with KPI metrics, charts (Recharts), and paginated ticket table with filtering capabilities.

**Architecture:** Single Client Component page fetching data from 3 new API routes (`/api/dashboard/stats`, `/api/dashboard/charts`, `/api/dashboard/tickets`). Recharts for visualization, Tailwind for styling to match yellow-header design.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Recharts, date-fns, SQL Server (mssql)

---

## Prerequisites

### Task 0: Install Dependencies

**Files:**
- Modify: `LIFF/package.json`

**Step 1: Install recharts and date-fns**

```bash
cd c:/dev/LIFF
npm install recharts date-fns
```

Expected: Packages added to package.json and node_modules

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add recharts and date-fns for dashboard"
```

---

## API Routes

### Task 1: Create Stats API Route

**Files:**
- Create: `LIFF/app/api/dashboard/stats/route.ts`

**Step 1: Write the stats API route**

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
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  const branchCompany = searchParams.get('branchCompany')

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Build WHERE clause
    let whereClause = '1=1'
    const params: any = {}

    if (startDate) {
      whereClause += ' AND created_date >= @startDate'
      params.startDate = sql.DateTime(new Date(startDate))
    }
    if (endDate) {
      whereClause += ' AND created_date <= @endDate'
      params.endDate = sql.DateTime(new Date(endDate))
    }
    if (status && status !== 'all') {
      whereClause += ' AND status = @status'
      params.status = sql.VarChar(status)
    }
    if (branchCompany && branchCompany !== 'all') {
      whereClause += ' AND branch_company = @branchCompany'
      params.branchCompany = sql.VarChar(branchCompany)
    }

    // Equipment count (HW, PRINTER, CAMERA, NETWORK)
    const equipResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT COUNT(*) as count
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        AND category IN ('HW', 'PRINTER', 'CAMERA', 'NETWORK')
      `)

    // Task count (INC intent)
    const taskResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT COUNT(*) as count
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        AND intent = 'INC'
      `)

    // Tools count (SR intent)
    const toolsResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT COUNT(*) as count
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        AND intent = 'SR'
      `)

    return NextResponse.json({
      equipmentCount: equipResult.recordset[0].count,
      taskCount: taskResult.recordset[0].count,
      toolsCount: toolsResult.recordset[0].count
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Run dev server: `npm run dev`

Test: `http://localhost:3000/api/dashboard/stats`

Expected: JSON response with equipmentCount, taskCount, toolsCount

**Step 3: Commit**

```bash
git add app/api/dashboard/stats/route.ts
git commit -m "feat: add dashboard stats API endpoint"
```

---

### Task 2: Create Charts API Route

**Files:**
- Create: `LIFF/app/api/dashboard/charts/route.ts`

**Step 1: Write the charts API route**

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

// Category to Thai label mapping
const CATEGORY_LABELS: Record<string, string> = {
  'SW': 'เครื่องคอมพิวเตอร์/Case',
  'HW': 'เครื่องคอมพิวเตอร์/Case',
  'PRINTER': 'เครื่องพิมพ์เตอร์',
  'NETWORK': 'เครือข่าย [Internet]',
  'CAMERA': 'กล้อง',
  'RATE': 'โทรทัศน์ [Television]',
  'POS': 'ไมโครโฟน [Microphone]',
  'PASSWORD': 'รหัสผ่าน',
  'REQUEST': 'คำขอ',
  'SOFTWARE': 'ซอฟต์แวร์ [Software]',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  const branchCompany = searchParams.get('branchCompany')

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Build WHERE clause
    let whereClause = '1=1'
    const params: any = {}

    if (startDate) {
      whereClause += ' AND created_date >= @startDate'
      params.startDate = sql.DateTime(new Date(startDate))
    }
    if (endDate) {
      whereClause += ' AND created_date <= @endDate'
      params.endDate = sql.DateTime(new Date(endDate))
    }
    if (status && status !== 'all') {
      whereClause += ' AND status = @status'
      params.status = sql.VarChar(status)
    }
    if (branchCompany && branchCompany !== 'all') {
      whereClause += ' AND branch_company = @branchCompany'
      params.branchCompany = sql.VarChar(branchCompany)
    }

    // By category
    const categoryResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT category, COUNT(*) as value
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        GROUP BY category
      `)

    // By sub_category
    const subCategoryResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT sub_category, COUNT(*) as value
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        AND sub_category IS NOT NULL
        GROUP BY sub_category
      `)

    // Map category results
    const byCategory = categoryResult.recordset.map(row => ({
      name: CATEGORY_LABELS[row.category] || row.category,
      value: row.value
    }))

    // Map sub_category results
    const bySubCategory = subCategoryResult.recordset.map(row => ({
      name: row.sub_category,
      value: row.value
    }))

    return NextResponse.json({
      byCategory,
      bySubCategory
    })
  } catch (error) {
    console.error('Charts API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch charts data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Test: `http://localhost:3000/api/dashboard/charts`

Expected: JSON with byCategory and bySubCategory arrays

**Step 3: Commit**

```bash
git add app/api/dashboard/charts/route.ts
git commit -m "feat: add dashboard charts API endpoint"
```

---

### Task 3: Create Tickets API Route

**Files:**
- Create: `LIFF/app/api/dashboard/tickets/route.ts`

**Step 1: Write the tickets API route**

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
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const status = searchParams.get('status')
  const branchCompany = searchParams.get('branchCompany')

  const offset = (page - 1) * pageSize

  let pool: sql.ConnectionPool | null = null

  try {
    pool = await sql.connect(sqlConfig)

    // Build WHERE clause
    let whereClause = '1=1'
    const params: any = {}

    if (startDate) {
      whereClause += ' AND created_date >= @startDate'
      params.startDate = sql.DateTime(new Date(startDate))
    }
    if (endDate) {
      whereClause += ' AND created_date <= @endDate'
      params.endDate = sql.DateTime(new Date(endDate))
    }
    if (status && status !== 'all') {
      whereClause += ' AND status = @status'
      params.status = sql.VarChar(status)
    }
    if (branchCompany && branchCompany !== 'all') {
      whereClause += ' AND branch_company = @branchCompany'
      params.branchCompany = sql.VarChar(branchCompany)
    }

    // Get total count
    const countResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .query(`
        SELECT COUNT(*) as total
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
      `)

    const total = countResult.recordset[0].total

    // Get paginated tickets
    const ticketsResult = await pool.request()
      .input('startDate', params.startDate || sql.DateTime('1900-01-01'))
      .input('endDate', params.endDate || sql.DateTime('2100-01-01'))
      .input('status', params.status || sql.VarChar('all'))
      .input('branchCompany', params.branchCompany || sql.VarChar('all'))
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(`
        SELECT
          message_id,
          created_date,
          subject,
          fromuser,
          branch_name,
          category,
          sub_category,
          status
        FROM [Dev_Born].[dbo].[ticket]
        WHERE ${whereClause}
        ORDER BY created_date DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `)

    return NextResponse.json({
      items: ticketsResult.recordset,
      total,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Tickets API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (pool) await pool.close()
  }
}
```

**Step 2: Test the API**

Test: `http://localhost:3000/api/dashboard/tickets?page=1&pageSize=10`

Expected: JSON with items array, total, page, pageSize

**Step 3: Commit**

```bash
git add app/api/dashboard/tickets/route.ts
git commit -m "feat: add dashboard tickets API endpoint with pagination"
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

### Task 5: Create Header Component

**Files:**
- Create: `LIFF/app/components/dashboard/Header.tsx`

**Step 1: Write the Header component**

```typescript
'use client'

import { useState } from 'react'

interface HeaderProps {
  status: string
  setStatus: (status: string) => void
  branchCompany: string
  setBranchCompany: (company: string) => void
  showCalendar: boolean
  setShowCalendar: (show: boolean) => void
  dateRange: { year: number; quarter?: number; month?: number }
  setDateRange: (range: any) => void
}

export default function Header({
  status,
  setStatus,
  branchCompany,
  setBranchCompany,
  showCalendar,
  setShowCalendar,
  dateRange,
  setDateRange,
}: HeaderProps) {
  return (
    <div className="bg-header-yellow">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-xl">🖥️</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              ระบบบริหารจัดการอุปกรณ์ และบริการซ่อมสอบอุปกรณ์ IT
            </h1>
          </div>

          {/* Right: Filters */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="assigned">ดำเนินการ</option>
              <option value="closed">เสร็จสิ้น</option>
            </select>

            {/* Department Filter */}
            <select
              value={branchCompany}
              onChange={(e) => setBranchCompany(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">โครงการ/หน่วยงานทั้งหมด</option>
              <option value="Branch SPR">Branch SPR</option>
              <option value="Branch Franchise">Branch Franchise</option>
            </select>

            {/* Date Filter */}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-left"
            >
              {dateRange.month
                ? `${dateRange.year} ไตรมาส ${dateRange.quarter} เดือน ${dateRange.month}`
                : dateRange.quarter
                ? `${dateRange.year} ไตรมาส ${dateRange.quarter}`
                : `${dateRange.year}`}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <DateFilterPopup
          dateRange={dateRange}
          setDateRange={setDateRange}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  )
}

// Simple Date Filter Popup Component
function DateFilterPopup({
  dateRange,
  setDateRange,
  onClose,
}: {
  dateRange: { year: number; quarter?: number; month?: number }
  setDateRange: (range: any) => void
  onClose: () => void
}) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const quarters = [1, 2, 3, 4]
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 min-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">เลือกช่วงเวลา</h3>

        {/* Year Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
          <select
            value={dateRange.year}
            onChange={(e) => setDateRange({ ...dateRange, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y + 543}
              </option>
            ))}
          </select>
        </div>

        {/* Quarter Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ไตรมาส (ไม่เลือก = ทั้งปี)</label>
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange({ ...dateRange, quarter: undefined, month: undefined })}
              className={`px-4 py-2 rounded-md text-sm ${
                !dateRange.quarter ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              ทั้งปี
            </button>
            {quarters.map((q) => (
              <button
                key={q}
                onClick={() => setDateRange({ ...dateRange, quarter: q, month: undefined })}
                className={`px-4 py-2 rounded-md text-sm ${
                  dateRange.quarter === q ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selection */}
        {dateRange.quarter && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">เดือน (ไม่เลือก = ทั้งไตรมาส)</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setDateRange({ ...dateRange, month: undefined })}
                className={`px-2 py-2 rounded-md text-xs ${
                  !dateRange.month ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                ทั้งไตรมาส
              </button>
              {months.map((m) => {
                const quarterMonths = dateRange.quarter === 1 ? [1, 2, 3]
                  : dateRange.quarter === 2 ? [4, 5, 6]
                  : dateRange.quarter === 3 ? [7, 8, 9]
                  : [10, 11, 12]

                if (!quarterMonths.includes(m)) return null

                return (
                  <button
                    key={m}
                    onClick={() => setDateRange({ ...dateRange, month: m })}
                    className={`px-2 py-2 rounded-md text-xs ${
                      dateRange.month === m ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
           ตกลง
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/Header.tsx
git commit -m "feat: add dashboard Header component with filters"
```

---

### Task 6: Create KPI Cards Component

**Files:**
- Create: `LIFF/app/components/dashboard/KPICards.tsx`

**Step 1: Write the KPI Cards component**

```typescript
'use client'

interface KPICardsProps {
  equipmentCount: number
  taskCount: number
  toolsCount: number
}

export default function KPICards({ equipmentCount, taskCount, toolsCount }: KPICardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Equipment Count Card */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="text-white text-sm mb-1">จำนวนอุปกรณ์</div>
        <div className="text-white text-3xl font-bold">{equipmentCount}</div>
      </div>

      {/* Task Count Card */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="text-white text-sm mb-1">จำนวนงาน</div>
        <div className="text-white text-3xl font-bold">{taskCount}</div>
      </div>

      {/* Tools Count Card */}
      <div className="bg-blue-600 rounded-lg p-4">
        <div className="text-white text-sm mb-1">จำนวนเครื่องมือ</div>
        <div className="text-white text-3xl font-bold">{toolsCount}</div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/KPICards.tsx
git commit -m "feat: add dashboard KPI Cards component"
```

---

### Task 7: Create Bar Charts Component

**Files:**
- Create: `LIFF/app/components/dashboard/BarChartSection.tsx`

**Step 1: Write the Bar Charts component**

```typescript
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BarChartSectionProps {
  byCategory: Array<{ name: string; value: number }>
  bySubCategory: Array<{ name: string; value: number }>
}

export default function BarChartSection({ byCategory, bySubCategory }: BarChartSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Equipment by Category Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">จำนวนอุปกรณ์/ประเภท</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks by Sub Category Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">จำนวนงาน/ประเภท</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bySubCategory.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/BarChartSection.tsx
git commit -m "feat: add dashboard Bar Charts component"
```

---

### Task 8: Create Pie Charts Component

**Files:**
- Create: `LIFF/app/components/dashboard/PieChartSection.tsx`

**Step 1: Write the Pie Charts component**

```typescript
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PieChartSectionProps {
  byCategory: Array<{ name: string; value: number }>
  bySubCategory: Array<{ name: string; value: number }>
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#000000']

export default function PieChartSection({ byCategory, bySubCategory }: PieChartSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Equipment Distribution Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">สัดส่วนอุปกรณ์/ประเภท</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={byCategory}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {byCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tasks Distribution Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">สัดส่วนงาน/ประเภท</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={bySubCategory.slice(0, 5)}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {bySubCategory.slice(0, 5).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/PieChartSection.tsx
git commit -m "feat: add dashboard Pie Charts component"
```

---

### Task 9: Create Data Table Component

**Files:**
- Create: `LIFF/app/components/dashboard/DataTable.tsx`

**Step 1: Write the Data Table component**

```typescript
'use client'

interface Ticket {
  message_id: string
  created_date: string
  subject: string
  fromuser: string
  branch_name: string
  category: string
  sub_category: string
  status: string
}

interface DataTableProps {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function DataTable({ tickets, total, page, pageSize, onPageChange }: DataTableProps) {
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, total)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-green-100 text-green-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'closed': return 'เสร็จสิ้น'
      case 'assigned': return 'ดำเนินการ'
      case 'pending': return 'รอดำเนินการ'
      default: return status
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก/หน่วยงาน</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภทอุปกรณ์</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket, index) => (
              <tr key={ticket.message_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {startIndex + index}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(ticket.created_date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.fromuser || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.branch_name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.category || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {getStatusText(ticket.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {startIndex} - {endIndex} ของ {total}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ◀
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={endIndex >= total}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/components/dashboard/DataTable.tsx
git commit -m "feat: add dashboard Data Table component with pagination"
```

---

## Main Dashboard Page

### Task 10: Update Main Page Component

**Files:**
- Modify: `LIFF/app/page.tsx`

**Step 1: Replace the entire page.tsx with Dashboard**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Header from './components/dashboard/Header'
import KPICards from './components/dashboard/KPICards'
import BarChartSection from './components/dashboard/BarChartSection'
import PieChartSection from './components/dashboard/PieChartSection'
import DataTable from './components/dashboard/DataTable'

interface Stats {
  equipmentCount: number
  taskCount: number
  toolsCount: number
}

interface ChartData {
  byCategory: Array<{ name: string; value: number }>
  bySubCategory: Array<{ name: string; value: number }>
}

interface Ticket {
  message_id: string
  created_date: string
  subject: string
  fromuser: string
  branch_name: string
  category: string
  sub_category: string
  status: string
}

interface TicketsResponse {
  items: Ticket[]
  total: number
  page: number
  pageSize: number
}

export default function DashboardPage() {
  // Filter states
  const [status, setStatus] = useState<string>('all')
  const [branchCompany, setBranchCompany] = useState<string>('all')
  const [showCalendar, setShowCalendar] = useState<boolean>(false)

  // Date range state
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  const [dateRange, setDateRange] = useState({
    year: currentYear,
    quarter: currentQuarter,
    month: currentMonth,
  })

  // Data states
  const [stats, setStats] = useState<Stats>({ equipmentCount: 0, taskCount: 0, toolsCount: 0 })
  const [charts, setCharts] = useState<ChartData>({ byCategory: [], bySubCategory: [] })
  const [tickets, setTickets] = useState<TicketsResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 100,
  })

  // Loading states
  const [loading, setLoading] = useState(true)

  // Build query params
  const getStartDate = () => {
    const startMonth = dateRange.quarter ? (dateRange.quarter - 1) * 3 + 1 : 1
    const month = dateRange.month || startMonth
    return new Date(dateRange.year, month - 1, 1).toISOString()
  }

  const getEndDate = () => {
    if (dateRange.month) {
      return new Date(dateRange.year, dateRange.month, 0).toISOString()
    }
    const endMonth = dateRange.quarter ? dateRange.quarter * 3 : 12
    return new Date(dateRange.year, endMonth, 0).toISOString()
  }

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const startDate = getStartDate()
      const endDate = getEndDate()

      try {
        // Fetch stats
        const statsRes = await fetch(
          `/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}&status=${status}&branchCompany=${branchCompany}`
        )
        const statsData = await statsRes.json()
        setStats(statsData)

        // Fetch charts
        const chartsRes = await fetch(
          `/api/dashboard/charts?startDate=${startDate}&endDate=${endDate}&status=${status}&branchCompany=${branchCompany}`
        )
        const chartsData = await chartsRes.json()
        setCharts(chartsData)

        // Fetch tickets (reset to page 1 when filters change)
        const ticketsRes = await fetch(
          `/api/dashboard/tickets?page=1&pageSize=100&startDate=${startDate}&endDate=${endDate}&status=${status}&branchCompany=${branchCompany}`
        )
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status, branchCompany, dateRange])

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    const startDate = getStartDate()
    const endDate = getEndDate()

    const ticketsRes = await fetch(
      `/api/dashboard/tickets?page=${newPage}&pageSize=100&startDate=${startDate}&endDate=${endDate}&status=${status}&branchCompany=${branchCompany}`
    )
    const ticketsData = await ticketsRes.json()
    setTickets(ticketsData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        status={status}
        setStatus={setStatus}
        branchCompany={branchCompany}
        setBranchCompany={setBranchCompany}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-6">
        {/* KPI Cards */}
        <KPICards
          equipmentCount={stats.equipmentCount}
          taskCount={stats.taskCount}
          toolsCount={stats.toolsCount}
        />

        {/* Charts */}
        <BarChartSection byCategory={charts.byCategory} bySubCategory={charts.bySubCategory} />
        <PieChartSection byCategory={charts.byCategory} bySubCategory={charts.bySubCategory} />

        {/* Data Table */}
        <DataTable
          tickets={tickets.items}
          total={tickets.total}
          page={tickets.page}
          pageSize={tickets.pageSize}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
```

**Step 2: Test the Dashboard**

Run: `npm run dev`

Visit: `http://localhost:3000`

Expected: Dashboard with header, KPI cards, charts, and table displaying data from SQL Server

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement main dashboard page with all components"
```

---

## Tailwind Configuration

### Task 11: Update Tailwind Config

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
        'chart-green': '#22c55e',
      }
    },
  },
  plugins: [],
}
```

**Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "style: add custom colors for dashboard"
```

---

## Testing

### Task 12: Manual Testing

**Step 1: Test all filters**

1. Status filter - test each option (all, pending, assigned, closed)
2. Branch filter - test each option (all, Branch SPR, Branch Franchise)
3. Date filter - test year, quarter, month selection

**Step 2: Test pagination**

1. Click next/previous buttons
2. Verify data changes correctly
3. Verify page counter updates

**Step 3: Test responsive design**

1. Resize browser window
2. Verify layout adapts correctly

**Step 4: Fix any issues found**

---

## Completion

### Task 13: Final Review and Documentation

**Step 1: Verify all features work**

- [ ] Header displays with filters
- [ ] KPI cards show correct numbers
- [ ] Bar charts render with data
- [ ] Pie charts render with data
- [ ] Table displays tickets with pagination
- [ ] Filters work correctly
- [ ] Date picker opens and closes

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete dashboard UI implementation

- Add all API routes (stats, charts, tickets)
- Implement dashboard components (Header, KPICards, Charts, Table)
- Add Recharts integration for data visualization
- Implement filtering by status, branch, and date range
- Add pagination for ticket table
- Style with Tailwind CSS to match reference UI"
```

---

## Notes

- All API routes use SQL Server connection from environment variables
- Date handling uses JavaScript Date with Thai locale formatting
- Charts use Recharts library for responsive visualization
- Components are Client Components to support interactivity
- Filter changes trigger data reload
- Calendar popup is a custom component for Year/Quarter/Month selection
