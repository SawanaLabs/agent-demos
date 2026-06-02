# Object Generation

Generates a structured object from multimodal inputs and renders the live object inside the assistant message.

The completed-run action regenerates the object from the same prompt and attachments. It intentionally creates a new recorded output so reviewers can compare reruns instead of treating the action as a replay of one frozen record.

## File Tree

```text
object-generation/
  demo-meta.ts
  README.md
  record.ts
  schema.ts
  server/
    object-generation-records.ts
    runtime.ts
    runtime.test.ts
  ui/
    object-generation-result-card.tsx
    object-generation-screen.tsx
    object-generation-workspace.tsx
    convert-files-to-object-generation-inputs.ts
```
