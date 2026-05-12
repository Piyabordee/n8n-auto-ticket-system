# Auto Close Ticket

> Closes assigned tickets when IT staff replies with resolution details containing "การแก้ไขปัญหา".

---

## Overview

When an IT staff member replies with a message containing "การแก้ไขปัญหา" (resolution/solution), this workflow extracts the cause and reason, computes resolution time, sends a close email to the helpdesk, and updates the ticket status to `closed`.

---

## Context Snapshot

- **Workflow ID**: `USgdNP1aNHh1QJg3`
- **Type**: Sub-Workflow (called by Auto Ticket)
- **Version**: 1.2.1
- **File**: `workflows/Auto Close Ticket.json` (11KB)

---

## When to Read This

### Trigger

- Debugging why a ticket wasn't closed
- Modifying the close detection pattern
- Changing the close email template or commands
- Understanding how cause and reason are extracted

### Read With

- `docs/features/auto-assign.md` [[docs/features/auto-assign]] — the assignment that precedes closure
- `docs/reference/expressions.md` [[docs/reference/expressions]] — close data extraction regex patterns
- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — SMTP (DavMail) configuration

---

## Flow

1. Receives `clean_text`, `quotedMessageId`, `userId` from Auto Ticket
2. **If contains "การแก้ไขปัญหา"** — check if the reply includes resolution text
3. **Lookup ticket** — SQL SELECT by quotedMessageId WHERE status="assigned"
4. **Match IT Team** — lookup IT staff profile by userId
5. **Send email** with commands:
   - Original email body
   - `#set วันที่ปิด Ticket=<date>` (dd-MM-yyyy)
   - `#set เวลาปิด Ticket=<time>` (HH:mm:ss)
   - `#assign <email>`
   - `#set สาเหตุ=<cause>`
   - `#set การแก้ไขปัญหา=<reason>`
   - `#close`
6. **Update SQL** — UPDATE ticket SET status="closed", close_cause, close_reason, close_time_minute
7. **Call LogSQLServer** — audit log entry (action_type: CLOSE)

## Close Data Extraction

Cause and reason are extracted from the IT staff's reply using regex:

```
close_cause:   (?:อาการ|ปัญหาอาการ)[\s=:]*([\s\S]*?)(?=\s*การแก้ไขปัญหา)
close_reason:  การแก้ไขปัญหา[\s=:]*([\s\S]*?)(?=\s*@|$)
close_time:    DATEDIFF(minute, assigned_date, GETDATE())
```

## Email Commands

The close email uses Spiceworks-style commands:

| Command | Purpose |
|---------|---------|
| `#set วันที่ปิด Ticket=<date>` | Set close date (dd-MM-yyyy) |
| `#set เวลาปิด Ticket=<time>` | Set close time (HH:mm:ss) |
| `#assign <email>` | Assign to helpdesk agent |
| `#set สาเหตุ=<cause>` | Set problem symptom |
| `#set การแก้ไขปัญหา=<reason>` | Set resolution description |
| `#close` | Close the ticket |

## Decision Trace

- **Decision**: Close detection uses the string "การแก้ไขปัญหา" in the reply
- **Why**: This phrase (meaning "solution/resolution") is a natural part of IT staff's workflow when describing how they resolved an issue. It's unambiguous in Thai IT context.
- **Impact**: Only replies containing this exact phrase trigger auto-close. Partial matches or synonyms do not close tickets.

---

Related: `docs/features/audit-logging.md` [[docs/features/audit-logging]]
