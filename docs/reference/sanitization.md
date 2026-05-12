# Sanitization Pipeline

> Deterministic credential and data removal system for safe GitHub publishing.

---

## Overview

The sanitization pipeline removes all sensitive data (company names, URLs, emails, tokens, database names, system IDs) from workflow JSON files and documentation before pushing to public GitHub. It uses a Python script with string replacement and regex — no AI involved.

---

## Context Snapshot

- **Tool**: `sanitize.py` (Python 3, deterministic)
- **Config**: `.env.sanitizer` (real values) and `.env.sanitizer.example` (template)
- **Replacements**: `replacements.txt` (literal and regex patterns)
- **Principle**: 100% deterministic — no AI, no ambiguity, no missed patterns

---

## When to Read This

### Trigger

- Publishing updates to public GitHub
- Adding new sensitive data patterns to sanitize
- Understanding what gets removed and what stays
- Debugging sanitization failures

### Read With

- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — credential IDs that are preserved
- `.claude/rules/security-rules.md` — security rules around sanitization

---

## What Gets Sanitized

| Category | Example Real → Sanitized | Method |
|----------|-------------------------|--------|
| LINE Bearer Tokens | `Bearer F+i6R8Z...` → `Bearer YOUR_LINE_CHANNEL_ACCESS_TOKEN` | literal |
| Company names | `[Company Name]` → `[Company Name]` | literal |
| Email addresses | `helpdesk.t@example.co.th` → `helpdesk@example.com` | literal |
| Domains | `n8n-dev.example.com` → `n8n-dev.example.com` | literal |
| Instance IDs | `c0ee9619...` → `YOUR_INSTANCE_ID` | literal |
| Webhook UUIDs | `1904a57e-...` → `YOUR_WEBHOOK_UUID` | literal |
| Group IDs | `C487cf71...` → `YOUR_IT_GROUP_ID` | literal |
| Database names | `YourDatabase` → `YourDatabase` | literal |
| pinData | `{...real data...}` → `{}` | regex |
| instanceId | `real-id` → `YOUR_INSTANCE_ID` | regex |

## What Gets Preserved

| Category | Why It's Safe |
|----------|--------------|
| Credential IDs (e.g., `line api account 2`) | These are n8n internal references, not secrets |
| Workflow node names | Not sensitive |
| AI prompt text | Not sensitive (general instructions) |
| Data table IDs | Not sensitive (internal n8n references) |

## Configuration Files

### .env.sanitizer

Contains `SANITIZE_XXX` keys with real values to find and `PLACEHOLDER_XXX` keys with replacement values. Format:

```
SANITIZE_DB_NAME=ProductionDB
PLACEHOLDER_DB_NAME=YourDatabase
```

### replacements.txt

Contains explicit replacement rules, one per line. Format:

```
literal:REAL_VALUE=>PLACEHOLDER
regex:PATTERN=>REPLACEMENT
```

Rules are applied longest-first to prevent partial matches.

## Usage

```bash
# Preview changes without writing
python sanitize.py --dry-run

# Apply sanitization (overwrites files)
python sanitize.py
```

## Verification Workflow

1. Run `sanitize.py --dry-run` and review output
2. Run `sanitize.py` to apply changes
3. Grep search for remaining sensitive patterns (use `/github-sanitize` skill)
4. If clean, commit and push

## Gotchas

- **Replacement order matters** — longer/more-specific patterns are applied first to prevent partial matches (e.g., company domain before company name)
- **pinData is a regex target** — the script clears all pinData objects in workflow JSON, not just specific values
- **replacements.txt contains real tokens** — this file should never be pushed to public GitHub with real values

---

Related: `docs/reference/modification-guide.md` [[docs/reference/modification-guide]]
