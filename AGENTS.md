# Auto_Ticket_1.7 - n8n Workflow Context Documentation

> **Version**: 1.7
> **Purpose**: Automated IT Helpdesk Ticketing System with Auto-Assignment, Auto-Close & Audit Logging
> **Integration**: LINE Messaging API + AI Classification + Microsoft SQL Server + Sub-Workflow Architecture
> **Related Workflows**: Auto Ticket CoreAI 1.3, Auto Assign 1.2, Auto Close Ticket 1.0, Schedule Ticket Unclose 1.2, LogSQLServer v1.0.1

---

##  Overview

This workflow system automates IT helpdesk ticketing process with following architecture:

### Main Workflow (Auto Ticket 1.7)
1. Receiving messages from LINE groups/rooms
2. Processing different message types (text, image, video, sticker, etc.)
3. Detecting ticket patterns and routing to AI processing
4. **Unsend Detection**: Handles unsend events and marks pending tickets as "unsent"
5. **IT Team Detection**: Checks if sender is IT staff to route to Auto-Assign
6. **Auto-Close Detection**: Routes to Auto Close Ticket for IT staff closing tickets
7. Logging all activity to Microsoft SQL Server

### Sub-Workflow: Auto Assign 1.2
1. Called when IT staff replies to messages
2. **1-minute Wait**: Delays lookup to allow ticket creation to complete
3. Looks up pending tickets by `quotedMessageId`
4. Matches IT staff and sends email with `#assign` command
5. Updates ticket status to "assigned" with assignment info
6. Calls LogSQLServer sub-workflow for audit logging
7. **Chains to Auto Close Ticket** for further processing

### Sub-Workflow: Auto Close Ticket 1.0 (NEW)
1. Called after Auto Assign when IT staff replies
2. **Close Detection**: Checks if message contains "การแก้ไขปัญหา"
3. Looks up assigned tickets by `quotedMessageId`
4. Extracts `close_cause` (อาการ/ปัญหาอาการ) and `close_reason` (การแก้ไขปัญหา)
5. Matches IT Team and sends email with `#close` command
6. Updates ticket status to "closed" with calculated `close_time_minute`
7. Calls LogSQLServer sub-workflow for audit logging

### Sub-Workflow: Auto Ticket CoreAI 1.3
1. AI classification using OpenRouter LLM (deepseek/deepseek-chat-v3.1)
2. Branch and category matching
3. Generating email body and logging to Ticket table (status = "pending")
4. Uses Microsoft SQL Server for data storage
5. Calls LogSQLServer sub-workflow for audit logging

### Schedule Workflow (Schedule Ticket Unclose 1.2)
1. Runs at 18:00 daily
2. **Loop Over Items**: Processes assigned tickets one by one
3. Sends assigned tickets that haven't been closed
4. Updates ticket status to "Unclose"
5. Calls LogSQLServer sub-workflow for audit logging

### Audit Logging Workflow (LogSQLServer v1.0.1)
1. **Centralized Audit Log**: Records all ticket operations (INSERT, UPDATE, UNSEND, UNASSIGNED, CLOSE, UNCLOSE)
2. **SELECT TOP (1)**: Retrieves latest ticket record by message_id
3. **Set Insert Log**: Prepares log data with table_name, action_type, value, datetime, by
4. **Insert Log**: Inserts audit record into [YourDatabase].[dbo].[log] table
5. **Called By**: Auto Ticket CoreAI 1.3, Auto Assign 1.2, Auto Close Ticket 1.0, Schedule Ticket Unclose 1.2, Auto Ticket 1.7 (unsend)

---

##  System Architecture

