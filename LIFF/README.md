# IT Helpdesk LIFF App

A Next.js application for submitting IT helpdesk tickets via LINE Front-end Framework (LIFF).

## Features

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

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
```

3. Run the development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_LIFF_ID`: Your LIFF ID from LINE Developers Console

## Project Structure

```
LIFF/
├── app/                    # Next.js App Router pages
│   ├── create/            # Ticket creation page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── CategorySelect.tsx # Category dropdown
│   ├── BranchSelect.tsx   # Branch dropdown
│   ├── ImageUpload.tsx    # Image upload with preview
│   ├── LiffProvider.tsx   # LIFF SDK initialization
│   ├── TicketForm.tsx     # Main ticket form
│   └── ui/               # shadcn/ui components
├── types/                # TypeScript type definitions
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