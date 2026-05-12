# n8n Workflow Editing Rules

Rules specific to working with n8n workflow JSON files.

1. Never edit workflow JSON files manually unless specifically instructed — use n8n editor and re-export.
2. After importing an updated workflow, verify the workflow ID matches the documented ID in `docs/features/` before activating.
3. When modifying AI prompts (Core Agent, Find Branch, Find Sub Category), test with sample inputs before deploying to production.
4. The `Wait` node in Auto Assign (1 minute) exists to prevent race conditions — do not reduce this timeout without understanding the ticket creation latency.
5. Credential IDs in workflow JSON (e.g., `line api account 2`) are safe — they reference n8n's internal credential store, not actual secrets.
6. `pinData` in workflow JSON may contain real data from testing — always clear or sanitize before committing.
