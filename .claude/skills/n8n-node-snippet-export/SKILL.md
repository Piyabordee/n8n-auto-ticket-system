---
name: n8n-node-snippet-export
description: Export n8n workflow nodes as JSON snippets for GUI testing. When the user asks to export, extract, or show a specific node from a workflow JSON file, use this skill. The user pastes the snippet into n8n GUI to test changes themselves. If the result is wrong and the user provides a correction pattern, remember it for future similar cases. Trigger whenever the user wants to work with individual n8n nodes rather than full workflow files.
---
# n8n Node Snippet Export

Export individual n8n nodes as JSON snippets for GUI testing and iteration.

## When to Use

- User asks to "export", "extract", "show", or "get" a specific node from a workflow
- User wants to test node changes in n8n GUI without editing .json files
- User is iterating on node configuration and needs to compare/contrast
- User mentions a node name or node type from their workflows

## Workflow Pattern

```
1. READ the workflow JSON file
2. EXTRACT the requested node(s)
3. FORMAT as clean JSON snippet
4. USER tests in n8n GUI
5. IF wrong → USER provides correction → REMEMBER pattern
6. APPLY learned patterns to future similar requests
```

## How to Export a Node

### Step 1: Identify the workflow and node

From the user's request, determine:
- Which workflow file? (check `workflows/` directory)
- Which node(s)? (by name or by type)

Common workflow files:
- `workflows/Schedule Ticket Unclose.json`
- `workflows/Schedule Auto Open Ticket Unclose.json`
- `workflows/Auto Ticket.json`
- etc.

### Step 2: Read and extract

Use the `read_file` tool to read the workflow JSON, then parse and locate nodes:

```javascript
// Conceptual — the AI uses read_file tool, not fs
// Read: workflow.nodes is the array of all nodes

// Find node by name → workflow.nodes.find(n => n.name === 'Node Name')
// Find all nodes of a type → workflow.nodes.filter(n => n.type === 'n8n-nodes-base.httpRequest')
```

Extract the full node object — `parameters`, `id`, `name`, `type`, `typeVersion`, `position`.

### Step 3: Format the snippet

n8n GUI accepts a **mini-workflow JSON** — it needs the full node structure wrapped in `nodes` array, plus `connections`:

```json
{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 8 * * *"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.3,
      "position": [-64, -224],
      "id": "08f0260f-f037-44f2-938f-b6cb9ba2b919",
      "name": "Schedule Trigger"
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[]]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "c0ee9619a3de3f52e872fba900c2709ab5e62b555937f4f80d0077ae523c5c4c"
  }
}
```

> **Rule:** This is the exact format n8n GUI expects for paste. Keep `id`, `typeVersion`, `position` intact from the original node. `pinData` is always `{}`. `connections` maps each node name to its outputs — use `{ "main": [[]] }` for a single-output node.

### Step 4: Present to user

Always use this template when responding:

```
## Node: [Node Name]

**Type:** `n8n-nodes-base.[type]`
**Workflow:** `workflows/[filename].json`
**What this does:** [1-line description]
**Changes made:** [summary of what was modified]

### Paste this into n8n GUI:

```json
{
  "nodes": [ { "parameters": {...}, "type": "...", "typeVersion": ..., "position": [...], "id": "...", "name": "..." } ],
  "connections": { "Node Name": { "main": [[]] } },
  "pinData": {},
  "meta": { "instanceId": "..." }
}
```
```

## Pattern Memory

When the user says "not correct" or provides a correction:

1. **Remember the node type** (e.g., `scheduleTrigger`)
2. **Remember what was wrong** (e.g., wrong cron field structure)
3. **Remember the correct pattern** from the user's correction

**Storage:** Use the `memory` tool to persist patterns to `/memories/repo/n8n-node-patterns.md`. This ensures patterns survive across sessions and are shared with all agents working on this repo.

Format for stored patterns:
```markdown
## scheduleTrigger — cronExpression
- **Wrong:** Using `L` in cron expression — not valid standard cron
- **Correct:** Use `*` for "every day": `0 8 * * *`
- **Last seen:** 2026-06-01
```

Apply remembered patterns automatically for future exports of the same node type — check `/memories/repo/n8n-node-patterns.md` before every export.

## Important Caveats

### ⚠️ displayOptions

