# Modification Guide

> How to modify workflows, disabled nodes reference, and error handling configuration.

---

## Overview

This guide covers the common modification patterns for the Auto Ticket System, documents disabled nodes and why they're disabled, and lists error handling configurations across workflows.

---

## Context Snapshot

- Workflows are modified via the n8n editor and re-exported to `workflows/`
- After modification, run `/doc-version-sync` to update version references
- After modification, run `sanitize.py` before pushing to GitHub

---

## When to Read This

### Trigger

- Adding new categories, branches, or sub-categories
- Modifying event routing or ticket detection logic
- Re-enabling disabled nodes
- Understanding error handling and retry behavior
- Making any changes to workflow nodes

### Read With

- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — AI classification modifications
- `docs/reference/sanitization.md` [[docs/reference/sanitization]] — post-modification sanitization

---

## Common Modifications

### Adding New Categories

1. Update the `Category` data table in n8n (ID: `0gECxoX7q3C9vtSW`)
2. Update `Set Command Ticket` node in Auto Ticket CoreAI — add mapping to the category mapping table
3. Update the AI prompt in `Core Agent` to include the new category in its instructions
4. Run `/doc-version-sync` after committing

### Adding New Branches

1. Update `Branch Company` (ID: `tbGFT0QvOZY36KR8`) or `Branch Franchise` (ID: `tsXyKblM8cdLFvHE`) data tables
2. No workflow changes needed — the AI reads branch lists dynamically from data tables
3. Verify branch matching works by testing with a sample message

### Modifying AI Prompts

1. Edit the `messages` parameter in the target node:
   - `Core Agent` — classification, intent, branch extraction
   - `Find Branch` — branch name matching
   - `Find Sub Category` — sub-category classification
2. **Always test** with real sample inputs before deploying to production
3. The Core Agent node has retry configured (5 tries, 5s delay)

### Changing Email Recipients

- Auto Close Ticket: modify `toEmail` in `Send email To DavMail` node
- Schedule Ticket Unclose: modify `toEmail` in `Send email To Lead IT Support` node

### Changing Schedule Time

- Schedule Ticket Unclose: modify the `Schedule Trigger` node (currently 08:00 Asia/Bangkok)

### Adjusting Wait Time

- Auto Assign: modify the `Wait` node (currently 1 minute)

### Modifying IT Group Routing

- Auto Ticket: modify `If IT Group` node to change which groupId routes directly to Auto Assign

### Database Schema Changes

1. Update `create_tables.sql` with the new schema
2. Update SQL queries in affected n8n workflow nodes
3. Update `docs/architecture/data-model.md` with new column descriptions

## Disabled Nodes

### Auto Ticket

| Node | Reason Disabled |
|------|----------------|
| Wait (unsend path) | Direct SQL update used instead — no wait needed |
| Google Sheets nodes | Replaced by SQL Server migration (v1.7) |
| Core Agent1, Find Sub Category1, Groq Chat Model1 | Replaced by Auto Ticket CoreAI sub-workflow |
| Send email To Zimbra1 | Replaced by DavMail SMTP |
| Embeddings, Vector Store nodes | Not in use |
| Webhook Line1/2 | Alternative endpoints (not active) |
| Supabase webhook logging | Removed — logging now via LogSQLServer |

### Auto Assign

| Node | Reason Disabled |
|------|----------------|
| Send email To DavMail | Email sending disabled — assignment notification via LINE context is sufficient |

### Schedule Ticket Unclose

| Node | Reason Disabled |
|------|----------------|
| Loop Over Items | Old v1.2 method — replaced by single summary email |
| Match IT Team | Old v1.2 method — replaced by single summary email |
| Send email To DavMail | Old v1.2 method — replaced by single summary email |
| Update Ticket Status | Old v1.2 method — replaced by single summary email |
| Call LogSQLServer v1.0.0 | Old v1.2 method — replaced by single summary email |

## Error Handling

| Workflow | Node | Setting |
|----------|------|---------|
| Auto Ticket | HTTP - Get Sender Profile | retryOnFail: true (5000ms) |
| Auto Ticket CoreAI | Core Agent | retryOnFail: true (5000ms, 5 tries) |
| Auto Ticket CoreAI | Find Branch | onError: continueRegularOutput |
| Auto Assign | Update Ticket Status (SQL) | retryOnFail: true (3000ms, 5 tries) |
| Auto Close Ticket | Send email To DavMail | retryOnFail: true (5000ms, 5 tries) |
| Auto Ticket | Call Auto Assign | retryOnFail: true (5000ms, 5 tries) |
| Auto Ticket | Call Auto Close | retryOnFail: true (5000ms, 5 tries) |

## Decision Trace

- **Decision**: Keep disabled nodes in workflows instead of deleting them
- **Why**: Disabled nodes document the evolution of the system and provide a reference for re-enabling features if needed. They also make the migration history visible in the workflow editor.
- **Impact**: Workflow JSON files are larger than necessary, but the clarity benefit outweighs the size cost.

---

Related: `docs/architecture/data-model.md` [[docs/architecture/data-model]]
