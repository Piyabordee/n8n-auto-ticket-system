# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.6] - 2026-05-24

### Added
- Manual Close Ticket workflow — close assigned tickets via n8n form (messageId, close_cause, close_reason)

### Changed
- Error Notify Telegram: Escape HTML entities in error messages to prevent parsing issues
- Error Notify Telegram: Improved error handling and message formatting

---

## [1.7.5] - 2026-05-06

### Added
- Auto Ticket CoreAI: Added `#type` field (Incident/Service Request) based on AI intent classification
- Split date/time fields: `#set วันที่เปิด Ticket` (dd-MM-yyyy) and `#set เวลาเปิด Ticket` (HH:mm:ss)
- Auto Close Ticket: Split close date/time (วันที่ปิด Ticket, เวลาปิด Ticket)

### Changed
- Auto Ticket: Removed unused Supabase webhook logging node
- LogSQLServer: Added `binaryMode: "separate"` setting

---

## [1.7.4] - 2026-04-21

### Changed
- Auto Ticket 1.7.1 → 1.7.2
- Auto Assign 1.2 → 1.2.1
- Schedule Ticket Unclose 1.3 → 1.4.1
- Auto Close Ticket 1.0 → 1.2.1
- LogSQLServer: Replaced sensitive credential IDs with placeholders
- Schedule Ticket Unclose: Improved email sending logic with new conditions

---

## [1.7.3] - 2026-02-18

### Added
- Auto Ticket: Added "If IT Group" node to route IT group messages directly to Auto Assign

### Changed
- Schedule Ticket Unclose: Changed from 18:00 to 08:00 trigger time
- Schedule Ticket Unclose: Now sends summary email to IT lead instead of updating individual tickets

### Removed
- UNCLOSE action type from LogSQLServer (schedule no longer updates tickets)

---

## [1.7.3] - 2026-02-16

### Changed
- Schedule Ticket Unclose: Removed 12:00 trigger (now only 18:00)
- Auto Close Ticket: Fixed SQL query to use column directly instead of template literal

---

## [1.7.2] - 2026-02-12

### Added
- Auto Close Ticket 1.0 sub-workflow for handling ticket closure
- Close detection with "การแก้ไขปัญหา" pattern
- Extract `close_cause`, `close_reason`, and calculate `close_time_minute`
- Workflow chaining: Auto Assign → Auto Close Ticket

### Changed
- Schedule Ticket Unclose now processes "assigned" tickets
- Auto Assign email sending disabled
- New ticket statuses: "closed" and "Unclose"
- Renamed Schedule Ticket Unassign → Schedule Ticket Unclose

---

## [1.7.1] - 2026-02-09

### Added
- Schedule Unassign 1.2 adds LogSQLServer call for audit logging
- Centralized audit logging with LogSQLServer v1.0.1

### Changed
- Unsend events now logged via LogSQLServer
- Status name updated from "sent_unassigned" to "unassigned"
- All workflows now call LogSQLServer for audit trail

---

## [1.7] - 2026-02-04

### Added
- Auto Assign 1.2 adds LogSQLServer sub-workflow for audit logging

### Changed
- LLM model upgraded to deepseek/deepseek-chat-v3.1
- Database migrated from Google Sheets to Microsoft SQL Server
- All ticket operations now use Microsoft SQL Server
- CoreAI 1.1 → 1.3, Auto Assign 1.1 → 1.2

---

## [1.6.2] - 2026-01-19

### Added
- Separated Auto Assign into dedicated sub-workflow
- Added 1-minute wait before ticket lookup (race condition fix)
- Unsend event detection and handling

### Changed
- Ticket detection now supports `แผนก` keyword
- All sub-workflows to version 1.1

---

## [1.6] - 2026-01-05

### Added
- Auto-assign feature via LINE reply detection
- Schedule Ticket Unassign workflow
- Architecture: Split into Main + Sub-Workflow pattern

---

## [1.5.1] - 2025-12-29

### Changed
- LLM from Groq to OpenRouter
- Email from Zimbra to DavMail

---

## [1.5] - 2025-12-23

### Added
- Initial release with AI classification
