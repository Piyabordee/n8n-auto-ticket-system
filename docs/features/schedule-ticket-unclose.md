# Schedule Ticket Unclose

> Daily scheduled email summarizing pending (assigned but unclosed) tickets for the IT lead.

---

## Overview

Runs daily at 08:00 (Asia/Bangkok) to query all tickets with status="assigned" and send a summary email to the IT lead. This replaced the previous v1.2 method that individually updated tickets to "Unclose" status.

---

## Context Snapshot

- **Workflow ID**: `UBCa3WsUnv88uG-4Syw6l`
- **Type**: Schedule Trigger (Cron)
- **Version**: 1.4.1
- **File**: `workflows/Schedule Ticket Unclose.json` (12KB)
- **Schedule**: Daily at 08:00 Asia/Bangkok

---

## When to Read This

### Trigger

- Changing the schedule time or frequency
- Modifying the summary email template
- Understanding what happens to long-standing assigned tickets
- Debugging why the daily email wasn't sent

### Read With

- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — ticket table schema
- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — SMTP (DavMail) configuration

---

## Flow

1. **Schedule Trigger** — fires daily at 08:00 (Asia/Bangkok)
2. **Get tickets** — SQL SELECT tickets WHERE status="assigned"
3. **If notEmpty** — check if there are any assigned tickets
4. **Get Pending Tickets 2** — fetch detailed ticket data for the summary
5. **Aggregate** — combine ticket data (assigned_to, message_id, subject, clean_text, branch_name, branch_company, created_date, created_by)
6. **Send email To Lead IT Support** — summary email to `IT_Support@example.com` with:
   - Total count of pending tickets
   - Each ticket's: subject, branch, reporter, assigned IT staff, created date, problem detail

## Summary Email Content

The email includes for each pending ticket:

| Field | Description |
|-------|-------------|
| subject | Ticket subject line |
| branch_name + branch_company | Branch location |
| created_by / fromuser | Original reporter |
| assigned_to | IT staff assigned |
| created_date | When ticket was created |
| clean_text | Problem description |

## Disabled Nodes (Legacy v1.2)

The previous method that individually updated tickets is preserved but disabled:

| Node | Purpose |
|------|---------|
| Loop Over Items | Iterate over each assigned ticket |
| Match IT Team | Lookup IT staff for each ticket |
| Send email To DavMail | Send individual close reminder emails |
| Update Ticket Status | Update status to "Unclose" |
| Call LogSQLServer v1.0.0 | Log the status change |

## Decision Trace

- **Decision**: Changed from individual "Unclose" updates to a single summary email
- **Why**: The previous approach of changing status to "Unclose" and sending individual emails was disruptive — it modified ticket state and created noise. A daily digest is more useful for the IT lead.
- **Impact**: The "Unclose" status is now legacy. New tickets only use pending → assigned → closed flow. The old nodes are preserved for reference.

- **Decision**: Schedule changed from 18:00 to 08:00
- **Why**: Morning reports are more actionable — the IT lead can plan the day around outstanding tickets.
- **Impact**: Tickets that get assigned after 08:00 won't appear until the next day's summary.

---

Related: `docs/features/auto-assign.md` [[docs/features/auto-assign]]
