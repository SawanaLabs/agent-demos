# Agent UX Primitives

> Interaction patterns inspired by [beautifului.dev](https://www.beautifului.dev/) — recreated from scratch on our shared shadcn + ai-elements base. No source copied; design credit to the original author.

A copyable showcase of all 19 agent-UX primitives. The demo is UI-only — every component carries its own demo state so an evaluator can play with each pattern without any backend wiring.

## What it shows

- **Prompt bar** — @-mention source picker, /-command picker, model selector, removable chips, focus ring.
- **Loading state** — 3x3 pixel-grid loader (drive / dots / orbit variants) with shimmering label and elapsed timer.
- **Thinking trace** — expandable chain-of-thought rows with status icons, elapsed time, and step details.
- **Streaming text** — character-by-character streamed paragraph with a blinking caret and play / pause / reset controls.
- **Tool chips** — compact tool-call chips with pending / running / done / error status and expandable input/output.
- **Task rows** — staggered task rows; the active row expands mid-run and the last walks pending → failed → done.
- **Chat** — fixed-height tabbed panel where reasoning replies stream in after each send.
- **Approval card** — human-in-the-loop card with yes / no / edit actions that resolve in place.
- **Recommendation card** — confidence-metered suggestion with an alternatives drawer that promotes a new pick.
- **Context cards** — retrieved knowledge chunks with char counts and PDF / CSV source badges.
- **Code block** — line-by-line streamed code with hand-tinted tokens, line numbers, and live copy.
- **Diff table** — proposed edits play once: red flash → strikethrough removals → green added row.
- **Records table** — CRM grid with select-all checkbox, sortable headers, strength dots, and real links.
- **Filter table** — filter input + status chips that collapse rows in place.
- **Sidebar nav** — mini workspace nav with a sliding hover/active pill and an expandable group.
- **Search** — command search with live filtering, highlighted matches, clear, and empty state.
- **Insight cards** — headline metric + delta + hand-drawn SVG sparkline per card.
- **Fine-tune card** — inspector card where Radius / Opacity sliders scrub a live preview.
- **Selection actions** — row hover reveals a floating action bar (link / comment / overflow menu).

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
        ├── ux-chat.tsx / ux-chat-data.ts
        ├── ux-code-block.tsx
        ├── ux-context-cards.tsx
        ├── ux-diff-table.tsx / ux-diff-table-data.ts
        ├── ux-filter-table.tsx / ux-filter-table-data.ts
        ├── ux-fine-tune-card.tsx
        ├── ux-insight-cards.tsx
        ├── ux-loading-state.tsx
        ├── ux-prompt-bar.tsx / ux-prompt-bar-state.ts / ux-prompt-bar-types.ts
        ├── ux-recommendation-card.tsx / ux-recommendation-card-data.tsx
        ├── ux-records-table.tsx / ux-records-table-data.ts / ux-records-table-parts.tsx
        ├── ux-search.tsx
        ├── ux-selection-actions.tsx
        ├── ux-sidebar-nav.tsx / ux-sidebar-nav-data.ts
        ├── ux-streaming-text.tsx
        ├── ux-task-rows.tsx / ux-task-rows-data.ts / ux-task-rows-parts.tsx
        ├── ux-thinking-trace.tsx
        └── ux-tool-chips.tsx
```

Routes:

- `apps/web/app/demos/agent-ux-primitives/page.tsx`
- `apps/web/app/demos/agent-ux-primitives/loading.tsx`

No API route — this slice is intentionally UI-only.
