---
name: n8n-node-patterns
description: Learned n8n node behavior patterns from real workflow debugging sessions
metadata:
  type: reference
---

## scheduleTrigger — cronExpression with L (last day of month)

- **Wrong:** Using `L` in cron expression — not valid in n8n (standard 5-field cron)
- **Correct:** Use `0 8,18 * * *` (daily 08:00 + 18:00) + Code node to check if today is last day
- **Last seen:** 2026-06-01

## Code node — return [] kills downstream

- **Problem:** `return []` causes downstream nodes (like IF) to have no input data → silent stop
- **Correct:** Always return `{ someFlag }` object, let IF/Switch route based on value
- **Last seen:** 2026-06-01

## Code node — new Date() vs input data

- **Problem:** Code node's `new Date()` uses n8n server time, NOT from input data passed from previous node
- **Fix:** If you need date from input, parse from `$json.timestamp` or use `$now` expression before code node
- **Last seen:** 2026-06-01