```
 Line ──► Limit ──► Extract IDs ──► Get Profile ──► Get Summary    │
       │                                                           │
       ▼                                                      Switch        │
                                                       │         │
                                    ┌───────────────────────────────┤         │
                       [memberJoined] [sticker] [unsend] [memberLeft] [Default]
                              │          │         │          │          │   │
                             Set        Set   Update SQL   Set     If image? │
                                    (member)   (unsent)  (member)         │   │
                                                              ┌──────┴───┐│
                                                        If notEmpty? [Yes]     [No] │
                                                        ┌───┴───┐       │          ││
                                                     [Yes]   [No]   Image Upload   ││
                                                       │           │     Normalize│
                                                  Call LogSQL    │              │   │
                                                       │           └──────┬───────┘│
                                                       └──────────────────────┘   │
                                                               Get IT Team          │
                                                          If IT Team?       │
                                                     ┌────────┴────────┐    │
                                                   [Yes]            [No]    │
                                                     │                │     │
                                           Call Auto Assign     If Ticket?  │
                                                     │                ┌────┴────┐ │
                                                     │              [Yes]    [No] │
                                                     │                │        │  │
                                          ┌──────────┤        Call CoreAI 1.3     │
                                          ▼          ▼                               │
                                   If Contains        │                               │
                                  "การแก้ไขปัญหา"?    │                               │
                                        │             │                               │
                                   ┌────┴────┐        │                               │
                                [Yes]      [No]     │                               │
                                  │          │       │                               │
                         Call Auto Close   (end)    │                               │
                                  Ticket              │                               │


┌─────────────────────────────────────────────────────────────────────────────┐
│                     Auto Assign 1.2 (Sub-Workflow)                          │
│                                                                             │
│  Start ──► If Reply ──► Wait (1 min) ──► Lookup Ticket ──► If notEmpty     │
│                │                                               │            │
│              [No]                                    ┌─────────┴─────────┐  │
│                │                                   [Yes]              [No]  │
│              Log                                     │                  │   │
│                                               Match IT Team        Log      │
│                                                      │                      │
│                                              Send email DavMail             │
│                                                      │                      │
│                                              Update SQL (assigned)          │
│                                                      │                      │
│                                              Call LogSQLServer              │
│                                                      │                      │
│                                                    (end)                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                  Auto Close Ticket 1.0 (Sub-Workflow) NEW                   │
│                                                                             │
│  Start ──► If Contains "การแก้ไขปัญหา" ──► Lookup Ticket ──► If notEmpty │
│                                               │            │                │
│                                             [No]          [Yes]             │
│                                               │              │               │
│                                             Log        Match IT Team        │
│                                                         │                  │
│                                              Send email DavMail             │
│                                                         │                  │
│                                              Update SQL (closed)            │
│                                                         │                  │
│                                              Call LogSQLServer              │
│                                                         │                  │
│                                                       (end)                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    Auto Ticket CoreAI 1.3 (Sub-Workflow)                    │
│                                                                             │
│  Start ──► Get Category ──► Core Agent ──► Get Branch Company/Franchise        │
│                                    │                   │                    │
│                              Set Branch ◄──────────────┘                    │
│                                    │                                        │
│                             Merge Company ──► Aggregate ──► Find Branch     │
│                                                                │            │
│                                    ┌───────────────────────────┤            │
│                                    │                           │            │
│                               Get Sub Category          Find Sub Cat        │
│                                    │                           │            │
│                                    └──────────┬────────────────┘            │
│                                               │                             │
│                                             Merge ──► Set Command ──►       │
│                                          Set Sub/Body ──► SQL Insert       │
│                                                              │              │
│                                                    Call LogSQLServer        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                 Schedule Ticket Unclose 1.2 (Scheduled)                     │
│                                                                             │
│  Schedule (18:00) ──► Get Assigned Tickets ──► If notEmpty ──►      │
│                                                              │              │
│                                                       Loop Over Items       │
│                                                              │              │
│                                                  Send email ──►             │
│                                              Update Status ──► Call Log     │
│                                                                    │         │
│                                                                  Loop       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LogSQLServer v1.0.1 (Sub-Workflow)                       │
│                                                                             │
│  Start ──► SELECT TOP (1) ──► Set Insert Log ──► Insert Log ──► (end)      │
│            (by message_id)        (prepare data)      (to log table)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

##  Workflow Triggers

### Auto Ticket 1.7
| Property | Value |
|----------|-------|
| **Type** | Webhook (POST) |
| **Node Name** | `Webhook Line` |
| **Path** | `/1904a57e-caaa-45e4-900b-4fd96c94f316` |
| **Source** | LINE Messaging API Webhook |
| **Production URL** | `https://n8n-dev.example.com/webhook/1904a57e-caaa-45e4-900b-4fd96c94f316` |

### Auto Assign 1.2
| Property | Value |
|----------|-------|
| **Type** | Execute Workflow Trigger |
| **Node Name** | `Start` |
| **Called By** | Auto Ticket 1.7 via `Call Auto Assign` node |
| **Workflow ID** | `4tIlVjstYxU09G6a` |

### Auto Close Ticket 1.0 (NEW)
| Property | Value |
|----------|-------|
| **Type** | Execute Workflow Trigger |
| **Node Name** | `Start` |
| **Called By** | Auto Ticket 1.7 via `Call Auto Close Ticket` node (after Auto Assign) |
| **Workflow ID** | `USgdNP1aNHh1QJg3` |

### Auto Ticket CoreAI 1.3
| Property | Value |
|----------|-------|
| **Type** | Execute Workflow Trigger |
| **Node Name** | `Start` |
| **Called By** | Auto Ticket 1.7 via `Call Auto Ticket CoreAI` node |
| **Workflow ID** | `vnzG9J1ipCdgk5Q4` |

### Schedule Ticket Unclose 1.2
| Property | Value |
|----------|-------|
| **Type** | Schedule Trigger |
| **Node Name** | `Schedule Trigger` |
| **Schedule** | Daily at 18:00 |
| **Timezone** | Asia/Bangkok |

