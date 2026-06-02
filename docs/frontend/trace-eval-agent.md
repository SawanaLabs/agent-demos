---
title: Trace and Eval Agent
description: Stable research-agent, trace-panel, and eval-pipeline conventions for the trace-eval-agent demo.
updateAt: 2026-06-02
---

# Trace and Eval Agent

## Scope

- Covers the `trace-eval-agent` demo under `apps/web/features/trace-eval-agent`.
- Covers the live research workflow, the lower trace/eval surface, and the right-side meta panel.
- Covers the message metadata contract and single-run record that feed trace/eval scoring.
- Covers the copyable production contract for trace, token usage, deterministic eval, and LLM-as-judge eval.

## Business Positioning

- The primary audience is developers building production agent products who want a copyable trace and eval foundation.
- Treat future developers copying this demo into their own projects as the main user. The intended copy unit is all demo-related code, including the feature module, thin route/API entries, core tests, setup-error handling, and local docs.
- Hold this demo to the same standard as `skills-agent`: preserve the official AI SDK source core first, then productize around it.
- Treat this demo as a production-ready reference slice: another team should be able to copy it, adapt the research scenario, replace the rubric, and build their own trace/eval system without redesigning the architecture.
- The demo's product claim is that agent quality can be surfaced inside the user-facing workspace, not only in backend observability tools. The visible trace/eval panel is part of the product experience.
- The research-agent scenario is the carrier use case. Keep implementation choices reusable for other agent domains, including support, review, workflow, and internal operations agents.
- Treat the chat agent as the primary product surface. Trace and eval are passive observers layered onto the agent run, and they must not degrade normal chat behavior.
- Token usage, session trace, deterministic eval, and an LLM-as-judge eval pipeline are part of the expected product surface.
- Token usage is an observability signal, not a quality gate. Keep it visible for cost and run-size inspection, but do not fail the deterministic gate or judge hard failures because a run used more tokens.
- Treat this demo's QA bar as mechanism integrity: a run must be traceable, the deterministic gate must evaluate structural evidence, the LLM judge must receive the full judge context, and the UI must show the result. Do not classify one live LLM answer or one live LLM judge score as a stable product defect when the trace/eval mechanism worked and the remaining concern is model judgment quality.

## Domain Language

- **Session trace**: The execution summary derived from the current `UIMessage[]`, including request, model run, search tool usage, sources, and usage metrics.
- **Single run**: One user turn plus the assistant result generated for that turn. This is the primary trace/eval unit for the demo. Session-level views may aggregate runs later, but they must not redefine the single-run contract.
- **Agent run record**: The normalized single-run payload derived from agent output and metadata. It is the only input contract that deterministic gate and LLM judge should consume.
- **Run outcome**: The eval-orchestrator classification for one run: `evaluated`, `skipped`, or `failed-run`. This classification decides whether judge work starts and what the UI should render.
- **Deterministic eval gate**: The conversation-level checks that score structural invariants such as prompt presence, required tool usage, source coverage, answer shape, latency, finish reason, and error state.
- **Eval score**: A normalized `0-1` number used for both deterministic gate scores and LLM judge scores. UI should render the primary score as a percentage for readability, but model, API, docs, and tests must treat `0-1` as the canonical score contract.
- **LLM-as-judge eval pipeline**: The model-backed scoring stage that reviews the prompt, final answer, sources, trace, token usage, and rubric to return structured `0-1` quality scores, rationale, and recommended action.
- **Judge scope**: The accepted eval boundary where the LLM judge scores both the final answer and the full run process, while deterministic checks remain separate hard constraints.
- **Eval action**: The product-level remediation recommendation produced from deterministic gate results plus LLM judge quality scores. It tells the user or downstream system how to handle a result that is not ready.
- **Expected path**: The high-level agent route that can be stably inferred from `UIMessage[]`: user research request, required search for current or comparative research, visible sources, source coverage, synthesized answer, and explicit uncertainty when evidence is weak.
- **Hard gate checks**: The deterministic gate checks that block an overall pass when they fail: final answer exists, at least two visible sources are present for grounded research, the answer covers the user request, and the answer has a research output shape such as comparison, recommendation, or decision.
- **Research run metadata**: Assistant message metadata carrying run id, model id, timing, finish reason, search tool name, and total usage.
- **Copied feature unit**: All `trace-eval-agent` demo-related code that a downstream developer is expected to copy before adapting scenario-specific policy.

## Current Subdomain Docs

- Keep `apps/web/features/trace-eval-agent/README.md` as the feature-local overview and file map. Put durable UI and contract rules here in `docs/`, not only in the README.
- Treat `apps/web/features/trace-eval-agent`, `apps/web/app/demos/trace-eval-agent`, and `apps/web/app/api/demos/trace-eval-agent` as one copied feature unit. Keep route/API files thin so copied behavior stays inside the feature module.
- Preserve copy-paste ergonomics. Scenario-specific research logic belongs in small model/server/UI modules so downstream developers can replace the scenario without rewriting trace, token usage, and eval plumbing.
- Keep the architecture one-way:
  - `Agent runtime`: runs chat, tools, and streaming.
  - `Trace adapter`: derives the normalized `AgentRunRecord`.
  - `Eval orchestrator`: decides `skipped`, `failed-run`, or `evaluated`, then runs deterministic gate and optional judge.
  - `Eval UI`: renders trace/eval state without mutating chat history.
