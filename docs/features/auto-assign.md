# Auto Assign

> Assigns pending tickets to IT staff when they reply to the original message.

---

## Overview

When an IT staff member replies to a ticket message in the LINE group, Auto Assign matches the reply to the original ticket and updates the ticket status from `pending` to `assigned` with the IT staff's name and timestamp.

---

## Context Snapshot

- **Workflow ID**: `4tIlVjstYxU09G6a`
- **Type**: Sub-Workflow (called by Auto Ticket)
- **Version**: 1.2.1
- **File**: `workflows/Auto Assign.json` (14KB)

---

## When to Read This

### Trigger

- Debugging why a ticket wasn't assigned
- Modifying the assignment logic or wait time
- Understanding the race condition between ticket creation and assignment

### Read With

- `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] — the hub that triggers this workflow
- `docs/features/audit-logging.md` [[docs/features/audit-logging]] — how the assignment is logged

---

## Flow

1. Receives `quotedMessageId`, `userId`, and message data from Auto Ticket
2. **Wait 1 minute** — allows CoreAI to finish creating the ticket before querying
3. **Lookup ticket** — SQL SELECT by quotedMessageId WHERE status="pending"
4. **Match IT Team** — lookup IT staff profile by userId
5. **Update SQL** — UPDATE ticket SET status="assigned", assigned_to, assigned_date
6. **Call LogSQLServer** — audit log entry (action_type: UPDATE)

## Key Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Wait duration | 1 minute | Prevents race condition with CoreAI ticket creation |
| SQL lookup condition | status="pending" | Only assigns unclaimed tickets |
| IT Team lookup | by userId from IT_Team data table | Only recognized IT staff can be assigned |

## Decision Trace

- **Decision**: Wait 1 minute before looking up the ticket
- **Why**: CoreAI may still be processing the original message when the IT staff replies immediately. The wait ensures the ticket row exists in SQL before the assignment query runs.
- **Impact**: Assignment has a minimum 1-minute latency. Do not reduce this timeout without confirming CoreAI's maximum processing time.

- **Decision**: Email sending is disabled (node exists but is disabled)
- **Why**: Assignment notifications were found to be redundant — IT staff see the assignment in the LINE group context. The email node is preserved for potential re-enabling.
- **Impact**: No email is sent on assignment. If email notification is needed, enable the `Send email To DavMail` node.

---

Related: `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]]
