# Auto_Ticket_1.7 - n8n Workflow Context Documentation

> **Version**: 1.7.2 | **Date**: 2026-02-16
> **Purpose**: Automated IT Helpdesk Ticketing System with Auto-Assignment, Auto-Close & Audit Logging
> **Integration**: LINE Messaging API + AI Classification + Microsoft SQL Server

---

## Quick Reference

| Workflow | ID | Type | Purpose |
|----------|-----|------|---------|
| **Auto Ticket 1.7** | `yjqa7NBnaFqtPjBd` | Webhook | Main entry - processes LINE messages |
| **Auto Ticket CoreAI 1.3** | `vnzG9J1ipCdgk5Q4` | Sub-Workflow | AI classification & ticket creation |
| **Auto Assign 1.2** | `4tIlVjstYxU09G6a` | Sub-Workflow | IT reply → assign ticket |
| **Auto Close Ticket 1.0** | `USgdNP1aNHh1QJg3` | Sub-Workflow | IT reply with "การแก้ไขปัญหา" → close |
| **Schedule Ticket Unclose 1.2** | `UBCa3WsUnv88uG-4Syw6l` | Schedule | Daily 18:00 - reopen unassigned |
| **LogSQLServer v1.0.1** | `q3ybqMcKYHUTu4qg` | Sub-Workflow | Centralized audit logging |

---

## System Flow

```
LINE Message → Auto Ticket 1.7
                      │
                      ├─► Unsend Event → Update status="unsent" → Log
                      ├─► IT Staff Reply → Auto Assign 1.2 → Auto Close Ticket 1.0
                      └─► Ticket Pattern → Auto Ticket CoreAI 1.3 → Create ticket (status="pending")

Schedule (18:00) → Schedule Ticket Unclose 1.2 → assigned → Unclose → Log

All operations → LogSQLServer v1.0.1 → Audit Log
```

---

## Ticket Status Flow

```
pending ──[IT Reply]──► assigned ──[Contains "การแก้ไขปัญหา"]──► closed
   │                         │
   └──[Unsend]──► unsent     └──[18:00 Schedule]──► Unclose
```

---

## Main Workflow: Auto Ticket 1.7

### Trigger
| Property | Value |
|----------|-------|
| Type | Webhook (POST) |
| Path | `/1904a57e-caaa-45e4-900b-4fd96c94f316` |
| Production URL | `https://n8n-dev.example.com/webhook/1904a57e-caaa-45e4-900b-4fd96c94f316` |

### Key Nodes

| Node | Purpose |
|------|---------|
| `Webhook Line` | Receives LINE webhook |
| `SET - Extract Sender IDs` | Extract userId, groupId, quotedMessageId, message_id |
| `HTTP - Get Sender Profile` | Fetch display name from LINE API |
| `Get Group/Room Summary` | Fetch group/room name |
| `Switch` | Routes by event type (memberJoined, sticker, unsend, memberLeft, Default) |
| `If image` → `FTP` | Downloads & uploads media |
| `SET - Normalize Clean Text` | Cleans text, removes @all, emojis |
| `Get IT Team` | Fetch IT staff by userId |
| `If not IT Team` | Routes IT staff to Auto Assign, others to ticket check |
| `If Ticket` | Checks for pattern: (`สาขา` OR `แผนก`) AND `ปัญหา` |
| `Update Unsend Status (SQL)` | Sets status="unsent" for unsend events |
| `Call Auto Ticket CoreAI` | Calls AI classification |
| `Call Auto Assign` | Calls assignment handler |
| `Call Auto Close Ticket` | Calls close handler |

### Switch Event Routing
| Branch | Condition | Handler |
|--------|-----------|---------|
| 0 | `events[0].type` = `memberJoined` | `Set (memberJoined)` |
| 1 | `events[0].message.type` = `sticker` | `Set (sticker)` |
| 2 | `events[0].type` = `unsend` | `Update Unsend Status (SQL)` → Call LogSQLServer |
| 3 | `events[0].type` = `memberLeft` | `Set (memberLeft)` |
| Default | Other events | `If image` node |

---

## Sub-Workflow: Auto Assign 1.2

