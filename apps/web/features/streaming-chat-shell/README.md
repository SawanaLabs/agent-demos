# Streaming Chat Shell

Developer-facing capability: a reusable chat runtime workspace that keeps the
main AI SDK `useChat` path intact while exposing two common production
extensions:

- feature-local request metadata in the JSON body
- a replayable custom SSE endpoint for debugging, inspection, and secondary
  developer consumers

## Feature Slice

```txt
apps/web/features/streaming-chat-shell
├── README.md
├── demo-meta.ts
├── server
│   ├── contract.ts
│   ├── events.test.ts
│   ├── events.ts
│   ├── prompt.ts
│   ├── runtime.test.ts
│   └── runtime.ts
└── ui
    ├── stream-event-parser.test.ts
    ├── stream-event-parser.ts
    ├── streaming-chat-shell-screen.tsx
    └── streaming-chat-shell-workspace.tsx
```

Thin entries live in:

```txt
apps/web/app/api/demos/streaming-chat-shell/route.ts
apps/web/app/api/demos/streaming-chat-shell/events/route.ts
apps/web/app/demos/streaming-chat-shell/page.tsx
```
