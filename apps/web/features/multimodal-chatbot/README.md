# Multi-Modal Chatbot

Product-facing capability: a production-ready chat workspace where a user can
attach an image or PDF and ask questions about that file without running an
indexing pipeline first.

## File Tree

```text
apps/web/features/multimodal-chatbot
|-- README.md
|-- demo-meta.ts
|-- server
|   `-- runtime.ts
`-- ui
    |-- convert-files-to-parts.ts
    |-- multimodal-chatbot-screen.tsx
    `-- multimodal-chatbot-workspace.tsx
```