### LogSQLServer v1.0.1
| Property | Value |
|----------|-------|
| **Type** | Execute Workflow Trigger |
| **Node Name** | `Start` |
| **Called By** | Auto Ticket 1.7 (unsend), Auto Ticket CoreAI 1.3, Auto Assign 1.2, Auto Close Ticket 1.0, Schedule Ticket Unclose 1.2 |
| **Workflow ID** | `q3ybqMcKYHUTu4qg` |

---

##  Main Flow (Auto Ticket 1.7) - Node Details

### 1. Entry Nodes

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Webhook Line` | Webhook | Receives LINE webhook POST requests |
| `Limit` | Limit | Limits processing to 1 item |

### 2. Sender Information Extraction

| Node Name | Type | Purpose |
|-----------|------|---------|
| `SET - Extract Sender IDs` | Set | Extracts `userId`, `groupId`, `roomId`, `timestamp`, `quotedMessageId`, `message_id` |
| `HTTP - Get Sender Profile` | HTTP Request | Fetches user display name from LINE API |
| `Get Group/Room Summary` | HTTP Request | Fetches group/room name from LINE API |

### 3. Event Type Routing (Switch Node)

| Branch | Condition | Handler |
|--------|-----------|---------|
| 0 | `events[0].type` = `memberJoined` | `Set (memberJoined)` |
| 1 | `events[0].message.type` = `sticker` | `Set (sticker)` |
| 2 | `events[0].type` = `unsend` | `Update Unsend Status (SQL)` → Call LogSQLServer |
| 3 | `events[0].type` = `memberLeft` | `Set (memberLeft)` |
| Default | Other events | `If image` node |

### 4. Unsend Event Handling

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Update Unsend Status (SQL)` | Microsoft SQL | Updates `status` = "unsent", `assigned_to` = "(unsent)" |
| `Call LogSQLServer v1.0.0` | Execute Workflow | Logs unsend action to audit log |
| `Set (unsent)` | Set | Sets raw_text and clean_text to "(unsend)" |

> **Note**: Wait node in unsend path is disabled. Direct SQL update is performed.

### 5. Media Handling (Image/Video)

| Node Name | Type | Purpose |
|-----------|------|---------|
| `If image` | If | Checks if message type is `image\|video` |
| `Get Image` | HTTP Request | Downloads media from LINE API |
| `filename` | Set | Generates unique filename (displayName_timestamp_groupName) |
| `FTP` | FTP | Uploads file to `ftp/` directory |
| `Upload Image` | Set | Creates hyperlink formula |

### 6. Text Processing

| Node Name | Type | Purpose |
|-----------|------|---------|
| `SET - Normalize Clean Text` | Set | Cleans text: removes @all, emojis, colons, normalizes whitespace, extracts `from_ticket` |

### 7. IT Team Detection & Routing

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Get IT Team` | Data Table | Fetches IT staff data by userId |
| `If not IT Team` | If | Checks if sender is active IT staff (`active` = "Y") |
| **True Branch** | → | Call Auto Assign (for reply handling) |
| **False Branch** | → | Proceed to `If Ticket` check |

### 8. Ticket Detection

| Node Name | Type | Purpose |
|-----------|------|---------|
| `If Ticket` | If | Checks if message contains: (`สาขา` OR `แผนก`) AND `ปัญหา` |

> **Note**: Added `แผนก` as alternative to `สาขา` in v1.6.2

### 9. Sub-Workflow Calls

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Call Auto Ticket CoreAI` | Execute Workflow | Calls CoreAI 1.3 for AI classification |
| `Call Auto Assign` | Execute Workflow | Calls Auto Assign 1.2 for IT staff reply handling |
| `Call Auto Close Ticket` | Execute Workflow | **NEW**: Calls Auto Close Ticket 1.0 for closing tickets |

### 10. Output Notes

> **Note**: All logging is now done via Microsoft SQL Server. Google Sheets logging has been deprecated since v1.7.

---

##  Auto Assign 1.2 (Sub-Workflow) - Node Details

### 1. Input Parameters

| Parameter | Description |
|-----------|-------------|
| `quotedMessageId` | ID of the message being replied to |
| `userId` | User ID of the replier |
| `body_events_firstItem` | LINE webhook events array |
| `groupId_firstItem` | Group ID |
| `userId_firstItem` | User ID |
| `displayName_firstItem` | Sender display name |
| `raw_text_firstItem` | Original message text |
| `clean_text_firstItem` | Normalized clean text |
| `groupName_firstItem` | Group name |
| `body_events` | Full events array |

