---
name: github-sanitize
description: Sanitize n8n workflows and documentation before publishing to GitHub
---

# GitHub Publish Sanitization

Use this skill before pushing n8n workflows to public GitHub to remove sensitive data.

## What This Does

This skill automates the sanitization process using the existing `sanitize.py` script:

1. **Dry-run check** - Shows what will be changed without modifying files
2. **User confirmation** - Asks before applying changes
3. **Sanitization** - Replaces sensitive data with placeholders
4. **Verification** - Confirms no sensitive data remains
5. **Next steps** - Guidance for git commit & push

## Prerequisites

Ensure `.env.sanitizer` exists and is configured with your real sensitive data:

```bash
cp .env.sanitizer.example .env.sanitizer
# Edit .env.sanitizer with your real values
```

## Step-by-Step Execution

### 1. Dry Run (Preview Changes)

```bash
python sanitize.py --dry-run
```

This shows what will be changed. Review the output carefully.

### 2. Confirm & Sanitize

If dry-run looks good, run the actual sanitization:

```bash
python sanitize.py
```

The script will:
- Clear `pinData` fields in workflow JSON files
- Replace database names, URLs, emails, company names
- Update markdown documentation
- Verify results

### 3. Verify No Sensitive Data Remains

The script automatically runs verification. You can also run:

```bash
python sanitize.py --verify-only
```

### 4. Check Git Status

```bash
git status
```

Review which files were modified.

### 5. Commit & Push

```bash
git add .
git commit -m "docs: update workflows and sanitization"
git push origin main
```

## What Gets Sanitized

Based on your `.env.sanitizer` configuration:
- **Database names** → `YourDatabase`
- **Table names** → `YourTable`
- **URLs** → `example.com`
- **Emails** → `user@example.com`
- **Company names** → `[Company Name]` or `YourName`
- **Credential IDs** → `YOUR_CREDENTIAL_ID`

## What's Preserved

- **Node names** - n8n workflow structure
- **Node types** - workflow functionality
- **Connection IDs** - workflow node links
- **Instance IDs** - but replaced with `YOUR_INSTANCE_ID`
- **Empty pinData** - `{}` objects remain

## Files Processed

- `workflows/*.json` - n8n workflow files
- `*.md` - documentation files (README, AGENTS, etc.)

## Troubleshooting

**Q: Dry-run shows no changes but I know there's sensitive data?**
A: Ensure `.env.sanitizer` has the `SANITIZE_` entries for your real data.

**Q: Verification still finds sensitive data?**
A: Add new entries to `.env.sanitizer` with `SANITIZE_` and `PLACEHOLDER_` pairs.

**Q: Pin data keeps reappearing after n8n export?**
A: Clear pinData manually in n8n editor before exporting, or run this script again.

## Reference Documentation

For detailed step-by-step guide, see: `docs/GITHUB_PUBLISH_GUIDE.md`
