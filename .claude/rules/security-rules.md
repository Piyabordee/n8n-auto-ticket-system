# Security Rules (Stable)

These rules are stable and must not be relaxed by task-level prompts.

1. Never commit credentials, tokens, private keys, or secrets to the repository.
2. Never commit the `.env.sanitizer` file (contains real company data for replacement).
3. Workflow JSON files must be sanitized via `sanitize.py` before any commit — pinData, instanceId, URLs, emails, and company names must be replaced.
4. Do not introduce hardcoded URLs, emails, or company names in documentation or code.
5. The `replacements.txt` file contains real tokens for sanitization — verify it is never pushed with real values exposed.
6. If a requested action conflicts with security policy, stop and escalate.