Many n8n node parameters are gated by `displayOptions` — they only appear in GUI when a parent field has a specific value (often the `operation` dropdown). If you export a parameter but the user's GUI doesn't show it, check:

1. Is the `operation` field set correctly in the parameters block?
2. Does the parameter depend on another field being a specific value?
3. Include the parent field (e.g., `"operation": "executeQuery"`) in the exported snippet so the dependent fields become visible.

### ⚠️ Node Dependencies

Some nodes can't be tested in isolation:

| Pattern | Issue |
|---------|-------|
| Webhook → Respond | Webhook node needs a matching Respond node, or it times out |
| SplitInBatches → aggregator | Code in loop body may reference `$node["parent"].data` |
| HTTP Request with `$node` refs | References data from previous nodes that don't exist in isolation |
| IF/Switch referencing `$json` | Needs actual input data shape to test conditions |

When exporting a node that depends on upstream data, also export a **Set node snippet** that simulates the expected input, so the user can test end-to-end.

## Common n8n Node Patterns

> These show the `parameters` block for each node type. Wrap them in the full paste format from Step 3 (`nodes`, `connections`, `pinData`, `meta`) when presenting to the user.

### Schedule Trigger (cronExpression — single or multiple)

> **Always validate cron at https://crontab.guru/** — n8n uses standard cron (5 fields: `minute hour day-of-month month day-of-week`). If the expression is invalid, crontab.guru will tell you why.

```json
{
  "rule": {
    "interval": [
      { "field": "cronExpression", "expression": "0 8 * * *" },
      { "field": "cronExpression", "expression": "0 18 * * *" }
    ]
  }
}
```

> `interval` is an array — can have one or many cron expressions.

### HTTP Request Node (POST with body)
```json
{
  "method": "POST",
  "url": "https://api.example.com/endpoint",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "Authorization", "value": "Bearer ..." },
      { "name": "Content-Type", "value": "application/json" }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": []
  },
  "options": {}
}
```

### Set Node (assign fields)
```json
{
  "assignments": {
    "assignments": [
      { "name": "fieldName", "value": "={{ $json.sourceField }}", "type": "string" }
    ]
  },
  "options": {}
}
```

### Code Node (JavaScript)
```json
{
  "jsCode": "// Your code here\nconst items = $input.all();\nfor (const item of items) {\n  item.json.newField = 'value';\n}\nreturn items;"
}
```

### Wait Node (timeout in minutes)
```json
{
  "resume": "timeInterval",
  "amount": 1,
  "unit": "minutes"
}
```

### Switch Node (routing rules)
```json
{
  "dataType": "json",
  "rules": {
    "rules": [
      {
        "conditions": {
          "options": { "caseSensitive": true, "typeValidation": "strict", "version": 3 },
          "conditions": [
            {
              "id": "condition-uuid",
              "leftValue": "={{ $json.field }}",
              "rightValue": "expected",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      }
    ]
  }
}
```

### Webhook Node
```json
{
  "httpMethod": "POST",
  "path": "my-webhook",
  "responseMode": "responseNode",
  "options": {}
}
```

### SQL Node (executeQuery)
```json
{
  "operation": "executeQuery",
  "query": "SELECT * FROM [Database].[dbo].[table] WHERE status = 'pending';"
}
```

### IF Node (conditions)
```json
{
  "conditions": {
    "options": { "caseSensitive": true, "typeValidation": "strict", "version": 3 },
    "conditions": [
      {
        "id": "uuid",
        "leftValue": "={{ $json.field }}",
        "rightValue": "value",
        "operator": { "type": "string", "operation": "equals" }
      }
    ],
    "combinator": "and"
  }
}
```

### Respond to Webhook Node
```json
{
  "respondWith": "json",
  "responseBody": "={{ $json }}"
}
```

### LINE Node (push message)
```json
{
  "resource": "pushMessage",
  "pushType": "text",
  "text": "ข้อความที่ต้องการส่ง"
}
```

## Error Handling

- **Node not found:** List available nodes in the workflow
- **Workflow not found:** List all workflows in `workflows/` directory
- **Invalid JSON:** Report syntax error with line number

## Testing in n8n GUI

After the user pastes the JSON snippet in n8n:
1. Paste the full snippet (with `nodes`, `connections`, `pinData`, `meta`) into n8n GUI
2. Click the node
3. Check if the change took effect
4. If wrong → tell me what needs to be corrected
5. I will remember the correct pattern for next time
