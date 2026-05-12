# Audit Logging (LogSQLServer)

> Centralized audit logging sub-workflow called by all ticket-mutating workflows.

---

## Overview

LogSQLServer provides a single point of audit logging for all ticket operations. Every workflow that creates, updates, or modifies ticket state calls this sub-workflow to record the action in the `[log]` table.

---

## Context Snapshot

- **Workflow ID**: `q3ybqMcKYHUTu4qg`
- **Type**: Sub-Workflow (called by 4 other workflows)
- **Version**: v1.0.1
- **File**: `workflows/LogSQLServer.json` (5KB)

---

## When to Read This

### Trigger

- Adding audit logging to a new workflow
- Understanding what operations are logged
- Querying the audit trail for a specific ticket
- Debugging logging failures

### Read With

- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — log table schema
- `docs/reference/expressions.md` [[docs/reference/expressions]] — timestamp formatting

---

## Flow

1. **Start** — receives input parameters
2. **SELECT TOP (1)** — look up existing ticket by message_id (for context)
3. **Set Insert Log** — prepares log entry with all parameters
4. **INSERT** — writes log row to `[YourDatabase].[dbo].[log]`

## Input Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `table_name` | Table where action occurred | `[YourDatabase].[dbo].[ticket]` |
| `action_type` | Type of action | `INSERT`, `UPDATE`, `UNSEND`, `CLOSE`, `UNCLOSE` |
| `value` | Description of the change | "Ticket created with status pending" |
| `message_id` | Related ticket message ID | LINE message ID |
| `datetime` | Action timestamp | ISO formatted |
| `by` | User/system who performed action | "system" or IT staff name |

## Called By

| Caller Workflow | Action Types | When |
|-----------------|-------------|------|
| Auto Ticket | UNSEND | LINE message unsent event |
| Auto Ticket CoreAI | INSERT | New ticket created |
| Auto Assign | UPDATE | Ticket assigned to IT staff |
| Auto Close Ticket | CLOSE | Ticket closed with resolution |

## Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `binaryMode` | `separate` | Ensures binary data doesn't interfere with log processing |

## Decision Trace

- **Decision**: Centralized logging via sub-workflow instead of inline SQL in each workflow
- **Why**: Ensures consistent log format across all workflows. If the log schema changes, only LogSQLServer needs updating — not every caller.
- **Impact**: All callers must pass the same parameter structure. Adding new parameters requires updating the sub-workflow input schema.

---

Related: `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] | `docs/features/auto-assign.md` [[docs/features/auto-assign]] | `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]]
