# Screenshots

n8n workflow screenshots and architecture diagrams for the Auto Ticket System.

> **Last Updated**: 2026-02-09
> **System Version**: 1.7.1

## Available Screenshots

### Workflow Diagrams

| Screenshot | Workflow | Version | Description |
|------------|----------|---------|-------------|
| ![main-workflow](main-workflow.png) | Auto Ticket 1.7 | 1.7 | Main workflow - LINE webhook processing |
| ![ai-classification](ai-classification.png) | Auto Ticket CoreAI 1.3 | 1.3 | AI classification sub-workflow |
| ![auto-assign](auto-assign.png) | Auto Assign 1.2 | 1.2 | IT staff reply assignment sub-workflow |
| ![schedule](schedule.png) | Schedule Ticket Unassign 1.2 | 1.2 | Scheduled unassigned ticket processing |
| ![logsqlserver](log-sql-server.png) | LogSQLServer v1.0.1 | 1.0.1 | Centralized audit logging workflow |

### Architecture Diagram

| Screenshot | Source | Description |
|------------|--------|-------------|
| ![architecture](architecture.png) | [architecture.mermaid](architecture.mermaid) | Complete system architecture with all workflows and integrations |

## Workflow File References

| Screenshot | Workflow File | Version | Status |
|------------|---------------|---------|--------|
| `main-workflow.png` | [workflows/Auto Ticket.json](../workflows/Auto%20Ticket.json) | 1.7 | ✅ Active |
| `coreai-workflow.png` | [workflows/Auto Ticket CoreAI.json](../workflows/Auto%20Ticket%20CoreAI.json) | 1.3 | ✅ Active |
| `auto-assign.png` | [workflows/Auto Assign.json](../workflows/Auto%20Assign.json) | 1.2 | ✅ Active |
| `schedule-unassign.png` | [workflows/Schedule Ticket Unassign.json](../workflows/Schedule%20Ticket%20Unassign.json) | 1.2 | ✅ Active |
| `logsqlserver.png` | [workflows/LogSQLServer.json](../workflows/LogSQLServer.json) | 1.0.1 | ✅ Active |

## How to Export Screenshots from n8n

### Method 1: Browser Screenshot
1. Open the workflow in n8n editor
2. Zoom out to see the full workflow (Ctrl + Scroll or Ctrl + -)
3. Use browser screenshot tool:
   - **Chrome**: Right-click → Inspect → Ctrl+Shift+P → "Capture full size screenshot"
   - **Firefox**: Right-click → Take Screenshot
4. Save as PNG with descriptive filename

### Method 2: Using Mermaid (for architecture)
1. Edit [architecture.mermaid](architecture.mermaid)
2. Go to https://mermaid.live
3. Paste the Mermaid code
4. Click "Download PNG"

## Architecture Diagram Details

The [architecture.png](architecture.png) shows:

- **LINE Messaging API** - Webhook source
- **Auto Ticket 1.7** - Main workflow handling all events
- **Auto Ticket CoreAI 1.3** - AI classification with OpenRouter
- **Auto Assign 1.2** - IT staff reply assignment
- **Schedule Ticket Unassign 1.2** - Daily unassigned ticket processing
- **LogSQLServer v1.0.1** - Centralized audit logging
- **Microsoft SQL Server** - Ticket and Log storage
- **External Services** - FTP, DavMail SMTP, OpenRouter LLM

### Color Legend
- 🔵 **Blue** - Main workflow nodes
- 🟣 **Purple** - Sub-workflow nodes
- 🟠 **Orange** - Database nodes
- 🟢 **Green** - External services
- 🩷 **Pink** - LINE API nodes

## Current Workflows

For detailed workflow documentation, see [AGENTS.md](../AGENTS.md)

## Changelog

### 2026-02-09
- ✅ Created architecture.mermaid with black text color
- ✅ Rendered architecture.png from Mermaid source
- ✅ Updated all workflow versions to current state
