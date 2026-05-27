# Skills Builder Agent

`skills-agent` turns the AI SDK skills guide into a web demo that stays close to the source core:

- `ToolLoopAgent`
- runtime skill discovery from repo-local `.agents/skills`
- on-demand official `skill` tool via `experimental_createSkillTool`
- `@vercel/sandbox` for filesystem and command execution

## Business shape

This demo is an idea-to-skill workspace.

The first skill, `grill-with-docs`, pressures a rough idea until the project language and context are precise. The second skill, `skill-creator`, turns that aligned context into a reusable `SKILL.md` draft.

## Feature slice

```text
apps/web/features/skills-agent/
├── README.md
├── demo-meta.ts
├── server/
│   ├── chat.ts
│   ├── env-source.ts
│   ├── env.test.ts
│   ├── env.ts
│   ├── local-skill-catalog.ts
│   ├── model.ts
│   ├── official-tools.ts
│   ├── runtime.test.ts
│   ├── runtime.ts
│   ├── sandbox.ts
│   ├── skill-catalog.test.ts
│   └── skill-catalog.ts
└── ui/
    ├── skills-agent-screen.tsx
    ├── use-skills-agent-chat.ts
    └── skills-agent-workspace.tsx
```

## Contracts

- Missing `AI_GATEWAY_API_KEY` blocks chat requests with an explicit setup error.
- Missing Vercel Sandbox auth or project binding blocks chat requests with an explicit setup error.
- The feature expects `grill-with-docs` and `skill-creator` under `.agents/skills`.
- The agent starts from the visible skill catalog and must call the official `skill` tool before it can use full skill instructions.
