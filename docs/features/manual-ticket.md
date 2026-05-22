# Manual Close Ticket

> Close assigned tickets manually via n8n form — enter Message ID, อาการ/ปัญหา, และการแก้ไขปัญหา.

---

## Overview

Manual Close Ticket คือ workflow สำหรับปิด ticket ด้วยตนเองผ่านฟอร์ม n8n เมื่อ IT staff ต้องการปิด ticket ที่ยัง `assigned` แต่ไม่ได้ตอบผ่าน LINE (เช่น แก้ไขเสร็จแล้วแต่ลืมตอบกลับ)

ผู้ใช้กรอกเพียง 3 ฟิลด์:
1. **messageId** — หา ticket ที่จะปิด (ต้อง `status = 'assigned'`)
2. **close_cause** — อาการ/ปัญหา
3. **close_reason** — การแก้ไขปัญหา

Workflow จะเรียก CoreAI แบบ `action: update` เพื่อ re-classify ก่อนส่งอีเมล `#close` ไปยัง Spiceworks — ทำงานคล้าย Auto Close Ticket แต่เริ่มจากฟอร์มแทน LINE message

---

## Context Snapshot

- **Workflow ID**: (assigned on import)
- **Type**: Form Trigger (n8n built-in form with URL)
- **Version**: 1.0.0
- **File**: `workflows/Manual Ticket.json`
- **Dependencies**: Auto Ticket CoreAI (re-classification), LogSQLServer (audit log), Microsoft SQL, DavMail SMTP

---

## When to Read This

- ทำความเข้าใจการปิด ticket ด้วยตนเองผ่านฟอร์ม
- แก้ไขฟิลด์ฟอร์ม หรือเปลี่ยน email template
- Debug ว่าทำไมฟอร์มปิด ticket ไม่ทำงาน

### Read With

- `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]] — auto close ผ่าน LINE message
- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — CoreAI re-classification
- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — ticket table schema
- `docs/features/audit-logging.md` [[docs/features/audit-logging]] — LogSQLServer audit trail

---

## Flow

```
On form submission (n8n Form URL)
  │  Input: messageId, close_cause, close_reason
  │
  ├─► Find Ticket (SQL)
  │     SELECT ticket WHERE message_id = ? AND status = 'assigned'
  │     ถ้าไม่เจอ → stop
  │
  ├─► If notEmpty
  │     ตรวจสอบว่าเจอ ticket
  │
  ├─► Match IT Team (SQL)
  │     SELECT it_team WHERE userId = ticket.assigned_to
  │
  ├─► Call Auto Ticket CoreAI
  │     action: update
  │     raw_text/clean_text = ticket เดิม + "การแก้ไขปัญหา: {close_reason}"
  │     → CoreAI re-classify + อัพเดท ticket
  │
  ├─► Find Ticket After CoreAI (SQL)
  │     ดึง ticket อีกรอบเพื่อเอา email_body ที่อัพเดทแล้ว
  │
  ├─► Send email To DavMail
  │     email_body + #set สาเหตุ, #set การแก้ไขปัญหา, #close
  │
  ├─► Update Ticket Status (SQL)
  │     UPDATE status = 'closed', close_cause, close_reason, close_time_minute
  │
  └─► Call LogSQLServer
        Audit log (action_type: CLOSE)
```

---

## Nodes (9 total)

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | On form submission | formTrigger | n8n form — 3 ฟิลด์ (messageId, close_cause, close_reason) |
| 2 | Find Ticket | microsoftSql | ค้นหา ticket ที่ `status = 'assigned'` |
| 3 | If notEmpty | if | ตรวจสอบว่าเจอ ticket หรือไม่ |
| 4 | Match IT Team | microsoftSql | หา IT staff จาก `assigned_to` |
| 5 | Call Auto Ticket CoreAI | executeWorkflow | เรียก CoreAI แบบ `action: update` — re-classify |
| 6 | Find Ticket After CoreAI | microsoftSql | ดึง ticket อีกรอบหลัง CoreAI อัพเดท |
| 7 | Send email To DavMail | emailSend | ส่งอีเมล `#close` พร้อมสาเหตุ/การแก้ไข |
| 8 | Update Ticket Status | microsoftSql | UPDATE `status = 'closed'` + close fields |
| 9 | Call LogSQLServer | executeWorkflow | Audit log — `action_type: CLOSE` |

---

## Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | text | ✅ | Message ID ของ ticket ที่จะปิด |
| `close_cause` | textarea | ✅ | อาการ/ปัญหา (เช่น คอมเปิดไม่ติด หน้าจอดับ) |
| `close_reason` | textarea | ✅ | การแก้ไขปัญหา (เช่น เปลี่ยน RAM ใหม่) |

### Form Completion

หลัง submit ฟอร์มแสดง: **"ปิด Ticket สำเร็จ ✓"**

---

## Comparison: Manual Close vs Auto Close

