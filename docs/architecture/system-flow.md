# System Flow

> Hub-and-spoke architecture connecting 7 n8n workflows for automated IT helpdesk ticketing.

---

## Overview

The system uses a hub-and-spoke pattern where **Auto Ticket** is the central hub receiving all LINE webhook events. It routes messages to specialized sub-workflows for AI classification, assignment, closure, and logging. A scheduled workflow runs daily to summarize pending tickets.

---

## Context Snapshot

- **Pattern**: Hub-and-spoke with webhook trigger at the center
- **Sub-workflow calls**: Auto Ticket calls CoreAI, Auto Assign, Auto Close, and LogSQLServer via n8n Execute Workflow nodes
- **Data persistence**: All ticket and log data stored in Microsoft SQL Server
- **Async delay**: Auto Assign waits 1 minute before looking up tickets (allows CoreAI to finish creating them)

---

## When to Read This

### Trigger

- Understanding how workflows connect and depend on each other
- Debugging why a message was or wasn't processed
- Adding a new workflow to the system
- Considering architectural changes

### Read With

- `docs/project/overview.md` [[docs/project/overview]] — workflow IDs and versions
- `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] — main hub workflow details

---

## System Flow Diagram

```
LINE Message → Auto Ticket (Webhook)
                      │
                      ├─► Unsend Event → Update status="unsent" → LogSQLServer
                      │
                      ├─► IT Staff Reply (with quote)
                      │       ├─► Auto Assign → wait 1 min → SQL UPDATE status="assigned"
                      │       └─► Auto Close Ticket
                      │              ├─► Contains "การแก้ไขปัญหา"?
                      │              │    YES → SQL UPDATE status="closed" + email #close
                      │              │    NO  → (handled by Auto Assign instead)
                      │              └─► LogSQLServer
                      │
                      └─► Ticket Pattern (contains "สาขา"/"แผนก" AND "ปัญหา")
                              └─► Auto Ticket CoreAI
                                     ├─► AI Classification (category, intent, branch, reporter)
                                     ├─► Find Branch (match to master list)
                                     ├─► Find Sub Category
                                     ├─► SQL INSERT ticket (status="pending")
                                     └─► LogSQLServer

Schedule (Daily 08:00 Asia/Bangkok)
 └─► Schedule Ticket Unclose
        └─► SQL SELECT assigned tickets → Email summary to IT lead
```

## Sub-Workflow Call Graph

```
Auto Ticket (hub)
 ├── Execute Workflow → Auto Ticket CoreAI
 ├── Execute Workflow → Auto Assign
 ├── Execute Workflow → Auto Close Ticket
 └── Execute Workflow → LogSQLServer (unsend path)

Auto Ticket CoreAI
 └── Execute Workflow → LogSQLServer (INSERT)

Auto Assign
 └── Execute Workflow → LogSQLServer (UPDATE)

Auto Close Ticket
 └── Execute Workflow → LogSQLServer (CLOSE)

Schedule Ticket Unclose
 (no sub-workflow calls — sends email directly)
```

## Event Routing Logic

The main Auto Ticket workflow routes events through these decision nodes:

1. **Switch node** — routes by LINE event type (memberJoined, sticker, unsend, memberLeft, default)
2. **If IT Group** — checks if message came from IT group (groupId = `YOUR_IT_GROUP_ID`)
3. **If not IT Team** — distinguishes IT staff from non-IT users
4. **If Ticket** — checks for ticket pattern: (`สาขา` OR `แผนก`) AND `ปัญหา`
5. **If Reply** — checks for quotedMessageId (indicates reply to existing message)
6. **If contains "การแก้ไขปัญหา"** — triggers auto-close

## How to Extend

To add a new workflow to the system:

1. Create the workflow in n8n editor
2. Add an Execute Workflow node in Auto Ticket at the appropriate routing point
3. Document the new workflow in `docs/features/`
4. Update this system flow diagram
5. Add a LogSQLServer call for audit trail consistency
6. Update `docs/project/overview.md` quick reference table

---

Related: `docs/features/audit-logging.md` [[docs/features/audit-logging]]
