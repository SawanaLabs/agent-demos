# Sandbox Agent

`sandbox-agent` is the first sandbox-backed prototype builder demo.

It gives one persistent Vercel Sandbox to each AI SDK chat id, lets the model
write HTML, CSS, and JavaScript files inside that workspace, and exposes the
result through AI Elements `WebPreview`.

## Feature slice

```text
apps/web/features/sandbox-agent/
├── demo-meta.ts
├── README.md
├── server/
│   ├── chat.ts
│   ├── model.ts
│   ├── official-tools.ts
│   ├── runtime.test.ts
│   ├── runtime.ts
│   ├── session.ts
│   ├── workspace.test.ts
│   └── workspace.ts
└── ui/
    ├── preview-state.ts
    ├── sandbox-agent-screen.tsx
    ├── sandbox-agent-workspace.test.tsx
    └── sandbox-agent-workspace.tsx
```

## Core contract

- One chat id maps to one named Vercel Sandbox.
- The official tool surface starts from `bash`, `readFile`, and `writeFile`.
- `startPreview` is the demo-specific bridge that turns generated static files
  into a live preview URL.
- The first shipped use case is a pricing landing page with an interactive
  calculator.
- The UI keeps conversation and preview in separate tabs, with `WebPreview`
  rendered only inside the dedicated preview surface.