### 2. Processing Nodes

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Start` | Execute Workflow Trigger | Receives input from main workflow |
| `If Reply` | If | Checks if `quotedMessageId` is not empty |
| `Wait` | Wait | **Waits 1 minute** before lookup (allows ticket creation) |
| `Lookup Ticket` | Microsoft SQL | Finds ticket by `quotedMessageId` where `status` = "pending" |
| `If notEmpty` | If | Checks if pending ticket was found |
| `Match IT Team` | Data Table | Gets IT staff profile by userId |
| `Send email To DavMail` | Email Send | **DISABLED** - Email sending disabled |
| `Update Ticket Status` | Microsoft SQL | Updates `status` = "assigned", `assigned_to`, `assigned_date` |
| `Call LogSQLServer v1.0.0` | Execute Workflow | Calls LogSQLServer sub-workflow for audit logging |

### 3. Flow Logic

```
Start → If Reply?
           ├─[Yes]→ Wait (1 min) → Lookup Ticket → If notEmpty?
           │                                           ├─[Yes]→ Match IT Team → [Email Disabled] → Update SQL → Call LogSQLServer → (end)
           │                                           └─[No]→ (end)
           └─[No]→ (end)
```

---

##  Auto Close Ticket 1.0 (Sub-Workflow) - Node Details (NEW)

### 1. Input Parameters

| Parameter | Description |
|-----------|-------------|
| `clean_text` | Normalized clean text from message |
| `quotedMessageId` | ID of the message being replied to |
| `userId` | User ID of the replier |

### 2. Processing Nodes

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Start` | Execute Workflow Trigger | Receives input from Auto Assign |
| `If` | If | Checks if `clean_text` contains "การแก้ไขปัญหา" |
| `Microsoft SQL` | Microsoft SQL | Finds ticket by `quotedMessageId` where `status` = "assigned" |
| `If notEmpty` | If | Checks if assigned ticket was found |
| `Match IT Team` | Data Table | Gets IT staff profile by userId |
| `Send email To DavMail` | Email Send | Sends email with `#close` command including cause and reason |
| `Update Ticket Status` | Microsoft SQL | Updates `status` = "closed", `close_cause`, `close_reason`, `close_time_minute` |

### 3. Flow Logic

```
Start → If contains "การแก้ไขปัญหา"?
           ├─[Yes]→ Lookup Ticket → If notEmpty?
           │                            ├─[Yes]→ Match IT Team → Send Email → Update SQL → Call LogSQLServer → (end)
           │                            └─[No]→ (end)
           └─[No]→ (end)
```

### 4. Close Data Extraction

The workflow extracts two key pieces of information from the message:
- **close_cause**: Extracted from pattern `(?:อาการ|ปัญหาอาการ)[\s=:]*([\s\S]*?)(?=\s*การแก้ไขปัญหา)`
- **close_reason**: Extracted from pattern `การแก้ไขปัญหา[\s=:]*([\s\S]*?)(?=\s*@|$)`

### 5. Email Format

The email sent includes:
- Original email body from ticket
- `#assign` command with IT staff email
- `#set สาเหตุ=<cause>`
- `#set การแก้ไขปัญหา=<reason>`
- `#close` command

---

##  Sub-Workflow (Auto Ticket CoreAI 1.3) - Node Details

### 1. Input Parameters

| Parameter | Description |
|-----------|-------------|
| `from_ticket_firstItem` | Reporter info extracted from message |
| `body_events_firstItem` | LINE webhook events array |
| `groupName_firstItem` | Group name |
| `groupId_firstItem` | Group ID |
| `userId_firstItem` | User ID |
| `displayName_firstItem` | Sender display name |
| `raw_text_firstItem` | Original message text |
| `clean_text_firstItem` | Normalized clean text |
| `clean_text` | Clean text |
| `HTTP__Get_Sender_Profile_userId_firstItem` | User ID from profile |
| `SET__Normalize_Clean_Text_isExecuted` | Boolean flag |
| `raw_text` | Raw text |

### 2. AI Classification Nodes

| Node Name | Type | Model | Purpose |
|-----------|------|-------|---------|
| `Core Agent` | LLM Chain | OpenRouter (deepseek/deepseek-chat-v3.1) | Classifies category, intent, extracts branch name |
| `Find Branch` | LLM Chain | OpenRouter (deepseek/deepseek-chat-v3.1) | Matches branch to master list |
| `Find Sub Category` | LLM Chain | OpenRouter (deepseek/deepseek-chat-v3.1) | Classifies sub-category |

### 3. Branch Data Retrieval

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Get Category` | Data Table | Fetches category master list |
| `Get Branch Company` | Data Table | Fetches Company branch list |
| `Get Branch Franchise` | Data Table | Fetches Franchise branch list |
| `Get Sub Category` | Data Table | Fetches sub-category list |

### 4. Data Merging

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Set Branch Company` | Set | Tags items with `Company = "Branch Company"` |
| `Set Branch Franchise` | Set | Tags items with `Company = "Branch Franchise"` |
| `Merge Company` | Merge | Combines Company and Franchise branch lists |
| `Aggregate` | Aggregate | Aggregates branch data (Name, Alias, Company) |
| `Merge` | Merge | Combines Branch and Sub Category results |

