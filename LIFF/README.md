# IT Helpdesk LIFF App

A Next.js application for submitting IT helpdesk tickets via LINE Front-end Framework (LIFF).

## Features

- **Dashboard (`/`)**: View ticket statistics (Total, Closed) and recent tickets with auto-sync
- **Create Ticket (`/create`)**: Submit new IT helpdesk tickets
- LIFF SDK integration with mock data for local development
- Ticket creation form with category, sub-category, branch selection
- Image upload with preview and Base64 conversion
- TypeScript support
- Tailwind CSS styling
- shadcn/ui components

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- @line/liff
- mssql (SQL Server client)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory (see `.env.local.example`):
```env
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
SQL_SERVER=your_server
SQL_DATABASE=YourDatabase
SQL_USER=your_username
SQL_PASSWORD=your_password
```

3. Run the development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_LIFF_ID`: Your LIFF ID from LINE Developers Console
- `SQL_SERVER`: SQL Server hostname or IP
- `SQL_DATABASE`: Database name
- `SQL_USER`: SQL Server username
- `SQL_PASSWORD`: SQL Server password

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
│   │   ├── RefreshButton.tsx
│   │   ├── LiffProvider.tsx
│   │   ├── TicketForm.tsx
│   │   └── ui/           # shadcn/ui components
│   └── types/            # TypeScript type definitions
└── tests/                # Component tests
```

## API Payload

The form submits data in the following JSON format:

```json
{
  "source": "liff_app",
  "userId": "string",
  "displayName": "string",
  "intent": "SR or INC",
  "category": "string",
  "sub_category": "string",
  "branch_name": "string",
  "subject": "string",
  "problem_detail": "string",
  "image_base64": "string (optional)"
}
```