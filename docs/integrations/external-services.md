# External Services

> Configuration details for OpenRouter LLM, Microsoft SQL Server, FTP, and SMTP (DavMail) integrations.

---

## Overview

The ticket system integrates with four external services beyond LINE. Each has its own credential configuration in n8n and is used by specific workflows.

---

## Context Snapshot

- All credentials are stored in n8n's credential manager — only credential IDs appear in workflow JSON
- Credential IDs are sanitized for public GitHub (e.g., `YOUR_SQL_CREDENTIAL_ID`)
- No actual secrets are present in exported workflow JSON files

---

## When to Read This

### Trigger

- Adding or changing an external service integration
- Debugging connectivity issues with SQL, FTP, or email
- Understanding which credential ID maps to which service
- Migrating to new service providers

### Read With

- `docs/reference/sanitization.md` [[docs/reference/sanitization]] — how credential IDs are sanitized
- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — OpenRouter usage details

---

## Service Configuration

### OpenRouter LLM

| Property | Value |
|----------|-------|
| Credential ID | `YOUR_OPENROUTER_CREDENTIAL_ID` |
| Model | `deepseek/deepseek-chat-v3.1` |
| Used by | Auto Ticket CoreAI (3 AI nodes) |
| Purpose | Classify tickets, match branches, classify sub-categories |

### Microsoft SQL Server

| Property | Value |
|----------|-------|
| Credential ID | `YOUR_SQL_CREDENTIAL_ID` |
| Database | `[YourDatabase]` |
| Tables | `[ticket]`, `[log]` |
| Used by | Auto Ticket, Auto Ticket CoreAI, Auto Assign, Auto Close Ticket, Schedule Ticket Unclose, LogSQLServer |
| Purpose | All ticket data persistence and audit logging |

### FTP Server

| Property | Value |
|----------|-------|
| Credential ID | `YOUR_FTP_CREDENTIAL_ID` |
| Upload path | `ftp/` |
| Used by | Auto Ticket (image handling path) |
| Purpose | Store media files (images) from LINE messages |

### SMTP (DavMail)

| Property | Value |
|----------|-------|
| Credential ID | `YOUR_EMAIL_CREDENTIAL_ID` |
| From addresses | `helpdesk@example.com`, `IT_Support@example.com` |
| Used by | Auto Close Ticket, Schedule Ticket Unclose |
| Purpose | Send close emails with #close commands, daily summary emails |

## Credential Reference

All credential IDs used across workflows (sanitized):

| Credential ID | Service | Workflows |
|---------------|---------|-----------|
| `YOUR_LINE_CREDENTIAL_ID` | LINE Messaging API | Auto Ticket |
| `YOUR_OPENROUTER_CREDENTIAL_ID` | OpenRouter | Auto Ticket CoreAI |
| `YOUR_SQL_CREDENTIAL_ID` | SQL Server | All workflows with SQL nodes |
| `YOUR_FTP_CREDENTIAL_ID` | FTP Server | Auto Ticket |
| `YOUR_EMAIL_CREDENTIAL_ID` | SMTP (DavMail) | Auto Close Ticket, Schedule Ticket Unclose |

## Gotchas

- **DavMail SMTP requires specific email format** — the `#set`, `#assign`, and `#close` commands must be in the email body (not subject) for Spiceworks to process them.
- **SQL Server timezone** — timestamps are stored in UTC. The workflows add +7 hours for Asia/Bangkok display.
- **OpenRouter rate limits** — the Core Agent node retries up to 5 times with 5s delay. If OpenRouter is down, ticket creation will fail after retries exhaust.
- **FTP upload is synchronous** — if the FTP server is slow, the entire message processing pipeline is blocked for that message.

---

Related: `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]]