### 5. Ticket Generation

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Set Command Ticket` | Set | Generates `#category`, `#sub_category`, `#branch` commands |
| `Set Sub/Body` | Set | Builds email subject and body |

### 6. Output Nodes

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Microsoft SQL` | Microsoft SQL | Inserts ticket data with `status` = "pending" |
| `Call LogSQLServer v1.0.0` | Execute Workflow | Logs ticket creation to audit log |

---

##  Schedule Workflow (Schedule Ticket Unclose 1.2) - Node Details

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Schedule Trigger` | Schedule | Triggers at 18:00 daily |
| `Get Pending Tickets` | Microsoft SQL | Gets rows where `status` = "assigned" |
| `If notEmpty` | If | Checks if any assigned tickets exist |
| `Loop Over Items` | Split In Batches | Processes tickets one by one (batch size: 1) |
| `Send email To DavMail` | Email Send | Sends ticket email (no assignment) |
| `Update Ticket Status` | Microsoft SQL | Updates `status` = "Unclose", `assigned_to` = IT staff name |
| `Call LogSQLServer v1.0.0` | Execute Workflow | Calls LogSQLServer for audit logging |

### Flow Logic
```
Schedule Trigger → Get Assigned Tickets → If notEmpty?
                                                ├─[Yes]→ Loop Over Items ─┬─► Send Email → Update Status → Call LogSQLServer → Loop
                                                │                         └─► (done)
                                                └─[No]→ (end)
```

---

##  Audit Logging Workflow (LogSQLServer v1.0.1) - Node Details

| Node Name | Type | Purpose |
|-----------|------|---------|
| `Start` | Execute Workflow Trigger | Receives input from calling workflows |
| `SELECT TOP (1)` | Microsoft SQL | Retrieves latest ticket record by message_id |
| `Set Insert Log` | Set | Prepares log data (table_name, action_type, value, datetime, by) |
| `Insert Log` | Microsoft SQL | Inserts audit record into [YourDatabase].[dbo].[log] table |

### Input Parameters

| Parameter | Description |
|-----------|-------------|
| `table_name` | Database table name (e.g., "[YourDatabase].[dbo].[ticket]") |
| `action_type` | Action performed (INSERT, UPDATE, UNSEND, CLOSE, UNCLOSE) |
| `value` | Description of the change |
| `message_id` | Ticket message ID |
| `datetime` | Timestamp of the action |
| `by` | User/system who performed the action |

### Database Structure (Log Table)

### Table: [YourDatabase].[dbo].[log]

| Column | Type | Description |
|--------|------|-------------|
| table_name | VARCHAR | Name of the table where action occurred |
| table_row_id | VARCHAR | ID of the affected row |
| action_type | VARCHAR | Type of action (INSERT, UPDATE, UNSEND, CLOSE, UNCLOSE) |
| value | NVARCHAR | Description of the change |
| created_date | DATETIME | Timestamp when log entry was created |
| created_by | VARCHAR | User/system who performed the action |
| message_id | VARCHAR | Associated ticket message ID |

---

##  AI Classification Details

### Core Agent Output Schema

```json
{
  "branch_name": "string | null",
  "reporter_name": "string | null",
  "category": "string",
  "intent": "INC | SR",
  "subject_summary": "string (max 60 chars)"
}
```

### Find Branch Output Schema

```json
{
  "branch_name": "string",
  "company": "string"
}
```

### Find Sub Category Output Schema

```json
{
  "sub_category": "string"
}
```

### Category Mapping

| AI Category | Ticket Category |
|-------------|-----------------|
| SW | Software |
| HW | Hardware |
| NETWORK | Network |
| CAMERA | Camera |
| PRINTER | Printer |
| RATE | Software |
| POS | Software |
| REQUEST | Requested |

### Intent Classification

| Intent | Description |
|--------|-------------|
| INC | Incident - broken/error issues |
| SR | Service Request - setup/request |

---

##  Ticket Status Flow

```
┌──────────┐                                    ┌──────────┐
│ pending  │ ───── If Reply by IT Staff ──────► │ assigned │
└──────────┘       (via Auto Assign 1.2)        └──────────┘
     │                                               │
     ├──── If Unsend Event ────► ┌────────┐          │ If contains "การแก้ไขปัญหา"
     │     (in Main Workflow)    │ unsent │          │ (via Auto Close Ticket 1.0)
     │                           └────────┘          ▼
     │                                              ┌────────┐
     │                                              │ closed │
     │                                              └────────┘
     │
     │ Schedule (18:00)
     │ No close received
     ▼
┌─────────────┐
│  Unclose    │
└─────────────┘
```

