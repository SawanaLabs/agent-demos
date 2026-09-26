# Multi-Agent Explorer feature slice

A multi-agent orchestration demo built directly on Vercel AI SDK primitives (`generateObject`, `streamText`, `tool`, `createUIMessageStream`). A lead agent decomposes a research question, fans subtopics out to parallel explorer subagents, then synthesizes a cited report — with the whole fan-out visible in the chat stream.

The pattern is the classic **lead → fan-out → collect → synthesize** shape, in the spirit of the multi-agent designs discussed in the [Vercel community thread on multi-agent support](https://community.vercel.com/t/vercel-ai-sdk-multi-agent-support-for-complex-agentic-workflows/35594/7): there is no official multi-agent primitive in the AI SDK, so this slice implements the orchestration layer by hand instead of reaching for the OpenAI Agents SDK or LangGraph. Staying AI-SDK-native keeps the slice inside this repository's conventions: one UI message stream, AI Elements rendering, the shared AI Gateway env contract, and no new dependencies.

## Orchestration design

1. **Plan** — the lead calls `generateObject` to turn the user's question into 2–4 disjoint subtopics (`research_plan` schema).
2. **Fan-out** — each subtopic becomes an **explorer subagent**: an independent `streamText` loop with isolated context and two narrow tools (`search_notes`, `read_note`) over a deterministic in-repo corpus. Explorers run concurrently via `Promise.all`.
3. **Collect** — each explorer's `fullStream` is folded into an `ExplorerSnapshot` (tool calls, outputs, status, findings) and pushed to the client as updating `data-explorer` parts.
4. **Synthesize** — the lead `streamText`s the final report from the compact findings and it is merged into the same UI message stream via `writer.merge`.

Everything the UI needs to show the multi-agent shape travels as custom `data-*` parts on the single assistant message: `data-orchestration-phase` (planning/exploring/synthesizing/done), `data-research-plan`, and one `data-explorer` part per subagent (updates in place by part id).

## File tree

```
features/multi-agent-explorer/
├── demo-meta.ts                  # catalog entry
├── types.ts                      # zod contract shared by server stream + UI
├── server/
│   ├── env.ts                    # AI Gateway contract (AI_GATEWAY_*)
│   ├── env-source.ts
│   ├── corpus.ts                 # deterministic agent-design knowledge base
│   ├── tools.ts                  # search_notes + read_note explorer tools
│   ├── orchestrator.ts           # plan / explorer run / synthesis prompt
│   ├── chat.ts                   # createUIMessageStream orchestration entry
│   ├── runtime.ts                # request validation + setup state
│   └── *.test.ts
└── ui/
    ├── multi-agent-explorer-screen.tsx
    ├── multi-agent-explorer-workspace.tsx
    ├── orchestration-view.tsx    # phase steps, plan card, explorer task cards
    ├── message-parts.ts          # message → projection for rendering
    └── use-multi-agent-explorer.ts
```

Thin route entries:

- `app/demos/multi-agent-explorer/page.tsx` (+ `loading.tsx`)
- `app/api/demos/multi-agent-explorer/route.ts` (wrapped by `createMeteredDemoRoute`)

## Design choices

- **Why not OpenAI Agents SDK / LangGraph?** The demo's job is to show that a lead-subagent loop is a thin orchestration layer over `streamText`/`generateObject`, not a framework. `@openai/agents` already exists in the repo for its own demo; duplicating it here would hide the mechanics the evaluator is supposed to see.
- **Mock corpus over live search.** Explorers search a deterministic agent-design corpus so runs are reproducible and the demo never depends on external retrieval. Swapping `searchCorpusNotes` for a real backend is a one-function change.
- **Per-explorer error containment.** One failed explorer marks its own card as failed and is reported to the lead as `Explorer failed: <reason>`; the synthesis still completes. Planning or synthesis failures propagate to the stream error channel instead.
- **Data parts over nested message streams.** Each explorer reports progress through one self-updating `data-explorer` part rather than merging subagent text streams into the assistant message, which keeps the lead's report text as the only narrative.

## Required environment

```bash
AI_GATEWAY_API_KEY=...
# Optional; any gateway model that supports tools + structured output works.
AI_GATEWAY_CHAT_MODEL=openai/gpt-5-mini
```

## Verification

```bash
pnpm --dir apps/web exec vitest run features/multi-agent-explorer
pnpm --dir apps/web typecheck
pnpm check
pnpm build
```
