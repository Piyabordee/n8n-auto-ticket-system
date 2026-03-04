# Dashboard Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Dashboard page (`/`) that displays user's ticket KPIs (Total, Closed) and recent tickets with auto-sync every 24 hours.

**Architecture:** Client-side Dashboard page fetches from Next.js API route (`/api/tickets`), which queries SQL Server directly using `mssql` package. Auto-sync uses LocalStorage to track last fetch timestamp.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, mssql package, LocalStorage

---

## Task 1: Add mssql dependency

**Files:**
- Modify: `LIFF/package.json`

**Step 1: Add mssql package**

Open `LIFF/package.json` and add to dependencies:
```json
"mssql": "^10.0.0"
```

**Step 2: Install dependency**

Run: `cd LIFF && npm install`
Expected: Package installs successfully

**Step 3: Commit**

```bash
cd LIFF
git add package.json package-lock.json
git commit -m "deps: add mssql package for SQL Server connection"
```

---

## Task 2: Create SQL connection utility

**Files:**
- Create: `LIFF/app/lib/sql.ts`

**Step 1: Create SQL connection utility**

Create file `LIFF/app/lib/sql.ts`:
```typescript
import sql from 'mssql'

const config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
}

export async function getConnection() {
  try {
    const pool = await sql.connect(config)
    return pool
  } catch (error) {
    console.error('SQL connection error:', error)
    throw error
  }
}

export async function closeConnection(pool: sql.ConnectionPool) {
  try {
    await pool.close()
  } catch (error) {
    console.error('SQL close error:', error)
  }
}
```

**Step 2: Create .env.local.example**

Create file `LIFF/.env.local.example`:
```env
# LIFF
NEXT_PUBLIC_LIFF_ID=your-liff-id-here

# SQL Server
SQL_SERVER=your_server
SQL_DATABASE=YourDatabase
SQL_USER=your_username
SQL_PASSWORD=your_password
```

**Step 3: Commit**

```bash
cd LIFF
git add app/lib/sql.ts .env.local.example
git commit -m "feat: add SQL connection utility"
```

---

## Task 3: Create API route for tickets

**Files:**
- Create: `LIFF/app/api/tickets/route.ts`

**Step 1: Create tickets API route**

Create file `LIFF/app/api/tickets/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getConnection, closeConnection } from '@/lib/sql'
import sql from 'mssql'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const pool = await getConnection()

    // KPI: Total tickets
    const totalResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT COUNT(*) as total
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId
      `)
    const total = totalResult.recordset[0].total

    // KPI: Closed tickets
    const closedResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT COUNT(*) as closed
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId AND status = 'closed'
      `)
    const closed = closedResult.recordset[0].closed

    // Recent tickets
    const ticketsResult = await pool.request()
      .input('userId', sql.VarChar(50), userId)
      .query(`
        SELECT TOP 20
          message_id, subject, status, category,
          sub_category, branch_name, created_date
        FROM [YourDatabase].[dbo].[ticket]
        WHERE userid = @userId
        ORDER BY created_date DESC
      `)

    await closeConnection(pool)

    return NextResponse.json({
      kpi: { total, closed },
      tickets: ticketsResult.recordset
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
cd LIFF
git add app/api/tickets/route.ts
git commit -m "feat: add tickets API route"
```

---

## Task 4: Create KPICard component

**Files:**
- Create: `LIFF/app/components/KPICard.tsx`

**Step 1: Create KPICard component**

Create file `LIFF/app/components/KPICard.tsx`:
```typescript
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
```

**Step 2: Commit**

```bash
cd LIFF
git add app/components/KPICard.tsx
git commit -m "feat: add KPICard component"
```

---

## Task 5: Create TicketCard component

**Files:**
- Create: `LIFF/app/components/TicketCard.tsx`

**Step 1: Create TicketCard component**

Create file `LIFF/app/components/TicketCard.tsx`:
```typescript
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
```

**Step 2: Commit**

```bash
cd LIFF
git add app/components/TicketCard.tsx
git commit -m "feat: add TicketCard component"
```

---

## Task 6: Create TicketList component

**Files:**
- Create: `LIFF/app/components/TicketList.tsx`

**Step 1: Create TicketList component**

Create file `LIFF/app/components/TicketList.tsx`:
```typescript
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
```

**Step 2: Commit**

```bash
cd LIFF
git add app/components/TicketList.tsx
git commit -m "feat: add TicketList component"
```

---

## Task 7: Create RefreshButton component

**Files:**
- Create: `LIFF/app/components/RefreshButton.tsx`

**Step 1: Create RefreshButton component**

