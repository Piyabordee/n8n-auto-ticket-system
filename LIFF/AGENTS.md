# IT Helpdesk LIFF App - Project Context

> **Version**: 1.1.0
> **Purpose**: Frontend web application using LINE Front-end Framework (LIFF) for submitting and tracking IT Helpdesk tickets, including image attachments.
> **Integration**: LIFF SDK + Next.js + n8n Webhook + Microsoft SQL Server

## 1. Tech Stack
* **Framework**: Next.js App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui (for fast, clean enterprise UI)
* **LINE SDK**: @line/liff

## 2. System Architecture
1. **Frontend (Next.js)**: Runs inside LINE App via LIFF. Handles UI/UX, authenticates user via `liff.init()`, gets `userId` and `displayName`, and converts image uploads to Base64.
2. **API/Middleware (n8n)**: Frontend sends POST request to existing n8n webhook (Auto_Ticket_1.7).
3. **Database**: Microsoft SQL Server `[Dev_Born].[dbo].[ticket]`.

## 3. Core Features to Build
* **Feature 1: LIFF Initialization Provider**: A global context that initializes LIFF and stores user profile data globally. Must support mock data for local development.
* **Feature 2: Dashboard Page (/)**: Shows KPI Cards (Total, Pending, Closed) and a list of user's recent tickets.
* **Feature 3: Create Ticket Form (/create)**: A form capturing Category, Sub-category, Branch, Problem details, and an Image Upload field with preview capability.

## 4. Integration Endpoints
* **Target Webhook (n8n)**: `POST https://n8n-dev.superrich1965.com/webhook/1904a57e-caaa-45e4-900b-4fd96c94f316`
* **Expected JSON Payload for New Ticket**:
```json
{
  "source": "liff_app",
  "userId": "string (from liff.getProfile)",
  "displayName": "string (from liff.getProfile)",
  "intent": "SR or INC",
  "category": "string",
  "sub_category": "string",
  "branch_name": "string",
  "subject": "string",
  "problem_detail": "string",
  "image_base64": "string (optional) - Base64 encoded string of the uploaded image"
}