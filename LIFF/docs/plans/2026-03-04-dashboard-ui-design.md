# IT Helpdesk Dashboard UI Design

> **Date**: 2026-03-04
> **Author**: Claude
> **Status**: Approved

## Overview

Create a dashboard UI matching the provided reference image for the IT Helpdesk system. The dashboard displays ticket statistics, charts, and a data table with filtering capabilities.

![Reference UI](https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/44892a6f-f966-4d93-b943-57903d3eed0e/07c314ded08834579ede89771dd8ad9d.jpg)

## Requirements

### Functional Requirements

1. **Dashboard Page** - Single page displaying:
   - Yellow header with system title and filters
   - 3 KPI cards (Equipment count, Task count, Tools count)
   - 4 charts (2 Bar charts, 2 Pie charts)
   - Data table with pagination

2. **Filters**
   - Status dropdown (all, pending, assigned, closed)
   - Department/Project dropdown (Branch SPR, Branch Franchise, all)
   - Date picker with Year/Quarter/Month selection

3. **API Endpoints**
   - `GET /api/dashboard/stats` - Statistics
   - `GET /api/dashboard/charts` - Chart data
   - `GET /api/dashboard/tickets` - Paginated tickets

### Data Source

- Database: SQL Server `Dev_Born.dbo.ticket`
- All metrics calculated from ticket table

## Architecture

### File Structure

```
LIFF/
├── app/
│   ├── page.tsx                    # Dashboard (Client Component)
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/
│   │   └── dashboard/
│   │       ├── stats/route.ts
│   │       ├── charts/route.ts
│   │       └── tickets/route.ts
│   └── components/
│       ├── dashboard/
│       │   ├── Header.tsx
│       │   ├── KPICards.tsx
│       │   ├── BarChartSection.tsx
│       │   ├── PieChartSection.tsx
│       │   ├── DataTable.tsx
│       │   └── DateFilter.tsx
│       └── ui/
│           └── Calendar.tsx
└── package.json                    # Add recharts, date-fns
```

### API Specifications

#### GET /api/dashboard/stats

Returns dashboard statistics.

```sql
-- Equipment count (HW, PRINTER, CAMERA, NETWORK)
SELECT COUNT(*) as equipmentCount
FROM [Dev_Born].[dbo].[ticket]
WHERE category IN ('HW', 'PRINTER', 'CAMERA', 'NETWORK')

-- Task count (INC intent)
SELECT COUNT(*) as taskCount
FROM [Dev_Born].[dbo].[ticket]
WHERE intent = 'INC'

-- Tools count (SR intent)
SELECT COUNT(*) as toolsCount
FROM [Dev_Born].[dbo].[ticket]
WHERE intent = 'SR'
```

Response:
```json
{
  "equipmentCount": 632,
  "taskCount": 603,
  "toolsCount": 29
}
```

#### GET /api/dashboard/charts

Returns data for charts.

Query params:
- `startDate` - ISO date string
- `endDate` - ISO date string
- `status` - optional filter
- `branchCompany` - optional filter

```sql
-- By category
SELECT category, COUNT(*) as value
FROM [Dev_Born].[dbo].[ticket]
WHERE created_date >= @startDate
GROUP BY category

-- By type (intent)
SELECT intent, COUNT(*) as value
FROM [Dev_Born].[dbo].[ticket]
WHERE created_date >= @startDate
GROUP BY intent
```

Response:
```json
{
  "byCategory": [
    {"name": "เครื่องคอมพิวเตอร์", "value": 281},
    {"name": "เครื่องภาพ", "value": 109},
    {"name": "เครื่องเสียง", "value": 45},
    {"name": "เครื่องโทรศัพท์", "value": 87},
    {"name": "อื่นๆ", "value": 110}
  ],
  "byType": [
    {"name": "เครื่องคอมพิวเตอร์/Case", "value": 118},
    {"name": "โทรทัศน์ [Television]", "value": 73},
    {"name": "ไมโครโฟน [Microphone]", "value": 45},
    {"name": "เครือข่าย [Internet]", "value": 67},
    {"name": "ซอฟต์แวร์ [Software]", "value": 300}
  ]
}
```

#### GET /api/dashboard/tickets

Returns paginated ticket list.

Query params:
- `page` - page number (default 1)
- `pageSize` - items per page (default 100)
- `status` - optional filter
- `branchCompany` - optional filter
- `startDate` - optional
- `endDate` - optional

```sql
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
ORDER BY created_date DESC
OFFSET @offset ROWS
FETCH NEXT @pageSize ROWS ONLY
```

Response:
```json
{
  "items": [...],
  "total": 611,
  "page": 1,
  "pageSize": 100
}
```

## Component Specifications

### Header.tsx

Yellow header (#FBBF24) with:
- Logo image
- System title: "ระบบบริหารจัดการอุปกรณ์ และบริการซ่อมสอบอุปกรณ์ IT"
- 3 filter dropdowns

### KPICards.tsx

3 metric cards:
- Equipment (black bg, white text)
- Tasks (dark gray bg, white text)
- Tools (blue bg, white text)

### BarChartSection.tsx

Two bar charts using Recharts:
- Equipment by type
- Tasks by type

Green bars with Thai labels.

### PieChartSection.tsx

Two pie charts:
- Equipment distribution
- Task distribution

Multi-colored with legends.

### DataTable.tsx

Table columns:
1. ลำดับ (No)
2. วันที่ (Date)
3. ชื่อ (Name/fromuser)
4. แผนก/หน่วยงาน (branch_name)
5. ประเภทอุปกรณ์ (category)

Pagination: "1 - 100 ของ 611"

### DateFilter.tsx

Custom calendar popup showing:
- 2 months side by side
- Year/Quarter/Month selector
- Cancel button

## Dependencies

Install packages:
```bash
npm install recharts date-fns
```

Update `tailwind.config.js`:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'header-yellow': '#FBBF24',
        'chart-green': '#22c55e',
      }
    }
  }
}
```

## Category Mapping

```typescript
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
};
```

## Implementation Notes

1. Use `'use client'` for main page.tsx (Recharts requires client-side)
2. API routes remain server-side for SQL queries
3. Format dates using `date-fns` with Thai locale
4. Handle loading states for each data fetch
5. Error handling for SQL connection failures

## Next Steps

1. Create implementation plan using `writing-plans` skill
2. Implement API routes
3. Create dashboard components
4. Integrate Recharts
5. Style with Tailwind to match reference UI
6. Test with real data
