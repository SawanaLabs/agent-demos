# Eve Agent — service-triage demo

> Inspired by https://github.com/vercel/eve — Vercel's filesystem-first
> framework for durable AI agents (Apache-2.0, beta).

This slice shows an eve workspace member running beside the Next.js demo app.
The agent's logic lives in `agents/service-triage/agent/` at the repo root —
`agent.ts` picks the model, `instructions.md` is the system prompt, and
`tools/` holds `defineTool()` files the agent can call.

The frontend in `apps/web/features/eve-agent/ui/` uses `useEveAgent` from
`eve/react` with `defaultMessageReducer()`, which projects eve's stream into
UIMessage-compatible parts (text / reasoning / dynamic-tool) that render in
the existing AI Elements chat components.

## Layout

```
agent-demos/
├── agents/
│   └── service-triage/        # eve workspace member (no package.json)
│       └── agent/
│           ├── agent.ts       # defineAgent({ model })
│           ├── instructions.md
│           └── tools/
│               ├── lookup_service.ts
│               └── check_region.ts
├── apps/web/                  # Next.js frontend (peer service)
└── vercel.ts                  # withEve() — contributes the agent as a service
```

`withEve` discovers `agents/service-triage/` automatically and mounts its
transport at `/eve/service-triage/v1/*`. Vercel builds the frontend and the
agent as separate services inside one deployment.

## Local dev

```bash
pnpm install                # picks up the root `eve` dep
pnpm dev:eve                # eve dev --agent service-triage (terminal UI)
pnpm dev                    # turbo dev → next dev apps/web
```

For the full service graph locally (web + eve services routed together), use
`vercel dev` from the repo root.

## Adding another agent

```
agents/
├── service-triage/
└── research/                # new member — same shape
    └── agent/...
```

Then `useEveAgent({ agent: "research" })` in the UI. `withEve` mounts each
member at `/eve/<name>/v1/*`.