---

##  Data Tables (n8n Internal)

| Table ID | Name | Purpose |
|----------|------|---------|
| `0gECxoX7q3C9vtSW` | Category | Master category list with aliases |
| `tbGFT0QvOZY36KR8` | Branch Company | Company company branches |
| `tsXyKblM8cdLFvHE` | Branch Franchise | Franchise branches |
| `lctiSAoBPS8KFCI8` | Sub Category | Sub-category mappings |
| `qxjykIZZNaErzW0k` | IT_Team | IT staff members (used for Auto-Assign) |

---

##  Database Structure (Microsoft SQL Server)

### Table: [YourDatabase].[dbo].[ticket]

| Column | Type | Description |
|--------|------|-------------|
| message_id | VARCHAR | LINE message ID (primary key) |
| status | VARCHAR | pending / assigned / Unclose / unsent / closed |
| assigned_to | VARCHAR | IT staff name who took the ticket |
| assigned_date | DATETIME | Timestamp when assigned/sent |
| intent | VARCHAR | INC/SR classification |
| category | VARCHAR | Main category |
| branch_name | VARCHAR | Branch name |
| branch_company | VARCHAR | Company (Company/Franchise) |
| subject | VARCHAR | Email subject |
| clean_text | NVARCHAR | Normalized message |
| raw_text | NVARCHAR | Original message |
| email_body | NVARCHAR | Email body content |
| chatname | VARCHAR | Group/Room name |
| fromuser | VARCHAR | Sender display name |
| userid | VARCHAR | LINE user ID |
| groupid | VARCHAR | LINE group ID |
| created_date | DATETIME | Record creation timestamp |
| created_by | VARCHAR | Who created the record |
| updated_date | DATETIME | Record update timestamp |
| updated_by | VARCHAR | Who updated the record |
| sub_category | VARCHAR | Sub-category |
| **close_cause** | NVARCHAR | **NEW**: Problem cause/symptom |
| **close_reason** | NVARCHAR | **NEW**: Problem resolution |
| **close_time_minute** | INT | **NEW**: Time from assigned to closed (minutes) |

---

##  External Integrations

### LINE Messaging API
- **Auth**: Bearer Token (credential ID: `taEN43RaPXagQMcX`)
- **Endpoints Used**:
  - `GET /v2/bot/profile/{userId}` - User profile
  - `GET /v2/bot/group/{groupId}/member/{userId}` - Group member profile
  - `GET /v2/bot/group/{groupId}/summary` - Group summary
  - `GET /v2/bot/message/{messageId}/content` - Download media

### OpenRouter LLM
- **Model**: `deepseek/deepseek-chat-v3.1` (NEW in v1.3)
- **Temperature**: 0 (deterministic)
- **Response Format**: JSON Object
- **Credential ID**: `NEbQVn9EuXOOfFxh`

### FTP Server
- **Credential ID**: `snp3QvieyhjBYtWH`
- **Upload Path**: `ftp/{filename}.{extension}`
- **Public URL**: `https://e-learning.example.com//[Company Name]/{filename}.{extension}`

### SMTP (DavMail)
- **From**: `helpdesk@example.com`
- **To**: `helpdesk@example.com`
- **Credential ID**: `o2kgNvpcg8y3t93j`

### Microsoft SQL Server
- **Credential ID**: `DlMjRKIkdeMbyUDh`
- **Database**: `YourDatabase`
- **Table**: `[YourDatabase].[dbo].[ticket]`

### Google Sheets (DEPRECATED - v1.7+)
> **Note**: Google Sheets logging has been deprecated. All logging now uses Microsoft SQL Server.
- **Document ID**: `1zMLRoKuIo8fAhtLEnmAj3GLsvvtqZqt4s5Kfi8YtbDs`
- **Auth Methods**:
  - Service Account (credential ID: `FIzrlgblsOScAy7H`)
  - OAuth2 (credential ID: `7Zm6BX0hscrSUU6O`)

---

##  Key Expressions

### Text Cleaning
```javascript
// Remove @all, emojis, colons, normalize whitespace
$('Webhook Line').item.json.body.events[0].message.text
    .replace(/@all/ig, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/:/g, "")
    .replace(/\s+/g, " ")
    .trim()
```

### Extract Reporter Name
```javascript
// Extract from "ผู้แจ้ง : Name" pattern + append sender display name
$('Webhook Line').first().json.body.events[0].message.text
    .match(/ผู้แจ้ง\s*[:]?\s*(.*?)(\n|$)/)?.[1].trim() || "ไม่ได้ระบุ"
```