- The trace/eval stack is an observer system. It may read run output, derive normalized records, and render product guidance. It must not rewrite, delete, or filter the agent's business message history to make evaluation easier.
- The left column stays split into two stacked work areas: research conversation on top, trace/eval panels below. The right column is reserved for meta and suggestions.
- The top conversation is still the primary user reading path. Trace and eval stay visible below it without taking over the first interaction surface.
- Preserve these official source-core references before changing architecture: AI SDK Telemetry (`https://ai-sdk.dev/docs/ai-sdk-core/telemetry`), Track Agent Token Usage (`https://ai-sdk.dev/cookbook/next/track-agent-token-usage`), AI SDK structured outputs (`https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data`), AI SDK Testing (`https://ai-sdk.dev/docs/ai-sdk-core/testing`), OpenAI web search (`https://ai-sdk.dev/providers/ai-sdk-providers/openai#web-search`), and AI Elements reasoning/tool/sources/test-results components.
- `apps/web/features/trace-eval-agent/server/chat.ts` must use the official OpenAI `web_search` tool through the AI Gateway OpenAI-compatible endpoint. Do not replace it with a custom search wrapper unless the repo deliberately changes the source core.
- `apps/web/features/trace-eval-agent/server/chat.ts` currently uses AI SDK `streamText` plus `toUIMessageStreamResponse()` for the research loop. Keep this shape unless the upstream AI SDK guidance for built-in search tools changes.
- `apps/web/features/trace-eval-agent/model/trace-eval-chat-history.ts` owns the replay-safe chat projection before `convertToModelMessages()`. Replay only safe user/system content plus assistant final-answer text. Do not replay `reasoning`, `tool-*`, or `source-*` parts into the next model turn.
- `apps/web/features/trace-eval-agent/server/chat.ts` must stream both reasoning and sources to the client with `sendReasoning: true` and `sendSources: true`.
- Keep the research loop bounded for interactive UX. The current contract uses low reasoning effort, low text verbosity, and prompt-level guidance that caps the agent at two `web_search` calls per answer.
- Research-run metadata should be attached through `messageMetadata` on the AI SDK stream response, not through ad hoc client timers or local-only bookkeeping.
- Token usage is a product signal. Keep total usage in assistant message metadata, show it in the trace, and include it in eval inputs as context.
- Do not treat token usage as a deterministic eval check, judge hard failure, or standalone score penalty. The judge may mention overly long or inefficient runs in rationale when it affects user experience, but token count alone is not a failure condition.
- Keep the agent message history as the business truth source. If a turn is not suitable for evaluation, mark the derived run as `skipped` or `failed-run`; do not patch or prune agent history inside trace/eval logic.
- Split replay history from observer history. The model-facing replay history may be narrower for stability, but trace/eval must continue to observe the full UI message stream so tool calls, sources, and failures stay inspectable.
- The deterministic gate and LLM judge must consume derived run data, not raw chat state with UI-only repair logic mixed in.
- The deterministic eval gate returns factual check status plus a normalized `0-1` score. Passed and failed checks remain the source of truth; the score is a compact summary for display, thresholds, and trend aggregation.
- UI score displays should convert `0-1` scores to percentages at the view boundary only. Do not store or pass percentage scores through model/server contracts.
- Accepted eval split: deterministic checks enforce hard run invariants; the LLM judge scores qualitative product dimensions across both the answer and the run process.
- The LLM judge should keep five dimensions separate enough for production adaptation:
  - `answer-usefulness`: whether the final answer resolves the user's request.
  - `source-faithfulness`: whether conclusions stay faithful to visible sources.
  - `evidence-sufficiency`: whether the visible evidence is enough to support the comparison or recommendation.
  - `uncertainty-handling`: whether weak, conflicting, stale, or incomplete evidence is named clearly.
  - `run-discipline`: whether the agent followed the expected path; this does not evaluate token budget.
- Deterministic failures should be passed into the judge context and shown separately in the UI. The judge can explain severity, but it should not erase hard failures such as missing search, missing sources, or provider errors.
- Keep result evaluation split into two stages: deterministic gate and LLM judge. Hard gate failures are part of the deterministic gate; the LLM judge is the follow-up quality layer.
- The final eval judgment combines both stages: hard gate failures block an overall pass, while LLM judge scores decide whether a structurally valid run is ready, needs revision, needs research rerun, or needs failure investigation.
- The deterministic gate checks hard facts such as final answer presence, visible sources, request coverage, and research output shape. The LLM judge scores quality dimensions such as usefulness, source faithfulness, evidence sufficiency, uncertainty handling, and run discipline.
- Hard gate failures should make the overall eval fail without pretending the final answer's qualitative dimensions are all bad. The UI should keep deterministic failures visually separate from quality scores.
- `run discipline` evaluates whether the agent followed the expected product path: search when current facts are requested, expose sources, avoid bypassing required tools, and explain failures or weak evidence. It does not evaluate token budget.
- Keep eval action semantics remediation-oriented:
  - `ready`: deterministic gate has no hard failure and LLM judge quality is sufficient.
  - `needs-revision`: deterministic gate passes, but answer quality needs editing or rewriting.
  - `rerun-research`: evidence or expected path is insufficient, so editing the current answer is not enough.
  - `investigate-failure`: provider, tool, metadata, or eval infrastructure failed and the run needs operational debugging.
