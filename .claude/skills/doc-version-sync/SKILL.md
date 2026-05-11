---
name: doc-version-sync
description: Use this skill whenever the user wants to sync documentation version numbers with workflow JSON files after git commits. Trigger on phrases like "update docs", "check version sync", "update AGENTS.md", "update README.md", "sync docs with workflows", or when documentation versions don't match workflow files. This skill ensures all documentation files reflect the correct workflow versions and maintains consistency across the codebase.
---

# Documentation Version Sync Skill

This skill helps synchronize documentation version numbers with actual workflow JSON files after making git commits. It ensures all references are consistent across the entire codebase.

## When to Use

- After committing workflow changes that modify version numbers
- When documentation shows outdated version numbers
- When user says "update docs", "check versions", "sync documentation"
- Before pushing changes to remote repository

## Workflow

### Step 1: Check Current State

1. **Check git history** for recent commits that modified workflow files:
   ```bash
   git log --oneline -5 -- "workflows/*.json"
   ```

2. **Extract version numbers** from workflow JSON files:
   - Search for `"name": "Workflow Name X.Y.Z"` pattern
   - List all workflows and their current versions

3. **Compare with documentation** to identify discrepancies:
   - Check AGENTS.md Quick Reference table
   - Check README.md Workflow Overview section
   - Check README.md changelog entries
   - Check SCREENSHOTS.md if it exists

### Step 2: Update Documentation Files

**Priority order for updates:**

1. **AGENTS.md**
   - Update version header at the top
   - Update Quick Reference table with correct workflow versions
   - Update workflow section titles (e.g., "Auto Ticket CoreAI 1.3")
   - Update version history table with new entries
   - Update any inline version references in flow descriptions

2. **README.md**
   - Update badge version (n8n-1.7.X)
   - Update System Architecture diagram version labels
   - Update Workflows Overview section titles
   - Update workflow file reference table versions
   - Add/update changelog entries

3. **SCREENSHOTS.md** (if exists)
   - Update "Last Updated" date
   - Add new screenshot entries if needed
   - Update workflow file references
   - Update architecture diagram details

### Step 3: Changelog Entry Format

For each version update, add an entry following this format:

```markdown
### v1.7.5 (2026-05-06)
- ✨ **New:** [Feature description]
- 🔧 **Enhanced:** [Improvement description]
- 📝 **Updated:** [Documentation change]
- 🧹 **Cleanup:** [Cleanup description]
```

**Use these prefixes consistently:**
- `✨ **New:**` - New features or workflow additions
- `🔧 **Enhanced:**` - Improvements to existing functionality
- `📝 **Updated:**` - Documentation or configuration changes
- `🧹 **Cleanup:**` - Code or resource cleanup
- `🐛 **Fixed:**` - Bug fixes

### Step 4: Verify Consistency

After making changes, verify:

1. **All version numbers match** across:
   - Workflow JSON files
   - AGENTS.md Quick Reference table
   - README.md Workflow Overview
   - Any inline references

2. **Date consistency**:
   - Version header date
   - Changelog entry date
   - SCREENSHOTS.md "Last Updated" date

3. **Git status**:
   ```bash
   git diff --stat
   ```
   Review changes before committing

## Common Patterns

### Version Bump Pattern

When a single workflow version changes, update:
1. The workflow's section title
2. The Quick Reference table entry
3. Any inline references to that workflow
4. Add changelog entry explaining the change

### Multiple Workflows Pattern

When multiple workflows change versions (e.g., after refactoring):
1. Update all workflow section titles
2. Update all Quick Reference entries
3. Update architecture diagram labels
4. Add comprehensive changelog entry listing all changes

### Adding New Workflow

When adding a new workflow:
1. Add to Quick Reference table
2. Add new workflow section with details
3. Add to Workflows Overview in README.md
4. Add screenshot entry if applicable
5. Update architecture diagram if needed

## Example Reference Updates

**Before:**
```markdown
| Workflow | ID | Type | Purpose |
|----------|-----|------|---------|
| **Auto Ticket CoreAI 1.3** | `vnzG9J1ipCdgk5Q4` | Sub-Workflow | AI classification |
```

**After:**
```markdown
| Workflow | ID | Type | Purpose |
|----------|-----|------|---------|
| **Auto Ticket CoreAI 1.3.2** | `vnzG9J1ipCdgk5Q4` | Sub-Workflow | AI classification |
```

## Troubleshooting

**Problem:** Version in git log shows different number than JSON file

**Solution:** Check if the commit modified the version. Look at the actual diff:
```bash
git show <commit>:workflows/Workflow.json | head -5
```

**Problem:** Can't find where a version is referenced

**Solution:** Use grep to search for old version number:
```bash
grep -r "1.7.3" --include="*.md"
```

**Problem:** Changelog has conflicting dates

**Solution:** Verify dates match commit dates:
```bash
git log --format="%ad %s" -1 -- "workflows/Workflow.json"
```
