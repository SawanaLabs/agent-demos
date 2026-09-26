# Eve Agent feature slice

This feature wires [vercel/eve](https://github.com/vercel/eve) (Apache-2.0,
beta) into the Agent Demos host shell as an interactive service-triage chat
that exercises eve's agent loop.

## Status

**WIP — roadmap.** The slice, route, and workspace are complete, but the
`eve` npm package could not be installed or verified when this was authored.
The demo renders and reports a setup issue until the package is installed;
flip `status` to `"ready"` in `demo-meta.ts` once it runs end-to-end.

## What it shows

Each turn runs eve's agent loop: the model plans a step, calls a tool,
observes the result, and repeats until it can answer. The demo keeps the task
deliberately small so the framework's shape stays visible:

- `lookup_service` — internal directory lookup (owner, tier, home region);
- `check_region` — fixture region health feed (`eu-west` is degraded);
- a question like "Is billing affected by an incident?" forces at least two
  loop steps before the answer.

## File tree

```text
eve-agent/
├── README.md
├── demo-meta.ts                # catalog entry (roadmap, WIP)
├── types.ts                    # EveAgentUIMessage + metadata
├── server/
│   ├── env-source.ts           # app env indirection
│   ├── env.ts                  # AI_GATEWAY_* contract + combined setup state
│   ├── eve.ts                  # package seam: lazy import + support probe
│   ├── eve-agent.ts            # PROVISIONAL adapter to the eve API surface
│   ├── tools.ts                # service directory + region health fixtures
│   ├── chat.ts                 # streamEveAgent → UI message stream response
│   ├── runtime.ts              # request validation + setup gating
│   └── *.test.ts
└── ui/
    ├── eve-agent-screen.tsx    # async server screen → runtime state
    ├── eve-agent-workspace.tsx # client chat workspace
    ├── message-parts.ts        # generic tool-part projection
    └── use-eve-agent.ts        # useDemoChat wiring
```

Plus thin entries: `app/demos/eve-agent/{page,loading}.tsx` and
`app/api/demos/eve-agent/route.ts`.

## Host adaptation

- Model access reuses the `AI_GATEWAY_*` contract (`AI_GATEWAY_API_KEY`,
  `AI_GATEWAY_CHAT_MODEL`); no new env vars. The resolved gateway
  `LanguageModel` instance is handed to eve's agent factory.
- The API route is wrapped by the repository's metered demo route.
- `server/eve.ts` is the only module that touches the `eve` package. It uses
  a lazy, non-literal `import()` so the slice builds before the package
  exists, and reports a setup issue when it does not resolve.
- `server/eve-agent.ts` holds every assumption about eve's API surface
  (agent factory export, run method, stream response conversion). Each
  assumption throws `EveSurfaceError` naming what failed — update that file
  only if the installed package differs.

## Required environment

```bash
AI_GATEWAY_API_KEY=...
# Optional override.
AI_GATEWAY_CHAT_MODEL=openai/gpt-5-mini
```

Plus the eve package itself:

```bash
pnpm --filter web add <confirmed eve package name>   # see github.com/vercel/eve
```

## Verification

```bash
pnpm --dir apps/web exec vitest run features/eve-agent
pnpm --dir apps/web typecheck
pnpm lint
pnpm --dir apps/web build
```
