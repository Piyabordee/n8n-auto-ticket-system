# Dashboard Page Design - IT Helpdesk LIFF App

> **Date:** 2026-03-04
> **Status:** Approved
> **Approach:** Client-Side SQL Query via Next.js API Route

---

## Overview

Add a Dashboard page (`/`) to display user's ticket statistics and recent tickets with auto-sync functionality every 24 hours.

---

## Architecture

```
Dashboard (app/page.tsx)
    │
    ▼
API Route (app/api/tickets/route.ts)
    │
    ▼
SQL Server [Dev_Born].[dbo].[ticket]
```

---

## Components

| File | Purpose |
|------|---------|
| `app/page.tsx` | Dashboard page with KPI cards and ticket list |
| `app/api/tickets/route.ts` | API endpoint that queries SQL Server |
| `components/KPICard.tsx` | Display single KPI metric |
| `components/TicketList.tsx` | List of ticket cards |
| `components/TicketCard.tsx` | Single ticket display |
| `components/RefreshButton.tsx` | Manual refresh button |

---

## API Design

**Endpoint:** `GET /api/tickets?userId=xxx`

**Response:**
```typescript
{
  kpi: {
    total: number,
    closed: number
  },
  tickets: Array<{
    message_id: string,
    subject: string,
    status: 'pending' | 'assigned' | 'closed' | 'unsent',
    category: string,
    sub_category: string,
    branch_name: string,
    created_date: string
  }>
}
```

---

## SQL Queries

```sql
-- KPI: Total tickets
SELECT COUNT(*) as total
FROM [YourDatabase].[dbo].[ticket]
WHERE userid = @userId

-- KPI: Closed tickets
SELECT COUNT(*) as closed
FROM [YourDatabase].[dbo].[ticket]
WHERE userid = @userId AND status = 'closed'

-- Recent tickets (TOP 20)
SELECT message_id, subject, status, category,
       sub_category, branch_name, created_date
FROM [YourDatabase].[dbo].[ticket]
WHERE userid = @userId
ORDER BY created_date DESC
```

---

## Auto-Sync Implementation

- **Storage:** LocalStorage (`liff_last_sync`)
- **Interval:** 24 hours
- **Trigger:** On page load, check if 24h passed → auto fetch
- **Manual:** Pull-to-refresh button

---

## Environment Variables

```env
SQL_SERVER=your_server
SQL_DATABASE=YourDatabase
SQL_USER=your_username
SQL_PASSWORD=your_password
```

---

## Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "mssql": "^10.0.0"
  }
}
```

---

## UI Mockup

```
┌─────────────────────────────────────────────┐
│  🏠 IT Helpdesk Dashboard                    │
├─────────────────────────────────────────────┤
│  👤 สวัสดี, [displayName]                   │
│  🔄 อัปเดตล่าสุด: [timestamp]             │
├─────────────────────────────────────────────┤
│  📊 KPI Cards                               │
│  ┌───────────────┐  ┌───────────────┐      │
│  │  Total        │  │  Closed       │      │
│  │  [count]      │  │  [count]      │      │
│  └───────────────┘  └───────────────┘      │
├─────────────────────────────────────────────┤
│  🎫 ปัญหาล่าสุดของฉัน                   │
│  ┌─────────────────────────────────────┐   │
│  │ 📌 [Subject]                        │   │
│  │ 📂 [Category] - [Sub Category]     │   │
│  │ 🏢 [Branch Name]                    │   │
│  │ 📅 [Created Date]                   │   │
│  │ 🏷️ [Status]                         │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [🔄 รีเฟรช]  [+ สร้างปัญหาใหม่]            │
└─────────────────────────────────────────────┘
```

---

## Status Colors

| Status | Color |
|--------|-------|
| pending | Yellow/Orange |
| assigned | Blue |
| closed | Green |
| unsent | Gray |