### Extract Problem Description
```javascript
// Extract text after "ปัญหา"
$('Webhook Line').first().json.body.events[0].message.text
    .match(/ปัญหา\s*\s*([\s\S]*)/)?.[1].trim()
```

### Extract Close Cause (NEW)
```javascript
// Extract problem cause/symptom for closing tickets
clean_text.match(/(?:อาการ|ปัญหาอาการ)[\s=:]*([\s\S]*?)(?=\s*การแก้ไขปัญหา)/)?.[1].trim()
```

### Extract Close Reason (NEW)
```javascript
// Extract resolution for closing tickets
clean_text.match(/การแก้ไขปัญหา[\s=:]*([\s\S]*?)(?=\s*@|$)/)?.[1].trim()
```

### Timestamp Formatting
```javascript
// Format timestamp to ISO string
DateTime.fromMillis($('Webhook Line').first().json.body.events[0].timestamp)
    .toFormat('yyyy-MM-dd HH:mm:ss.SSS')
```

### Check for Reply Message
```javascript
// Check if quotedMessageId exists
$('SET - Extract Sender IDs').item.json.quotedMessageId !== ""
```

### Check for Close Pattern (NEW)
```javascript
// Check if message contains close pattern
clean_text.includes("การแก้ไขปัญหา")
```

### Email Body with Assignment
```javascript
// Send email with #assign command
$('Lookup Ticket').item.json.email_body + "\n#assign " + $json.email_spiceworks
```

### Email Body with Close (NEW)
```javascript
// Send email with #close command
emailBody + "\n#assign " + email_spiceworks + "\n#set สาเหตุ=" + cause + "\n#set การแก้ไขปัญหา=" + reason + "\n#close"
```

### Check for Unsend Event
```javascript
// Get unsend messageId
$('Webhook Line').item.json.body.events[0].unsend.messageId
```

---

##  Disabled Nodes

### Auto Ticket 1.7
| Node Name | Reason |
|-----------|--------|
| `Wait` (unsend path) | Disabled - direct SQL update is used instead |
| `Google Sheets – Raw Log` | Deprecated - replaced by SQL Server logging |
| `Google Sheets – Log` | Deprecated - replaced by SQL Server logging |
| `Webhook Line Text/Image/Video/File` | Test data nodes |
| `Core Agent1` | Old prompt version (replaced by sub-workflow) |
| `Find Sub Category1` | Moved to sub-workflow |
| `Groq Chat Model1` | Previous LLM model (replaced by OpenRouter) |
| `Send email To Zimbra1` | Old email node (replaced by DavMail) |
| `Embeddings Google Gemini1` | Vector store embedding (not in use) |
| `Supabase Vector Store` | Vector store (not in use) |
| `Get row(s) in sheet` | Test data retrieval |
| `Webhook Line1/2` | Alternative webhook endpoints (disabled) |

### Auto Assign 1.2
| Node Name | Reason |
|-----------|--------|
| `Send email To DavMail` | **DISABLED** - Email sending is disabled |

---

##  Error Handling

| Node | Setting | Value |
|------|---------|-------|
| `HTTP - Get Sender Profile` | onError | continueRegularOutput |
| `HTTP - Get Sender Profile` | retryOnFail | true (5000ms) |
| `Get Group/Room Summary` | retryOnFail | true (5000ms) |
| `Get Image` | retryOnFail | true (5000ms) |
| `Core Agent` | retryOnFail | true (5000ms, 5 tries) |
| `FInd Branch` | onError | continueRegularOutput |
| `FInd Branch` | retryOnFail | true (5000ms) |
| `Find Sub Category` | retryOnFail | true (5000ms) |
| `Update Ticket Status` (Auto Assign) | retryOnFail | true (3000ms, 5 tries) |
| `Send email To DavMail` (Auto Close) | retryOnFail | true (5000ms, 5 tries) |
| `Call Auto Assign` | retryOnFail | true (5000ms, 5 tries) |
| `Call Auto Close Ticket` | retryOnFail | true (5000ms, 5 tries) |

---

##  Notes for Modifications

1. **Adding New Categories**: Update the `Category` data table and modify the mapping in `Set Command Ticket` (in CoreAI sub-workflow)
2. **Adding New Branches**: Update the `Branch Company` or `Branch Franchise` data tables
3. **Modifying AI Prompts**: Edit the `messages` parameter in `Core Agent`, `Find Branch`, or `Find Sub Category` nodes (in CoreAI sub-workflow)
4. **Changing Email Recipients**: Modify `toEmail` in the `Send email To DavMail` node
5. **Adding New Event Handlers**: Add new conditions to the `Switch` node in the main workflow
6. **Modifying Auto-Assign Logic**: Edit nodes in the Auto Assign 1.2 workflow
7. **Modifying Auto-Close Logic**: Edit nodes in the Auto Close Ticket 1.0 workflow
8. **Changing Schedule Time**: Modify the `Schedule Trigger` node in the Schedule Ticket Unclose workflow
9. **Adjusting Wait Time**: Modify the `Wait` node in Auto Assign 1.2 (currently 1 minute)
10. **Database Changes**: Modify SQL queries in `Microsoft SQL` nodes when database schema changes