| ขั้นตอน | Auto Close Ticket | Manual Close Ticket |
|---------|------------------|-------------------|
| Trigger | LINE message มีคำว่า "การแก้ไขปัญหา" | n8n form (URL) |
| Input | `quotedMessageId`, `clean_text`, `userId` | `messageId`, `close_cause`, `close_reason` |
| สาเหตุ/การแก้ไข | ดึงจาก regex บน `clean_text` | กรอกเป็นฟิลด์แยกในฟอร์ม |
| CoreAI | ไม่เรียก | เรียก `action: update` เพื่อ re-classify |
| Email | ใช้ `email_body` จาก ticket เดิม | ใช้ `email_body` จาก ticket หลัง CoreAI อัพเดท |
| SQL UPDATE | เหมือนกัน (`status`, `close_cause`, `close_reason`, `close_time_minute`) | เหมือนกัน |

---

## Email Body Format

ส่งอีเมล `#close` ไปยัง Spiceworks พร้อม commands:

```
{email_body จาก Find Ticket After CoreAI}
#set วันที่ปิด Ticket={dd-MM-yyyy}
#set เวลาปิด Ticket={HH:mm:ss}
#assign {email_spiceworks จาก Match IT Team}
#set สาเหตุ={close_cause จากฟอร์ม}
#set การแก้ไขปัญหา={close_reason จากฟอร์ม}
#close
```

---

## SQL Queries

### Find Ticket (เฉพาะ assigned)

```sql
SELECT TOP 1 *
FROM [YourDatabase].[dbo].[ticket]
WHERE message_id = N'{messageId}'
  AND status = 'assigned';
```

### Update Ticket Status

```sql
UPDATE [YourDatabase].[dbo].[ticket]
SET status = 'closed',
    close_cause = N'{close_cause}',
    close_reason = N'{close_reason}',
    updated_date = GETDATE(),
    updated_by = N'{userId}',
    close_time_minute = CASE
    WHEN DATEDIFF(MINUTE, created_date, GETDATE()) - 1 < 0 THEN 0
    ELSE DATEDIFF(MINUTE, created_date, GETDATE()) - 1
END
WHERE message_id = N'{messageId}';
```

---

## CoreAI Integration

เรียก CoreAI ด้วย `action: update` และส่งข้อมูล:

| Input | Value |
|-------|-------|
| `action` | `update` |
| `raw_text` | `{ticket.clean_text}\nการแก้ไขปัญหา: {close_reason}` |
| `clean_text` | `{ticket.clean_text}\nการแก้ไขปัญหา: {close_reason}` |
| อื่นๆ | ดึงจาก ticket เดิม (`fromuser`, `chatname`, `groupid`, `userid`) |

CoreAI จะ re-classify ticket และอัพเดท `email_body` ใน DB — เพื่อให้ Spiceworks ได้รับข้อมูลที่ถูกต้อง

---

## Usage

1. Import `workflows/Manual Ticket.json` into n8n
2. Configure credentials:
   - **Microsoft SQL** — ticket + it_team queries
   - **SMTP (DavMail)** — email sending
3. Verify workflow IDs:
   - Auto Ticket CoreAI: `vnzG9J1ipCdgk5Q4`
   - LogSQLServer: `q3ybqMcKYHUTu4qg`
4. **Activate** the workflow — n8n จะสร้าง form URL
5. แชร์ form URL ให้ IT staff
6. กรอก Message ID, อาการ/ปัญหา, การแก้ไขปัญหา → กด submit

---

## Decision Trace

- **Decision**: เรียก CoreAI แบบ `action: update` ก่อนส่งอีเมล
- **Why**: ให้ CoreAI ได้ re-classify ticket พร้อมอัพเดท `email_body` ใหม่ก่อนปิด — เพื่อให้ Spiceworks มีข้อมูลที่ถูกต้อง (รวมการแก้ไขปัญหาที่เพิ่มเข้ามา)
- **Impact**: ใช้เวลาเพิ่มขึ้น (CoreAI call) แต่ได้ classification ที่ถูกต้องกว่า

- **Decision**: แยกฟิลด์ `close_cause` / `close_reason` แทน regex บน clean_text
- **Why**: Auto Close Ticket ใช้ regex แยกสาเหตุ/การแก้ไขจาก clean_text แต่ Manual form ไม่มี clean_text — ผู้ใช้กรอกเองจึงแยกฟิลด์ตรงๆ ได้ชัดกว่า
- **Impact**: 3 ฟิลด์ฟอร์ม ง่ายต่อการกรอก ไม่ต้องจำ format

- **Decision**: ค้นหาเฉพาะ `status = 'assigned'`
- **Why**: ไม่ควรปิด ticket ที่ `pending` (ยังไม่มีคนรับ) หรือ `closed` แล้ว
- **Impact**: ถ้ากรอก messageId ของ ticket ที่ไม่ใช่ `assigned` → workflow หยุดที่ If notEmpty

---

## Related Files

- `workflows/Manual Ticket.json` — Workflow JSON
- `docs/features/auto-close-ticket.md` [[docs/features/auto-close-ticket]] — Auto close ผ่าน LINE
- `docs/features/auto-ticket-coreai.md` [[docs/features/auto-ticket-coreai]] — CoreAI classification
- `docs/architecture/data-model.md` [[docs/architecture/data-model]] — Ticket table schema
- `docs/features/audit-logging.md` [[docs/features/audit-logging]] — LogSQLServer audit trail