### Purpose
Handles IT staff replies to assign pending tickets.

### Flow
1. Receives quotedMessageId, userId, message data
2. **Wait 1 minute** (allows ticket creation to complete)
3. Lookup ticket by quotedMessageId where status="pending"
4. Match IT Team profile
5. **Email: DISABLED** (node exists but disabled)
6. Update SQL: status="assigned", assigned_to, assigned_date
7. Call LogSQLServer

---

## Sub-Workflow: Auto Close Ticket 1.0

### Purpose
Closes assigned tickets when IT staff replies with "การแก้ไขปัญหา".

### Flow
1. Receives clean_text, quotedMessageId, userId
2. **If** contains "การแก้ไขปัญหา"
3. Lookup ticket by quotedMessageId where status="assigned"
4. Match IT Team profile
5. **Send email** with commands:
   - Original email body
   - `#assign <email>`
   - `#set สาเหตุ=<cause>`
   - `#set การแก้ไขปัญหา=<reason>`
   - `#close`
6. Update SQL: status="closed", close_cause, close_reason, close_time_minute
7. Call LogSQLServer

### Close Data Extraction
```javascript
// close_cause
(?:อาการ|ปัญหาอาการ)[\s=:]*([\s\S]*?)(?=\s*การแก้ไขปัญหา)

// close_reason
การแก้ไขปัญหา[\s=:]*([\s\S]*?)(?=\s*@|$)

// close_time_minute: DATEDIFF(minute, assigned_date, GETDATE())
```

---

## Sub-Workflow: Auto Ticket CoreAI 1.3

### Purpose
AI classification using OpenRouter LLM + ticket creation.

### AI Models (OpenRouter)
| Node | Model | Purpose |
|------|-------|---------|
| Core Agent | deepseek/deepseek-chat-v3.1 | Classify category, intent, extract branch, reporter |
| Find Branch | deepseek/deepseek-chat-v3.1 | Match branch to master list |
| Find Sub Category | deepseek/deepseek-chat-v3.1 | Classify sub-category |

### AI Output Schemas
```json
// Core Agent
{
  "branch_name": "string | null",
  "reporter_name": "string | null",
  "category": "SW|HW|NETWORK|CAMERA|PRINTER|RATE|POS|REQUEST",
  "intent": "INC | SR",
  "subject_summary": "string (max 60 chars)"
}

// Find Branch
{
  "branch_name": "string",
  "company": "Branch Company | Branch Franchise"
}

// Find Sub Category
{
  "sub_category": "string"
}
```

### Category Mapping
| AI Category | Ticket Category |
|-------------|-----------------|
| SW, RATE, POS | Software |
| HW | Hardware |
| NETWORK | Network |
| CAMERA | Camera |
| PRINTER | Printer |
| REQUEST | Requested |

### Intent Classification
| Intent | Description |
|--------|-------------|
| INC | Incident - broken/error issues |
| SR | Service Request - setup/request |

### Data Tables Used
| Table ID | Name | Purpose |
|----------|------|---------|
| 0gECxoX7q3C9vtSW | Category | Master category list with aliases |
| tbGFT0QvOZY36KR8 | Branch Company | Company branches |
| tsXyKblM8cdLFvHE | Branch Franchise | Franchise branches |
| lctiSAoBPS8KFCI8 | Sub Category | Sub-category mappings |
| qxjykIZZNaErzW0k | IT_Team | IT staff members (for Auto-Assign) |

### Flow
1. Get Category, Branch Company, Branch Franchise data
2. **Core Agent** → AI classification
3. **Set Branch** (Company/Franchise merge)
4. **Find Branch** → Match to master list
5. **Get Sub Category** + **Find Sub Category**
6. **Set Command Ticket** → Generate #category, #sub_category, #branch
7. **Set Sub/Body** → Build email subject/body
8. **Microsoft SQL** → INSERT ticket (status="pending")
9. Call LogSQLServer

---

## Schedule Workflow: Schedule Ticket Unclose 1.2

| Property | Value |
|----------|-------|
| Trigger | Daily at 18:00 (Asia/Bangkok) |
| Purpose | Reopen assigned tickets that weren't closed |