Create file `LIFF/app/components/RefreshButton.tsx`:
```typescript
interface RefreshButtonProps {
  onRefresh: () => void
  loading: boolean
  lastUpdate: Date | null
}

export function RefreshButton({ onRefresh, loading, lastUpdate }: RefreshButtonProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center justify-between">
      {lastUpdate && (
        <span className="text-sm text-gray-500">
          🔄 อัปเดตล่าสุด: {formatTime(lastUpdate)}
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white transition-colors`}
      >
        <span>{loading ? '⏳' : '🔄'}</span>
        <span>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd LIFF
git add app/components/RefreshButton.tsx
git commit -m "feat: add RefreshButton component"
```

---

## Task 8: Create Dashboard page

**Files:**
- Create: `LIFF/app/page.tsx`

**Step 1: Create Dashboard page**

Create file `LIFF/app/page.tsx`:
```typescript
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
```

**Step 2: Commit**

```bash
cd LIFF
git add app/page.tsx
git commit -m "feat: add Dashboard page with auto-sync"
```

---

## Task 9: Update types

**Files:**
- Modify: `LIFF/app/types/index.ts`

**Step 1: Add ticket types to types file**

Edit `LIFF/app/types/index.ts`, add at the end:
```typescript
export interface Ticket {
  message_id: string
  subject: string
  status: 'pending' | 'assigned' | 'closed' | 'unsent'
  category: string
  sub_category: string
  branch_name: string
  created_date: string
}

export interface TicketsResponse {
  kpi: {
    total: number
    closed: number
  }
  tickets: Ticket[]
}
```

**Step 2: Commit**

```bash
cd LIFF
git add app/types/index.ts
git commit -m "feat: add ticket types"
```

---

## Task 10: Update documentation

**Files:**
- Modify: `LIFF/README.md`

**Step 1: Update README with Dashboard info**

Edit `LIFF/README.md`, update Project Structure section:
```markdown
## Project Structure

```
LIFF/
├── app/                    # Next.js App Router pages
│   ├── create/            # Ticket creation page
│   ├── page.tsx           # Dashboard page (KPI + ticket list)
│   ├── api/               # API routes
│   │   └── tickets/       # Tickets API endpoint
│   ├── components/        # Reusable components
│   │   ├── CategorySelect.tsx
│   │   ├── BranchSelect.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── KPICard.tsx
│   │   ├── TicketCard.tsx
│   │   ├── TicketList.tsx
│   │   ├── LiffProvider.tsx
│   │   ├── TicketForm.tsx
│   │   └── ui/           # shadcn/ui components
│   └── types/            # TypeScript type definitions
└── tests/                # Component tests
```

## Features

- **Dashboard (`/`)**: View ticket statistics (Total, Closed) and recent tickets with auto-sync
- **Create Ticket (`/create`)**: Submit new IT helpdesk tickets
```

**Step 2: Commit**

```bash
cd LIFF
git add README.md
git commit -m "docs: update README with Dashboard info"
```

---

## Task 11: Update LIFF AGENTS.md version

**Files:**
- Modify: `LIFF/AGENTS.md`

**Step 1: Update version and features**

Edit `LIFF/AGENTS.md`, update:
```markdown
> **Version**: 1.2.0
```

Add to Core Features:
```markdown
* **Feature 2: Dashboard Page (/)**: Shows KPI Cards (Total, Closed) and a list of user's recent tickets with auto-sync every 24 hours.
```

**Step 2: Commit**

```bash
cd LIFF
git add AGENTS.md
git commit -m "docs: update AGENTS.md to v1.2.0 with Dashboard feature"
```

---

## Task 12: Final verification

**Files:**
- None (verification only)

**Step 1: Run development server**

Run: `cd LIFF && npm run dev`
Expected: Server starts at http://localhost:3000

**Step 2: Test Dashboard**

1. Open http://localhost:3000
2. Should see Dashboard with:
   - Header with "🏠 IT Helpdesk"
   - KPI cards (Total, Closed)
   - Refresh button with timestamp
   - Ticket list or empty state
   - Floating + button

**Step 3: Test auto-sync**

1. Check LocalStorage for `liff_last_sync`
2. Reload page after 24h (or manually clear storage)
3. Should auto-fetch data

**Step 4: Test API**

Run: `curl "http://localhost:3000/api/tickets?userId=U1234567890"`
Expected: JSON response with kpi and tickets

**Step 5: Final commit (if any fixes needed)**

```bash
cd LIFF
git add .
git commit -m "fix: [description of fix]"
```

---

## Notes

- Database name `[YourDatabase]` in queries must be replaced with actual database name
- SQL credentials must be set in `.env.local`
- For development without SQL, the API will return errors - this is expected
- The Dashboard uses mock LIFF profile in development mode (already in LiffProvider)
