# Trace and Eval Agent

Business purpose: provide a production-ready, copyable trace and eval agent demo for developers building agent products. The intended copy unit is all demo-related code: feature module, thin route/API entries, setup-error handling, core tests, and local docs. A downstream team should be able to copy it, adapt the research scenario, replace the rubric, and build their own user-facing trace/eval system with limited rewiring.

What this demo does:

- Runs a real AI SDK 6 `streamText` research flow through AI Gateway.
- Uses the official OpenAI `web_search` tool through the AI Gateway OpenAI-compatible endpoint for live web research.
- Keeps research turns intentionally tight with low reasoning effort, low text verbosity, and a two-search cap in the system prompt.
- Derives a conversation-level trace and eval snapshot from the current UI message stream.
- Derives a normalized single-run `AgentRunRecord`, then builds trace/eval state from that record.
- Evaluates the expected path from stable `UIMessage[]` evidence: research request, search use, visible sources, synthesized answer, and uncertainty handling when evidence is weak.
- Carries token usage through AI SDK message metadata, then displays it in trace/eval context.
- Treats token usage as an observability signal, not as a pass/fail quality gate.
- Runs a structured LLM-as-judge evaluation after completed research answers.
- Shows setup failures early so missing Gateway config fails loudly.
- Keeps scenario-specific research behavior separate from reusable trace, token usage, and eval plumbing.

Production contract:

- Preserve the official AI SDK source core: `streamText`, `experimental_telemetry`, `messageMetadata`, AI SDK Testing mocks, and the OpenAI `web_search` tool.
- Keep deterministic eval checks as the first quality gate.
- Keep the architecture one-way: `agent runtime -> AgentRunRecord -> deterministic gate / judge -> eval UI`.
- Treat trace/eval as a passive observer. It must not rewrite agent message history or block normal chat just because a run is skipped or fails evaluation.
- Keep replay history narrower than trace history. Follow-up model turns should replay only safe conversational content, while trace/eval continues to inspect the full UI message stream with tool calls, sources, and failures.
- Use normalized `0-1` scores as the machine contract for both deterministic gate summaries and LLM judge dimensions. UI may render percentages, but copied production code should store and compare `0-1` scores.
- Convert `0-1` scores to percentages only at the UI boundary.
- Keep token usage visible in trace/meta context, but do not use token budget as a deterministic failure or judge hard failure.
- Keep expected-path checks coarse enough for production reuse. Do not depend on hidden reasoning, exact web-search payloads, or a rigid tool sequence when `UIMessage[]` only exposes higher-level evidence.
- Use single-run evaluation as the primary contract. Session-level reporting can aggregate these runs later, but the copied demo should make each user turn independently traceable and judgeable.
- Classify turns before scoring: `evaluated`, `skipped`, or `failed-run`. Casual chat should be `skipped`; provider or output failures should stay visible as `failed-run`; neither should poison later chat turns.
- Keep `failed-run` as a visible operational outcome in trace/eval surfaces, but do not mutate agent history from eval code just to hide or repair the failed turn.
- Split result evaluation into two stages: deterministic gate and LLM judge. Hard gate failures are part of the deterministic gate; the final eval judgment combines deterministic failures with the judge's quality scores and action.
- Keep deterministic failures visually separate from quality scores so a path or structure failure does not make every qualitative dimension look bad.
- Treat eval action as a remediation recommendation: `ready` accepts the run, `needs-revision` asks for answer editing, `rerun-research` asks the agent to gather better evidence, and `investigate-failure` points to provider, tool, metadata, or eval infrastructure debugging.
- Default action thresholds: `ready` at `>= 0.8`, `needs-revision` from `0.6` to `< 0.8`, `rerun-research` for research path or evidence hard failures, and `investigate-failure` for provider, tool, metadata, or eval infrastructure failures.
- Keep five LLM judge dimensions: answer usefulness, source faithfulness, evidence sufficiency, uncertainty handling, and run discipline. `run-discipline` means expected-path adherence, not token budget.
- Keep the LLM-as-judge eval pipeline structured. The judge evaluates both the final answer and the full run process, consumes the prompt, answer, sources, tool trace, usage, deterministic checks, and rubric, then returns structured `0-1` score, rationale, and recommended action.
- Keep deterministic failures visible alongside judge output so hard failures cannot be hidden by a broad qualitative score.
- Prefer AI Elements primitives for reusable AI-native surfaces, including reasoning, tool output, sources, and test/eval-style result displays.

Feature tree:

```text
trace-eval-agent/
  demo-meta.ts
  README.md
  model/
    trace-eval-chat-history.ts
    trace-eval-chat-history.test.ts
    trace-eval-judge.ts
    trace-eval-judge.test.ts
    trace-eval-snapshot.ts
    trace-eval-snapshot.test.ts
  server/
    chat.test.ts
    chat.ts
    env-source.ts
    env.test.ts
    env.ts
    evaluation.test.ts
    evaluation.ts
    model.ts
    runtime.ts
  ui/
    trace-eval-agent-assistant-message.tsx
    trace-eval-agent-eval-panel.tsx
    trace-eval-agent-model.ts
    trace-eval-agent-runtime-sidebar.tsx
    trace-eval-agent-screen.tsx
    trace-eval-agent-trace-panel.tsx
    trace-eval-agent-workspace.tsx
    use-trace-eval-agent-chat.ts
    use-trace-eval-judge.ts
```

Judge observability:

- `server/evaluation.ts` exposes both a JSON evaluator and an object-stream evaluator.
- `app/api/demos/trace-eval-agent/evaluate/stream/route.ts` is the UI-facing stream route.
- `model/trace-eval-judge-progress.ts` derives user-visible progress from the partial streamed object.
- `ui/use-trace-eval-judge.ts` consumes the object stream through `experimental_useObject` and keeps judge progress separate from chat state.
- `model/trace-eval-chat-history.ts` keeps follow-up turns replay-safe by stripping non-replayable parts before `convertToModelMessages()`.

Future registry distribution:

```bash
pnpm dlx shadcn@latest add https://your-registry.example.com/r/trace-eval-agent.json
```