- Use these default action thresholds for the first production reference:
  - `ready`: no hard gate failures and judge score is `>= 0.8`.
  - `needs-revision`: no hard gate failures and judge score is `>= 0.6` and `< 0.8`.
  - `rerun-research`: hard gate failures caused by missing search, missing sources, insufficient evidence, or research output shape failures.
  - `investigate-failure`: hard gate failures caused by provider errors, tool errors, missing metadata, or eval infrastructure failures.
- Keep the deterministic expected-path contract coarse and stable. Check what can be inferred from `UIMessage[]`: a user research request exists; current or comparative research uses `web_search`; visible sources are attached before the user evaluates the answer; at least two sources are available for grounded research; the final answer synthesizes evidence into a comparison and recommendation or decision; weak evidence is named as uncertainty.
- Do not make first-version path checks depend on hidden model reasoning, exact tool payloads, or a rigid step sequence. The AI Gateway OpenAI web search path may expose sources without rich tool input/output payloads, so overly strict sequence checks make the demo brittle.
- Classify each run before evaluation:
  - `evaluated`: research-capable run with enough output to score.
  - `skipped`: casual chat, greeting, or other non-research turn.
  - `failed-run`: provider error, invalid output, refusal, interrupted run, or other operational failure.
- `skipped` and `failed-run` are eval outcomes. They must not block the agent from continuing the chat.
- `failed-run` should stay visible in the trace/eval UI as an operational result, but it must not rewrite the agent's stored message history just to simplify evaluation.
- The LLM-as-judge pipeline sits behind `apps/web/features/trace-eval-agent/model/trace-eval-judge.ts` and `apps/web/features/trace-eval-agent/server/evaluation.ts`. Deterministic checks assemble evidence first; the judge consumes the prompt, final answer, sources, tool trace, usage, deterministic check results, and rubric; the result returns structured score, rationale, and recommended action for the UI.
- Live LLM behavior is expected to vary. A stale or weak answer can be useful QA evidence only when it reveals a mechanism gap such as missing sources in the snapshot, lost trace metadata, skipped deterministic checks, absent judge context, failed judge transport, or UI failure to expose the eval result.
- Do not add vendor-specific deterministic checks to compensate for a single live model judgment. Scenario-specific factual policy belongs in the research prompt, source evidence, or replaceable judge rubric for a copied production use case.
- Judge transport is observer-oriented, but it should stream structured judge content instead of synthetic heartbeat events. `apps/web/app/api/demos/trace-eval-agent/evaluate/stream/route.ts` now returns an AI SDK object text stream that `useObject` can consume directly. The JSON route at `apps/web/app/api/demos/trace-eval-agent/evaluate/route.ts` remains the non-streaming contract.
- Keep the judge stream protocol aligned with the repo's `content-review` object-generation pattern: `streamText` plus `Output.object()` on the server, `experimental_useObject` on the client, and partial structured fields rendered as they arrive.
- The LLM judge panel should derive visible progress from real streamed fields such as summary, rationale, dimensions, and action. Do not rebuild a fake SSE progress layer unless the product later needs a second transport for operational telemetry.
- `TraceEvalSnapshot.runId` is part of the single-run contract. Client-side judge state keys off that run id so retries re-evaluate the latest completed run even when prompt and answer text happen to match a previous run.
- Source display prefers official `source-url` parts. When the current OpenAI/Gateway path emits inline markdown links without `source-url` chunks, `trace-eval-snapshot.ts` derives link entries from the latest assistant answer so trace/eval stays truthful to what the user can inspect.
- `apps/web/features/trace-eval-agent/model/trace-eval-snapshot.ts` is the pure computation module for session trace and eval. Keep view concerns out of it so tests can cover the core contract without browser coupling.
- `apps/web/features/trace-eval-agent/model/trace-eval-judge.ts` is the pure computation module for the judge context and rubric. Keep provider calls out of it so tests can verify the judge input without live model coupling.
- Use the right-side suggestions to drive “wow” research cases. Keep them framed as current or comparative research tasks so the search tool actually activates.

## Update Triggers

- Update this file when the session trace contract changes.
- Update this file when the eval gate adds, removes, or redefines checks.
- Update this file when the LLM-as-judge rubric, result schema, or execution timing changes.
- Update this file when the top/bottom/side layout responsibilities move.
- Update this file when the demo changes search tool, transport, or metadata strategy.
