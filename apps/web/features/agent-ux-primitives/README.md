# Agent UX Primitives

A copyable showcase of agent-UX primitives rebuilt on top of the shared shadcn + ai-elements base. The demo is UI-only — every component carries its own demo state so an evaluator can play with each pattern without any backend wiring.

## What it shows

- **Prompt bar** — @-mention source picker, /-command picker, model selector, removable chips, focus ring.
- **Thinking trace** — expandable chain-of-thought rows with status icons, elapsed time, and step details.
- **Streaming text** — character-by-character streamed paragraph with a blinking caret and play / pause / reset controls.
- **Tool chips** — compact tool-call chips with pending / running / done / error status and expandable input/output.
- **Approval card** — human-in-the-loop card with yes / no / edit actions that resolve in place.

Each component lives under `ui/components/` and is self-contained: copy the file into a compatible Next.js + shadcn + ai-elements project and wire `onSubmit` / `steps` / `calls` to your own agent loop.

## Feature slice

```txt
apps/web/features/agent-ux-primitives
├── demo-meta.ts
├── README.md
└── ui
    ├── agent-ux-primitives-screen.tsx
    ├── agent-ux-primitives-workspace.tsx
    └── components
        ├── ux-approval-card.tsx
        ├── ux-prompt-bar.tsx
        ├── ux-streaming-text.tsx
        ├── ux-thinking-trace.tsx
        └── ux-tool-chips.tsx
```

Routes:

- `apps/web/app/demos/agent-ux-primitives/page.tsx`
- `apps/web/app/demos/agent-ux-primitives/loading.tsx`

No API route — this slice is intentionally UI-only.

## Attribution

Interaction patterns inspired by [beautifului.dev](https://www.beautifului.dev/) — recreated from scratch on our own primitives. No source copied. Design credit to the original author.
