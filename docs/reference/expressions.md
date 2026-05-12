# Key Expressions

> n8n expressions used across workflows for text processing, data extraction, and formatting.

---

## Overview

This reference documents the key n8n expressions (JavaScript) used in workflow nodes. These are non-obvious patterns that would be hard to reconstruct from the workflow JSON alone.

---

## Context Snapshot

- All expressions are n8n JavaScript expressions (enclosed in `{{ }}` in the n8n editor)
- Text processing expressions handle Thai text with Unicode-aware regex
- Timestamp expressions use Luxon's `DateTime` library available in n8n

---

## When to Read This

### Trigger

- Writing or modifying n8n expressions in any workflow node
- Debugging text extraction failures
- Understanding how ticket metadata is derived from messages

### Read With

- `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] — where text cleaning is applied
- `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]] — where close data is extracted

---

## Text Processing

### Clean Message Text

Removes @all mentions, emojis, colons, and normalizes whitespace:

```javascript
text.replace(/@all/ig, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/:/g, "")
    .replace(/\s+/g, " ")
    .trim()
```

Used in: Auto Ticket → SET - Normalize Clean Text

### Extract Reporter Name

Extracts the reporter name from "ผู้แจ้ง : Name" pattern:

```javascript
text.match(/ผู้แจ้ง\s*[:]?\s*(.*?)(\n|$)/)?.[1].trim() || "ไม่ได้ระบุ"
```

Used in: Auto Ticket CoreAI → Core Agent context

### Extract Problem Description

Extracts text after "ปัญหา":

```javascript
text.match(/ปัญหา\s*\s*([\s\S]*)/)?.[1].trim()
```

Used in: Auto Ticket CoreAI → Core Agent context

## Close Data Extraction

### Extract Close Cause

```javascript
text.match(/(?:อาการ|ปัญหาอาการ)[\s=:]*([\s\S]*?)(?=\s*การแก้ไขปัญหา)/)?.[1].trim()
```

### Extract Close Reason

```javascript
text.match(/การแก้ไขปัญหา[\s=:]*([\s\S]*?)(?=\s*@|$)/)?.[1].trim()
```

Used in: Auto Close Ticket → close data extraction

## Conditional Checks

### Check for Reply

Determines if the message is a reply to another message:

```javascript
$('SET - Extract Sender IDs').item.json.quotedMessageId !== ""
```

Used in: Auto Ticket → routing logic

### Check for Close Pattern

Detects if the IT staff's reply contains resolution text:

```javascript
clean_text.includes("การแก้ไขปัญหา")
```

Used in: Auto Close Ticket → close detection

## Timestamp Formatting

### ISO Timestamp

```javascript
DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:mm:ss.SSS')
```

### Date Fields (dd-MM-yyyy)

```javascript
DateTime.now().toFormat('dd-MM-yyyy')
```

Used in: Auto Ticket CoreAI → `#set วันที่เปิด Ticket`, Auto Close Ticket → `#set วันที่ปิด Ticket`

### Time Fields (HH:mm:ss)

```javascript
DateTime.now().toFormat('HH:mm:ss')
```

Used in: Auto Ticket CoreAI → `#set เวลาเปิด Ticket`, Auto Close Ticket → `#set เวลาปิด Ticket`

## Unsend Event

### Get Unsend Message ID

```javascript
$('Webhook Line').item.json.body.events[0].unsend.messageId
```

Used in: Auto Ticket → Update Unsend Status

## Email Commands

### Build Close Email Body

```javascript
emailBody + "\n#assign " + email_spiceworks + "\n#set สาเหตุ=" + cause + "\n#set การแก้ไขปัญหา=" + reason + "\n#close"
```

Used in: Auto Close Ticket → Send email To DavMail

## IT Group Routing

### IT Group ID Check

```javascript
'YOUR_IT_GROUP_ID'
```

Used in: Auto Ticket → If IT Group node (hardcoded IT group LINE ID for direct routing)

---

Related: `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]]
