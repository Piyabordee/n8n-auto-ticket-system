# Project Overview

> Auto Ticket System — AI-powered IT Helpdesk automation via n8n workflows.

---

## Overview

The Auto Ticket System automates IT helpdesk ticketing for a retail company with branch locations across Thailand. It processes LINE group messages from branch staff, classifies issues using AI (DeepSeek via OpenRouter), creates tickets in Microsoft SQL Server, and manages the full ticket lifecycle: creation, assignment, closure, and audit logging.

---

## Context Snapshot

- **Scope**: 7 n8n workflows handling LINE message ingestion, AI classification, ticket assignment/closure, daily summaries, and audit logging
- **Users**: Branch staff (report via LINE groups), IT staff (respond in IT group), IT lead (receives daily summary)
- **Language**: Thai for user-facing messages and email templates; English for code and configuration
- **Boundaries**: No web UI — the system operates entirely through LINE messaging and email

---

## When to Read This

### Trigger

- Starting a new session on this project
- Need to understand what the system does at a high level
- Looking up a workflow ID or version number

### Read With

- `docs/architecture/system-flow.md` [[docs/architecture/system-flow]] — how workflows connect
- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — database schema

---

## Quick Reference

| Workflow | ID | Type | Purpose |
|----------|-----|------|---------|
| Auto Ticket 1.7.2 | `yjqa7NBnaFqtPjBd` | Webhook | Main entry — processes LINE messages |
| Auto Ticket CoreAI 1.3.2 | `vnzG9J1ipCdgk5Q4` | Sub-Workflow | AI classification & ticket creation |
| Auto Assign 1.2.1 | `4tIlVjstYxU09G6a` | Sub-Workflow | IT reply → assign ticket |
| Auto Close Ticket 1.2.1 | `USgdNP1aNHh1QJg3` | Sub-Workflow | IT reply with "การแก้ไขปัญหา" → close |
| Schedule Ticket Unclose 1.4.1 | `UBCa3WsUnv88uG-4Syw6l` | Schedule | Daily 08:00 — send pending summary |
| LogSQLServer v1.0.1 | `q3ybqMcKYHUTu4qg` | Sub-Workflow | Centralized audit logging |

## Ticket Status Lifecycle

```
pending ──[IT Reply]──► assigned ──[Contains "การแก้ไขปัญหา"]──► closed
   │
   └──[Unsend]──► unsent

Note: Schedule (08:00) sends summary email of assigned tickets to IT lead (no status change)
```

| Status | Meaning | Transitions to |
|--------|---------|----------------|
| `pending` | Ticket created, awaiting IT response | `assigned`, `unsent` |
| `assigned` | IT staff claimed the ticket | `closed` |
| `closed` | Issue resolved with cause and resolution | terminal |
| `unsent` | Original LINE message was unsent/deleted | terminal |
| `Unclose` | Legacy status (no longer used in current version) | — |

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Workflow Engine | n8n | Orchestrates all automation |
| Messaging | LINE Messaging API | Receives branch reports, fetches profiles |
| AI/LLM | OpenRouter (deepseek/deepseek-chat-v3.1) | Classifies tickets, extracts metadata |
| Database | Microsoft SQL Server | Stores tickets and audit logs |
| Email | SMTP via DavMail | Sends ticket emails and daily summaries |
| Media | FTP Server | Uploads images/files from LINE messages |
| Sanitization | Python 3 | Deterministic credential removal for public GitHub |

---

Related: `README.md`
