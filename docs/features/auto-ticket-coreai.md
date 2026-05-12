# Auto Ticket CoreAI (AI Classification)

> AI-powered ticket classification using DeepSeek LLM via OpenRouter.

---

## Overview

CoreAI is the most complex sub-workflow (33KB). It receives cleaned message text from Auto Ticket, uses three AI model calls to classify the issue, and creates a ticket in SQL Server with structured metadata.

---

## Context Snapshot

- **Workflow ID**: `vnzG9J1ipCdgk5Q4`
- **Type**: Sub-Workflow (called by Auto Ticket)
- **Version**: 1.3.2
- **File**: `workflows/Auto Ticket CoreAI.json` (33KB)
- **AI Model**: `deepseek/deepseek-chat-v3.1` via OpenRouter (all three calls use the same model)

---

## When to Read This

### Trigger

- Modifying AI classification prompts
- Adding new categories or sub-categories
- Changing AI models
- Understanding how branch matching works
- Debugging misclassified tickets

### Read With

- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — ticket table schema
- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — OpenRouter configuration

---

## Flow

1. **Get Category** — fetches Category data table for AI context
2. **Get Branch Company** — fetches company branch master list
3. **Get Branch Franchise** — fetches franchise branch master list
4. **Core Agent** — AI classification call (retry on fail, 5s, 5 tries)
   - Inputs: clean text, category list
   - Outputs: branch_name, reporter_name, category, intent, subject_summary
5. **Set Branch** — merges Company and Franchise data for branch matching
6. **Find Branch** — AI call to match extracted branch name to master list
   - Determines `branch_company` (Company vs Franchise)
7. **Get Sub Category** — fetches sub-category data table
8. **Find Sub Category** — AI call to classify sub-category
9. **Set Command Ticket** — generates email commands: `#category`, `#sub_category`, `#branch`, `#type`
10. **Set Sub/Body** — builds email subject and body with:
    - `#set วันที่เปิด Ticket=<date>` (dd-MM-yyyy)
    - `#set เวลาเปิด Ticket=<time>` (HH:mm:ss)
    - `#set Type=<Incident|Service Request>` (based on intent)
11. **Microsoft SQL** — INSERT ticket row (status="pending")
12. **Call LogSQLServer** — audit log entry (action_type: INSERT)

## AI Output Schemas

### Core Agent

```json
{
  "branch_name": "string | null",
  "reporter_name": "string | null",
  "category": "SW|HW|NETWORK|CAMERA|PRINTER|RATE|POS|REQUEST",
  "intent": "INC | SR",
  "subject_summary": "string (max 60 chars)"
}
```

### Find Branch

```json
{
  "branch_name": "string",
  "company": "Branch Company | Branch Franchise"
}
```

### Find Sub Category

```json
{
  "sub_category": "string"
}
```

## Category Mapping

AI categories from Core Agent output are mapped to ticket categories:

| AI Category | Ticket Category |
|-------------|-----------------|
| SW, RATE, POS | Software |
| HW | Hardware |
| NETWORK | Network |
| CAMERA | Camera |
| PRINTER | Printer |
| REQUEST | Requested |

## Intent Classification

| Intent | Description | Ticket Type |
|--------|-------------|-------------|
| INC | Incident — broken/error issues | Incident |
| SR | Service Request — setup/request | Service Request |

## Data Tables Used

These n8n data tables provide context to the AI models:

| Table ID | Name | Purpose |
|----------|------|---------|
| `0gECxoX7q3C9vtSW` | Category | Master category list with aliases |
| `tbGFT0QvOZY36KR8` | Branch Company | Company branches |
| `tsXyKblM8cdLFvHE` | Branch Franchise | Franchise branches |
| `lctiSAoBPS8KFCI8` | Sub Category | Sub-category mappings |

## Decision Trace

- **Decision**: Use DeepSeek Chat v3.1 for all three AI calls instead of different models
- **Why**: Simpler configuration, consistent output quality, lower cost. Previous versions tested Groq but migrated for reliability.
- **Impact**: All AI calls use the same OpenRouter credential. If model quality degrades, all three calls are affected simultaneously.

- **Decision**: Find Branch uses a separate AI call instead of exact string matching
- **Why**: Branch names in messages are often misspelled or abbreviated. AI handles fuzzy matching better than string comparison against a 200+ branch list.
- **Impact**: Branch matching has a small error rate (~2-3%). The Find Branch node has `onError: continueRegularOutput` to handle failures gracefully.

---

Related: `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] | `docs/reference/modification-guide.md` [[docs/reference/modification-guide]]