### Flow
1. Get tickets where status="assigned"
2. **Loop Over Items** (batch size: 1)
3. Send email (no assignment commands)
4. Update SQL: status="Unclose"
5. Call LogSQLServer

---

## Audit Logging: LogSQLServer v1.0.1

### Purpose
Centralized audit logging for all ticket operations.

### Flow
```
Start → SELECT TOP (1) by message_id → Set Insert Log → INSERT into [log] table
```

### Input Parameters
| Parameter | Description |
|-----------|-------------|
| table_name | e.g., "[YourDatabase].[dbo].[ticket]" |
| action_type | INSERT, UPDATE, UNSEND, CLOSE, UNCLOSE |
| value | Description of change |
| message_id | Ticket message ID |
| datetime | Action timestamp |
| by | User/system who performed action |

### Called By
- Auto Ticket 1.7 (unsend events)
- Auto Ticket CoreAI 1.3 (INSERT)
- Auto Assign 1.2 (UPDATE to assigned)
- Auto Close Ticket 1.0 (UPDATE to closed)
- Schedule Ticket Unclose 1.2 (UPDATE to Unclose)

---

## Database Schema

### Table: [YourDatabase].[dbo].[ticket]

| Column | Type | Description |
|--------|------|-------------|
| message_id | VARCHAR | PK - LINE message ID |
| status | VARCHAR | pending, assigned, closed, Unclose, unsent |
| assigned_to | VARCHAR | IT staff name |
| assigned_date | DATETIME | Assignment timestamp |
| intent | VARCHAR | INC/SR |
| category | VARCHAR | Main category |
| sub_category | VARCHAR | Sub-category |
| branch_name | VARCHAR | Branch name |
| branch_company | VARCHAR | Company/Franchise |
| subject | VARCHAR | Email subject |
| clean_text, raw_text | NVARCHAR | Message text |
| email_body | NVARCHAR | Email content |
| chatname | VARCHAR | Group/Room name |
| fromuser | VARCHAR | Sender display name |
| userid | VARCHAR | LINE user ID |
| groupid | VARCHAR | LINE group ID |
| **close_cause** | NVARCHAR | Problem symptom |
| **close_reason** | NVARCHAR | Resolution |
| **close_time_minute** | INT | Minutes from assigned to closed |
| created_date, updated_date | DATETIME | Timestamps |
| created_by, updated_by | VARCHAR | Audit fields |

### Table: [YourDatabase].[dbo].[log]

| Column | Type | Description |
|--------|------|-------------|
| table_name | VARCHAR | Table where action occurred |
| table_row_id | VARCHAR | Affected row ID |
| action_type | VARCHAR | INSERT, UPDATE, UNSEND, CLOSE, UNCLOSE |
| value | NVARCHAR | Change description |
| created_date | DATETIME | Log timestamp |
| created_by | VARCHAR | User/system |
| message_id | VARCHAR | Related ticket ID |

---

## External Integrations

### LINE Messaging API
| Credential ID | taEN43RaPXagQMcX |
|---------------|------------------|
| **Endpoints** | |
| `GET /v2/bot/profile/{userId}` | User profile |
| `GET /v2/bot/group/{groupId}/member/{userId}` | Group member profile |
| `GET /v2/bot/group/{groupId}/summary` | Group summary |
| `GET /v2/bot/message/{messageId}/content` | Download media |

### Other Services
| Service | Credential ID | Usage |
|---------|---------------|-------|
| OpenRouter LLM | NEbQVn9EuXOOfFxh | deepseek/deepseek-chat-v3.1 |
| FTP Server | snp3QvieyhjBYtWH | Upload media to ftp/ |
| SMTP (DavMail) | o2kgNvpcg8y3t93j | helpdesk@example.com |
| Microsoft SQL Server | DlMjRKIkdeMbyUDh | YourDatabase |

---

## Key Expressions

### Text Cleaning
```javascript
// Remove @all, emojis, colons, normalize whitespace
text.replace(/@all/ig, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/:/g, "")
    .replace(/\s+/g, " ")
    .trim()
```

