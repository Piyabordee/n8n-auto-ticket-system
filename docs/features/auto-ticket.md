# Auto Ticket (Main Workflow)

> Main webhook entry point — receives LINE events and routes to sub-workflows.

---

## Overview

Auto Ticket is the central hub workflow. It receives all LINE webhook events, extracts sender information, routes by event type, and dispatches to specialized sub-workflows for ticket creation, assignment, and closure.

---

## Context Snapshot

- **Workflow ID**: `yjqa7NBnaFqtPjBd`
- **Type**: Webhook (POST)
- **Production URL**: `https://n8n-dev.example.com/webhook/YOUR_WEBHOOK_UUID`
- **Version**: 1.7.2
- **File**: `workflows/Auto Ticket.json` (46KB — largest workflow)

---

## When to Read This

### Trigger

- Debugging why a LINE message was or wasn't processed
- Adding a new event type handler
- Understanding the event routing logic
- Modifying the ticket detection pattern

### Read With

- `docs/architecture/system-flow.md` [[docs/architecture/system-flow]] — how this hub connects to other workflows
- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — the AI classification it calls

---

## Flow

1. **Webhook Line** receives LINE webhook POST
2. **SET - Extract Sender IDs** — extracts userId, groupId, quotedMessageId, message_id
3. **HTTP - Get Sender Profile** — fetches display name from LINE API (retry on fail, 5s)
4. **Get Group/Room Summary** — fetches group/room name
5. **Switch** — routes by event type:
   - `memberJoined` → Set (acknowledge)
   - `sticker` → Set (ignore)
   - `unsend` → Update SQL status="unsent" → LogSQLServer
   - `memberLeft` → Set (ignore)
   - **Default** → continues processing
6. **If image** → downloads media and uploads to FTP
7. **SET - Normalize Clean Text** — removes @all, emojis, colons, normalizes whitespace
8. **If IT Group** — checks if groupId = `YOUR_IT_GROUP_ID`
   - YES → routes directly to Auto Assign (bypasses ticket creation)
   - NO → continues to ticket detection
9. **If Ticket** — checks for pattern: (`สาขา` OR `แผนก`) AND `ปัญหา`
   - YES → calls Auto Ticket CoreAI
   - NO → no action
10. **If not IT Team + If Reply** → calls Auto Assign or Auto Close based on reply content

## Key Nodes

| Node | Purpose |
|------|---------|
| Webhook Line | Receives LINE webhook POST |
| SET - Extract Sender IDs | Extracts userId, groupId, quotedMessageId, message_id |
| HTTP - Get Sender Profile | Fetches display name from LINE API |
| Get Group/Room Summary | Fetches group/room display name |
| Switch | Routes by event type |
| If image → FTP | Downloads media, uploads to FTP server |
| SET - Normalize Clean Text | Cleans text, removes noise |
| If IT Group | Routes IT group messages directly to assignment |
| Get IT Team | Fetches IT staff profile by userId |
| If not IT Team | Distinguishes IT staff from other users |
| If Ticket | Pattern detection for ticket-worthy messages |

## Event Routing Table

| Branch | Condition | Handler |
|--------|-----------|---------|
| 0 | `events[0].type` = `memberJoined` | Set (memberJoined) |
| 1 | `events[0].message.type` = `sticker` | Set (sticker) |
| 2 | `events[0].type` = `unsend` | Update Unsend Status (SQL) → LogSQLServer |
| 3 | `events[0].type` = `memberLeft` | Set (memberLeft) |
| Default | Other events | If image → text processing pipeline |

## Ticket Detection Pattern

Messages are classified as tickets when they contain:

```
(contains "สาขา" OR "แผนก") AND contains "ปัญหา"
```

This captures branch/department problem reports in Thai. The pattern is checked after text cleaning.

## Decision Trace

- **Decision**: IT group messages bypass ticket creation and go directly to Auto Assign
- **Why**: IT staff replying in the IT group are responding to existing tickets, not creating new ones. Direct routing avoids false ticket creation.
- **Impact**: The `If IT Group` node uses groupId `YOUR_IT_GROUP_ID` — must be updated if the IT group changes.

---

Related: `docs/features/auto-assign.md` [[docs/features/auto-assign]] | `docs/reference/expressions.md` [[docs/reference/expressions]]
