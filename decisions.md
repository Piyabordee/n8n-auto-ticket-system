# Design Decisions

> Persistent record of key design decisions, tradeoffs, and their rationale.
> Updated when lasting design choices are made.

---

## System Architecture

### Hub-and-spoke workflow pattern
- **Decision**: Use Auto Ticket as the central hub, calling specialized sub-workflows
- **Why**: Separates concerns — each workflow handles one responsibility (classification, assignment, closure, logging). Easier to modify independently.
- **Impact**: Adding new behavior requires modifying Auto Ticket's routing logic plus creating/updating a sub-workflow.

### Centralized audit logging via LogSQLServer sub-workflow
- **Decision**: All ticket mutations call LogSQLServer instead of logging inline
- **Why**: Consistent log format, single point of change if schema evolves
- **Impact**: All callers must pass the same parameter structure (table_name, action_type, value, message_id, datetime, by)

## Data & Storage

### Migration from Google Sheets to SQL Server (v1.7, 2026-02-04)
- **Decision**: Moved all data storage from Google Sheets to Microsoft SQL Server
- **Why**: Google Sheets had concurrency issues, row limits, and unreliable API performance. SQL Server provides ACID transactions, proper indexing, and reliable analytics queries.
- **Impact**: All data access nodes in workflows changed from Google Sheets nodes to Microsoft SQL nodes. The `create_tables.sql` file was created for schema management.

### DeepSeek Chat v3.1 via OpenRouter for all AI calls
- **Decision**: Use a single LLM model for all three AI classification calls (Core Agent, Find Branch, Find Sub Category)
- **Why**: Previously tested Groq (faster but less reliable) and considered multiple models. DeepSeek v3.1 provides consistent quality at reasonable cost. Using one model simplifies configuration.
- **Impact**: All AI calls use the same OpenRouter credential. Model degradation affects all classification simultaneously.

### AI-based branch matching instead of exact string matching
- **Decision**: Use an LLM call to match branch names from messages to the master list
- **Why**: Branch names in user messages are often misspelled, abbreviated, or use informal names. AI handles fuzzy matching better than exact comparison against a 200+ branch list.
- **Impact**: ~2-3% error rate on branch matching. The Find Branch node uses `onError: continueRegularOutput` to handle failures gracefully.

## Workflow Design

### 1-minute wait in Auto Assign
- **Decision**: Wait 1 minute before looking up the ticket by quotedMessageId
- **Why**: When IT staff reply immediately to a message, CoreAI may still be processing the original ticket creation. The wait ensures the SQL row exists before the assignment query.
- **Impact**: Minimum 1-minute latency for all ticket assignments. Do not reduce without confirming CoreAI's maximum processing time.

### Disabled email sending in Auto Assign
- **Decision**: Email notification on assignment is disabled (node preserved but disabled)
- **Why**: Assignment notifications were redundant — IT staff see the assignment context in the LINE group. The email node is preserved for potential re-enabling.
- **Impact**: No email on assignment. Close emails still work normally.

### Summary email replaced individual "Unclose" updates (v1.3)
- **Decision**: Changed Schedule Ticket Unclose from individually updating tickets to "Unclose" status to sending a single summary email to the IT lead
- **Why**: Individual status updates were disruptive and created noise. A daily digest is more actionable for the IT lead to plan their day.
- **Impact**: The "Unclose" status is now legacy. New tickets follow pending → assigned → closed flow.

### Schedule time changed from 18:00 to 08:00
- **Decision**: Daily summary moved from evening to morning
- **Why**: Morning reports are more actionable — the IT lead can plan the day around outstanding tickets
- **Impact**: Tickets assigned after 08:00 don't appear until the next day's summary

## Security & Publishing

### Deterministic sanitization pipeline (sanitize.py)
- **Decision**: Use a Python script with literal/regex replacement instead of AI-based sanitization
- **Why**: AI sanitization can miss patterns or over-sanitize. Deterministic replacement guarantees 100% coverage with no false negatives.
- **Impact**: New sensitive data patterns must be manually added to `.env.sanitizer` or `replacements.txt`.

### Disabled nodes preserved instead of deleted
- **Decision**: Keep disabled nodes in workflows as documentation of system evolution
- **Why**: Shows migration history and provides reference for re-enabling features
- **Impact**: Workflow JSON files are larger, but clarity outweighs size cost

## Documentation

### Migration from monolithic AGENTS.md to modular docs/ (v1.7.5, 2026-05-12)
- **Decision**: Split the 484-line AGENTS.md into focused per-topic docs under `docs/`
- **Why**: AGENTS.md was loaded in full on every AI agent session via `@AGENTS.md`, wasting context tokens. Modular docs allow agents to load only relevant information per task.
- **Impact**: AGENTS.md is deprecated. New documentation goes to `docs/`. CLAUDE.md serves as the navigation hub.