### Extract Reporter Name
```javascript
// From "ผู้แจ้ง : Name" pattern
text.match(/ผู้แจ้ง\s*[:]?\s*(.*?)(\n|$)/)?.[1].trim() || "ไม่ได้ระบุ"
```

### Extract Problem Description
```javascript
// Extract text after "ปัญหา"
text.match(/ปัญหา\s*\s*([\s\S]*)/)?.[1].trim()
```

### Check for Reply
```javascript
$('SET - Extract Sender IDs').item.json.quotedMessageId !== ""
```

### Check for Close Pattern
```javascript
clean_text.includes("การแก้ไขปัญหา")
```

### Timestamp Formatting
```javascript
// Format timestamp to ISO string
DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:mm:ss.SSS')
```

### Check for Unsend Event
```javascript
// Get unsend messageId
$('Webhook Line').item.json.body.events[0].unsend.messageId
```

### Email Body with Close
```javascript
// Send email with #close command
emailBody + "\n#assign " + email_spiceworks + "\n#set สาเหตุ=" + cause + "\n#set การแก้ไขปัญหา=" + reason + "\n#close"
```

---

## Error Handling

| Node | Setting |
|------|---------|
| HTTP - Get Sender Profile | retryOnFail: true (5000ms) |
| Core Agent | retryOnFail: true (5000ms, 5 tries) |
| Find Branch | onError: continueRegularOutput |
| Update Ticket Status (Auto Assign) | retryOnFail: true (3000ms, 5 tries) |
| Send email To DavMail (Auto Close) | retryOnFail: true (5000ms, 5 tries) |
| Call Auto Assign / Auto Close | retryOnFail: true (5000ms, 5 tries) |

---

## Disabled Nodes

### Auto Ticket 1.7
| Node | Reason |
|------|--------|
| Wait (unsend path) | Direct SQL update used instead |
| Google Sheets nodes | Replaced by SQL Server |
| Core Agent1, Find Sub Category1, Groq Chat Model1 | Replaced by sub-workflow |
| Send email To Zimbra1 | Replaced by DavMail |
| Embeddings, Vector Store nodes | Not in use |
| Webhook Line1/2 | Alternative endpoints |

### Auto Assign 1.2
| Node | Reason |
|------|--------|
| Send email To DavMail | Email sending disabled |

---

## Notes for Modifications

1. **Adding New Categories**: Update `Category` data table and `Set Command Ticket` in CoreAI
2. **Adding New Branches**: Update `Branch Company` or `Branch Franchise` data tables
3. **Modifying AI Prompts**: Edit `messages` parameter in Core Agent, Find Branch, or Find Sub Category
4. **Changing Email Recipients**: Modify `toEmail` in `Send email To DavMail` node
5. **Adding New Event Handlers**: Add conditions to `Switch` node in main workflow
6. **Modifying Auto-Assign Logic**: Edit nodes in Auto Assign 1.2 workflow
7. **Modifying Auto-Close Logic**: Edit nodes in Auto Close Ticket 1.0 workflow
8. **Changing Schedule Time**: Modify `Schedule Trigger` node in Schedule Ticket Unclose
9. **Adjusting Wait Time**: Modify `Wait` node in Auto Assign 1.2 (currently 1 minute)
10. **Database Changes**: Modify SQL queries in `Microsoft SQL` nodes when schema changes

---

## Version History (Recent)

| Version | Date | Changes |
|---------|------|---------|
| 1.7.2 | 2026-02-16 | Schedule Unclose: removed 12:00 trigger (now 18:00 only). Auto Close: fixed close_time_minute SQL query |
| 1.7.1 | 2026-02-09 | Full audit trail with LogSQLServer v1.0.1 for all operations |
| 1.7 | 2026-02-12 | **Auto Close Ticket 1.0** added for closing tickets with "การแก้ไขปัญหา". Schedule renamed to Unclose. New "closed" and "Unclose" statuses |
| 1.7 | 2026-02-04 | Migrated from Google Sheets to SQL Server. LLM changed to deepseek-chat-v3.1. CoreAI 1.1→1.3, Auto Assign 1.1→1.2 |

---

*Generated: 2026-02-17*
