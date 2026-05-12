---
name: doc-version-sync
description: This skill should be used when documentation version numbers need to be synchronized with workflow JSON files. Triggers include: update docs, check version sync, sync docs with workflows, update docs/, update README.md, update SCREENSHOTS.md, check versions, sync documentation, อัพเดทเอกสาร, sync เวอร์ชัน, เช็คเวอร์ชัน, อัพเดท docs, สรุปการเปลี่ยนแปลง, or when the user asks to verify version consistency between workflow files and documentation after commits.
---

# Documentation Version Sync Skill

This skill helps synchronize documentation version numbers with actual workflow JSON files after making git commits. It ensures all references are consistent across the entire codebase.

## When to Use

- After committing workflow changes that modify version numbers
- When documentation shows outdated version numbers
- When user says "update docs", "check versions", "sync documentation"
- Before pushing changes to remote repository

## Known Files

### Workflow JSON files (versions are in top-level `"name"` field)
| File | Current Name Pattern |
|------|---------------------|
| `workflows/Auto Ticket.json` | Auto Ticket X.Y.Z |
| `workflows/Auto Ticket CoreAI.json` | Auto Ticket CoreAI X.Y.Z |
| `workflows/Auto Assign.json` | Auto Assign X.Y.Z |
| `workflows/Auto Close Ticket.json` | Auto Close Ticket X.Y.Z |
| `workflows/Schedule Ticket Unclose.json` | Schedule Ticket Unclose X.Y.Z |
| `workflows/LogSQLServer.json` | LogSQLServer vX.Y.Z |
| `workflows/Schedule Auto Open Ticket Unclose.json` | Schedule Auto Open Ticket Unclose vX.Y |

### Documentation files to sync
| File | Key areas to check |
|------|-------------------|
| `docs/project/overview.md` | Quick Reference table (workflow IDs and versions) |
| `docs/features/*.md` | Workflow version in Context Snapshot section |
| `README.md` | Badge version, Mermaid diagram labels (~6 hardcoded versions), Workflow Overview, changelog |
| `SCREENSHOTS.md` | Last Updated date, screenshot entries, workflow references |

## Workflow

### Step 1: Check Current State

1. **Check git history** for recent commits that modified workflow files:
   ```bash
   git log --oneline -5 -- "workflows/*.json"
   ```

2. **Extract version numbers** from workflow JSON files:
   - Read the top-level `"name"` field (typically line 2) of each JSON file in `workflows/`
   - List all workflows and their current versions

3. **Detect undocumented workflows**:
   - Compare files in `workflows/` against all references in docs/ and README.md
   - Report any JSON files that are not mentioned in any documentation
   - Report any documentation entries that reference workflow files that don't exist

4. **Compare with documentation** to identify discrepancies:
   - Check docs/project/overview.md Quick Reference table
   - Check README.md Workflow Overview section and Mermaid diagram labels
   - Check README.md changelog entries
   - Check SCREENSHOTS.md if it exists

### Step 2: Update Documentation Files

**Priority order for updates:**

1. **docs/project/overview.md**
   - Update Quick Reference table with correct workflow versions

2. **docs/features/*.md**
   - Update version in Context Snapshot section of each affected workflow doc

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
   - docs/project/overview.md Quick Reference table
   - docs/features/*.md Context Snapshot sections
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
