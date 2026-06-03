# Object Generation

Generates a structured object from multimodal inputs and renders the live object inside the assistant message.

The completed-run action regenerates the object from the same prompt and attachments. It creates a fresh streamed object instead of replaying one frozen result.

## File Tree

```text
object-generation/
  demo-meta.ts
  README.md
  schema.ts
  server/
    runtime.ts
    runtime.test.ts
  ui/
    object-generation-result-card.tsx
    object-generation-screen.tsx
    object-generation-workspace.tsx
    convert-files-to-object-generation-inputs.ts
```
