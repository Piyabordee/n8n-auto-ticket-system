# Auto Ticket System — Documentation Index

> Navigation hub for all project documentation.
> Start here to find what you need.

---

## Quick Links

- `CLAUDE.md` — Project hub (AI reads this first)
- `README.md` — User-facing introduction and installation guide
- `SCREENSHOTS.md` — Workflow diagram index

---

## Project

| Doc | Description |
|-----|-------------|
| `docs/project/overview.md` [[docs/project/overview]] | Project identity, tech stack, quick reference table, ticket status lifecycle |

## Architecture

| Doc | Description |
|-----|-------------|
| `docs/architecture/system-flow.md` [[docs/architecture/system-flow]] | Hub-and-spoke pattern, sub-workflow call graph, event routing overview |
| `docs/architecture/data-model.md` [[docs/architecture/data-model]] | Database schema for ticket and log tables with column descriptions |

## Features

| Doc | Description |
|-----|-------------|
| `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] | Main webhook workflow — LINE event routing, ticket detection, media handling |
| `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] | AI classification — prompts, output schemas, category mapping, intent classification |
| `docs/features/auto-assign.md` [[docs/features/auto-assign]] | IT staff reply → ticket assignment with 1-minute wait |
| `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]] | Resolution detection → ticket closure with #close email commands |
| `docs/features/schedule-ticket-unclose.md` [[docs/features/schedule-ticket-unclose]] | Daily 08:00 pending ticket summary email to IT lead |
| `docs/features/audit-logging.md` [[docs/features/audit-logging]] | LogSQLServer centralized audit trail called by all workflows |

## Integrations

| Doc | Description |
|-----|-------------|
| `docs/integrations/line-messaging.md` [[docs/integrations/line-messaging]] | LINE Messaging API — endpoints, credentials, event types |
| `docs/integrations/external-services.md` [[docs/integrations/external-services]] | OpenRouter, Microsoft SQL Server, FTP, SMTP (DavMail) configuration |

## Reference

| Doc | Description |
|-----|-------------|
| `docs/reference/expressions.md` [[docs/reference/expressions]] | Key n8n expressions — text cleaning, extraction, timestamp formatting |
| `docs/reference/sanitization.md` [[docs/reference/sanitization]] | Sanitization pipeline — sanitize.py, .env config, replacements.txt |
| `docs/reference/modification-guide.md` [[docs/reference/modification-guide]] | How to modify workflows, disabled nodes, error handling notes |

## Standalone Guides

| Doc | Description |
|-----|-------------|
| `docs/GITHUB_PUBLISH_GUIDE.md` | Thai-language guide for publishing workflows to GitHub safely (local-only, pre-existing) |

## Build & Testing

This project has no build process or test framework. n8n workflows are imported directly via the n8n editor. See `README.md` for installation steps.

## External Resources

- [n8n Documentation](https://docs.n8n.io/)
- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [OpenRouter API](https://openrouter.ai/docs)

---

Related: `CLAUDE.md` | `README.md` | `decisions.md` [[decisions]]
