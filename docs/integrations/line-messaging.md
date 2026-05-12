# LINE Messaging API

> Integration with LINE Messaging API for receiving branch reports and fetching user/group profiles.

---

## Overview

LINE is the primary user interface for the ticket system. Branch staff report IT issues in LINE groups. The system receives these via webhook, fetches sender profiles and group info, and processes the messages through the ticket pipeline.

---

## Context Snapshot

- **Credential ID**: `YOUR_LINE_CREDENTIAL_ID` (sanitized)
- **Webhook type**: POST to n8n webhook path
- **Events handled**: message, unsend, memberJoined, memberLeft
- **Trust boundary**: LINE webhook data is untrusted — all processing validates and cleans input

---

## When to Read This

### Trigger

- Adding new LINE event handlers
- Modifying how sender profiles are fetched
- Debugging webhook connectivity issues
- Understanding the event payload structure

### Read With

- `docs/features/auto-ticket.md` [[docs/features/auto-ticket]] — where LINE events are routed
- `docs/integrations/external-services.md` [[docs/integrations/external-services]] — other external services

---

## Endpoints Used

| Endpoint | Purpose | Used In |
|----------|---------|---------|
| `GET /v2/bot/profile/{userId}` | Fetch user display name | Auto Ticket (Get Sender Profile) |
| `GET /v2/bot/group/{groupId}/member/{userId}` | Fetch group member profile | Auto Ticket |
| `GET /v2/bot/group/{groupId}/summary` | Fetch group display name | Auto Ticket (Get Group/Room Summary) |
| `GET /v2/bot/message/{messageId}/content` | Download message media (images) | Auto Ticket (FTP upload path) |

## Event Types

| Event | How Handled | Action |
|-------|------------|--------|
| `message` (text) | Default branch in Switch | Process through ticket pipeline |
| `message` (image) | If image → FTP | Download and upload to FTP, then process |
| `message` (sticker) | Switch branch 1 | Ignored (Set node only) |
| `unsend` | Switch branch 2 | Update ticket status to "unsent" + log |
| `memberJoined` | Switch branch 0 | Ignored (Set node only) |
| `memberLeft` | Switch branch 3 | Ignored (Set node only) |

## Key Data Points

From the webhook payload, the system extracts:

| Field | Path | Purpose |
|-------|------|---------|
| userId | `events[0].source.userId` | Identify sender |
| groupId | `events[0].source.groupId` | Identify which group |
| quotedMessageId | `events[0].message.quoteToken` | Link reply to original ticket |
| message_id | `events[0].message.id` | Unique message identifier (PK for tickets) |
| message type | `events[0].message.type` | Text, image, sticker, etc. |
| timestamp | `events[0].timestamp` | Message timestamp |

## Gotchas

- **Profile fetch requires valid userId** — the HTTP node retries on failure (5s delay). If the user hasn't added the bot as a friend, profile fetch may fail.
- **Unsend events only provide messageId** — the unsend event contains `events[0].unsend.messageId` (not the standard message path).
- **Group summary may return room name instead** — depending on whether the source is a group or multi-person chat, different endpoints are needed.

---

Related: `docs/reference/expressions.md` [[docs/reference/expressions]]