---

##  Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.7.2 | 2026-02-16 | **Schedule Updated**: Schedule Ticket Unclose 1.2 removed 12:00 trigger (now only 18:00), **Auto Close Fixed**: SQL query now uses column directly instead of template literal for `close_time_minute` calculation |
| 1.5 | 2025-12-23 | Initial documentation |
| 1.5.1 | 2025-12-29 | Changed LLM from Groq to OpenRouter (mimo-v2-flash), Email changed from Zimbra to DavMail, Disabled IT Staff filtering, Simplified ticket detection |
| 1.6 | 2026-01-05 | **Architecture Change**: Split into Main + Sub-Workflow (CoreAI 1.0), **New Feature**: Auto-Assign via LINE Reply, **New Workflow**: Schedule Ticket Unassign for pending tickets, Added ticket status flow (pending → assigned / unassigned), Added `quotedMessageId` detection for reply tracking |
| 1.6.2 | 2026-01-19 | **Auto Assign Separated**: Auto-Assign logic moved to separate sub-workflow (Auto Assign 1.1), **New Wait Node**: 1-minute delay in Auto Assign before ticket lookup, **Unsend Handling**: Added detection and handling of unsend events (status = "unsent"), **Ticket Detection Enhanced**: Added `แผนก` as alternative to `สาขา`, **Loop Processing**: Schedule Unassign uses Loop Over Items for batch processing, **CoreAI Updated**: Version 1.1 with enhanced logging, **All Workflows Updated**: CoreAI 1.0→1.1, Schedule Unassign 1.0→1.1, New Auto Assign 1.1 |
| 1.7 | 2026-02-04 | **LLM Model Updated**: Changed from mimo-v2-flash to deepseek/deepseek-chat-v3.1 in CoreAI 1.3, **Database Migration**: Migrated from Google Sheets to Microsoft SQL Server for ticket storage, **Auto Assign Enhanced**: Version 1.2 adds LogSQLServer sub-workflow call for audit logging, **SQL Queries**: All ticket operations now use Microsoft SQL Server, **Updated Workflows**: Auto Ticket 1.6.2→1.7, CoreAI 1.1→1.3, Auto Assign 1.1→1.2, **Status Updated**: Changed "sent" to "assigned", "sent_unassigned" to "unassigned" |
| 1.7.1 | 2026-02-09 | **Schedule Unassign Updated**: Version 1.2 adds LogSQLServer sub-workflow call for audit logging, **Unsend Enhanced**: Added LogSQLServer call for unsend event logging, **CoreAI Enhanced**: Added LogSQLServer call for ticket creation logging, **Full Audit Trail**: All ticket operations now logged via LogSQLServer v1.0.1, **Updated Workflows**: Schedule Unassign 1.1→1.2, New LogSQLServer v1.0.1, Auto Ticket 1.7→1.7.1 |
| 1.7 | 2026-02-12 | **Auto Close Ticket Added**: New Auto Close Ticket 1.0 sub-workflow for handling ticket closure, **Close Detection**: Detects "การแก้ไขปัญหา" pattern in IT staff replies, **Close Data**: Extracts `close_cause`, `close_reason`, calculates `close_time_minute`, **Schedule Updated**: Schedule Ticket Unclose 1.2 now processes "assigned" tickets (renamed from Unassign), **New Status**: Added "closed" and "Unclose" statuses, **Email Disabled**: Auto Assign email sending disabled, **Workflow Chain**: Auto Assign → Auto Close Ticket for processing replies, **Updated Workflows**: Auto Ticket 1.7.1→1.7, New Auto Close Ticket 1.0, Schedule Ticket Unassign 1.2→Schedule Ticket Unclose 1.2 |

---

##  Workflow IDs

| Workflow | ID | Version |
|----------|-----|---------|
| Auto Ticket 1.7 | `yjqa7NBnaFqtPjBd` | 1.7 |
| Auto Ticket CoreAI 1.3 | `vnzG9J1ipCdgk5Q4` | 1.3 |
| Auto Assign 1.2 | `4tIlVjstYxU09G6a` | 1.2 |
| **Auto Close Ticket 1.0** | `USgdNP1aNHh1QJg3` | 1.0 (NEW) |
| Schedule Ticket Unclose 1.2 | `UBCa3WsUnv88uG-4Syw6l` | 1.2 |
| LogSQLServer v1.0.1 | `q3ybqMcKYHUTu4qg` | 1.0.1 |

---

*Generated: 2026-02-12*
