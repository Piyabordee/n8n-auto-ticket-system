# Auto Ticket System — Project Hub

> Central operational hub for AI agents working on this codebase.
> For full documentation index, see `docs/_index.md` [[docs/_index]].
> Stable/non-negotiable rules are stored in `.claude/rules/`.

---

## Identity

| Field | Value |
|-------|-------|
| Name | Auto Ticket System |
| Type | n8n workflow automation — IT Helpdesk Ticketing |
| Stack | n8n, LINE Messaging API, OpenRouter (DeepSeek), Microsoft SQL Server, FTP, SMTP (DavMail) |
| Version | 1.7.5 |
| Language | Thai (UI/messages), English (code/config) |

---

## Read First

- `.claude/rules/*` — Stable rules (security, project constraints, n8n workflow editing)
- `docs/_index.md` [[docs/_index]] — Full documentation map
- `docs/project/overview.md` [[docs/project/overview]] — Project identity and quick reference
- `README.md` — User-facing introduction and installation guide

---

## Task Routing

| Task | Read First |
|------|------------|
| Modifying a workflow | `docs/reference/modification-guide.md` |
| Adding new categories or branches | `docs/features/auto-ticket-coreai.md` + `docs/reference/modification-guide.md` |
| Changing AI prompts or models | `docs/features/auto-ticket-coreai.md` |
| Modifying SQL schema | `docs/architecture/data-model.md` |
| Publishing to GitHub | `docs/reference/sanitization.md` |
| Adding new integrations | `docs/integrations/external-services.md` |
| Changing email templates | `docs/features/auto-close-ticket.md` or `docs/features/schedule-ticket-unclose.md` |
| Debugging event routing | `docs/features/auto-ticket.md` + `docs/architecture/system-flow.md` |
| Creating manual tickets | `docs/features/manual-ticket.md` |

---

## Directory Tree (Authoritative)

```text
n8n-auto-ticket-system/
├── .claude/
│   ├── rules/                    # Stable rules (security, project, n8n workflow)
│   └── skills/                   # Claude Code skills (github-sanitize, doc-version-sync)
├── docs/
│   ├── _index.md                 # Documentation navigation hub
│   ├── project/                  # Project-level knowledge
│   ├── architecture/             # System structure and data model
│   ├── features/                 # Per-workflow documentation
│   ├── integrations/             # External service integration details
│   └── reference/                # Expressions, sanitization, modification guide
├── screenshots/                  # Workflow diagrams (PNG) + architecture (Mermaid)
├── workflows/                    # n8n workflow JSON exports (8 files)
├── SQL/                          # Analytics queries
├── CLAUDE.md                     # This file — project hub
├── README.md                     # Public-facing documentation
├── SCREENSHOTS.md                # Screenshot index
├── decisions.md                  # Design decisions log
├── create_tables.sql             # Database schema DDL
├── sanitize.py                   # Deterministic sanitizer for GitHub publishing
├── .env.sanitizer                # Real values for sanitization (NEVER commit)
└── .env.sanitizer.example        # Template for .env.sanitizer
```

---

## Quick Commands

```bash
# Dry-run sanitization (preview changes without writing)
python sanitize.py --dry-run

# Run sanitization (overwrite files with sanitized versions)
python sanitize.py

# Sync version references after workflow changes
# Use Claude Code skill: /doc-version-sync
```

---

## Working Rules

1. **Sanitize before committing** — run `sanitize.py` or `/github-sanitize` before any push to public GitHub
2. **Version sync after workflow changes** — run `/doc-version-sync` after modifying workflow JSON files
3. **All documentation in `docs/`** — project knowledge lives in the modular doc system under `docs/`
4. **Preserve the Wait node** — the 1-minute wait in Auto Assign prevents race conditions with ticket creation
5. **Test AI prompt changes** — always test Core Agent, Find Branch, Find Sub Category prompts with sample inputs before production deployment
6. **Keep credential IDs as-is** — credential IDs like `line api account 2` are n8n internal references, not secrets

---

## Documentation Map

### Project
- `docs/project/overview.md` [[docs/project/overview]] — Project identity, stack, quick reference, ticket status lifecycle

### Architecture
- `docs/architecture/system-flow.md` [[docs/architecture/system-flow]] — Hub-and-spoke pattern, sub-workflow call graph
- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — Database schema (ticket + log tables)

### Features
- `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] — Main webhook workflow (event routing, ticket detection)
- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — AI classification (prompts, schemas, categories)
- `docs/features/auto-assign.md` [[docs/features/auto-assign]] — IT staff reply → ticket assignment
- `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]] — Resolution detection → ticket closure
- `docs/features/schedule-ticket-unclose.md` [[docs/features/schedule-ticket-unclose]] — Daily 08:00 pending ticket summary
- `docs/features/audit-logging.md` [[docs/features/audit-logging]] — LogSQLServer centralized audit trail
- `docs/features/error-notify-telegram.md` [[docs/features/error-notify-telegram]] — Centralized error notification to Telegram
- `docs/features/manual-ticket.md` [[docs/features/manual-ticket]] — Manual ticket creation via form (AI-classified)

### Integrations
- `docs/integrations/line-messaging.md` [[docs/integrations/line-messaging]] — LINE Messaging API endpoints and config
- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — OpenRouter, SQL Server, FTP, SMTP

### Reference
- `docs/reference/expressions.md` [[docs/reference/expressions]] — Key n8n expressions used across workflows
- `docs/reference/sanitization.md` [[docs/reference/sanitization]] — Sanitization pipeline (sanitize.py, config files)
- `docs/reference/modification-guide.md` [[docs/reference/modification-guide]] — How to modify workflows, disabled nodes, error handling

---

## Key Warnings

- **Never commit `.env.sanitizer`** — contains real company data for replacement — see `docs/reference/sanitization.md`
- **Always sanitize workflow JSON before pushing** — pinData may contain real LINE message data — see `.claude/rules/security-rules.md`

---

## Doc Workflow

When creating or significantly modifying a feature:

1. **Feature doc** — create in `docs/features/` for new workflow behavior
2. **Architecture doc** — update `docs/architecture/` if system structure changes
3. **Reference doc** — update `docs/reference/` if expressions, config, or modification notes change
4. **Link here** — add entry to Documentation Map above
5. **Link related docs** — add wiki links in Related section of each doc

### Where to put docs

| Category | Path | When |
|----------|------|------|
| Feature workflow | `docs/features/` | New user-facing behavior or workflow changes |
| Architecture | `docs/architecture/` | Structural changes, schema changes |
| Integration | `docs/integrations/` | New external service or config changes |
| Reference | `docs/reference/` | New expressions, config options, modification notes |

---

## Definition of Done

- [ ] Change implemented with minimal scope
- [ ] Related docs updated in `docs/`
- [ ] Sanitization verified before push (`sanitize.py --dry-run`)
- [ ] Version sync completed after workflow changes (`/doc-version-sync`)
- [ ] Commit is scoped to one issue/change set
- [ ] `decisions.md` updated for lasting design choices
- [ ] CLAUDE.md updated to match current project state

---

## Session Closeout

At the end of each work session:

1. Update `CLAUDE.md` according to the current project state
2. Update `decisions.md` with new stable decisions
3. Re-check Documentation Map and links

---

## Related Files

- `README.md` — User-facing introduction
- `.claude/rules/` — Stable rules
- `decisions.md` [[decisions]] — Design decisions log
