---
title: OpenAI Agents SDK Demo
description: Complete copy-boundary, capability coverage, and bridge conventions for the ultra OpenAI Agents SDK demo running through AI Gateway.
updateAt: 2026-05-25
---

# OpenAI Agents SDK Demo

## Scope

- Covers the `openai-agents-sdk-demo` roadmap entry under `apps/web/features`.
- Covers the ultra version target: a complete OpenAI Agents SDK TypeScript **Agent Demo** that can be copied as one coherent feature slice.
- Covers the product expectation that all OpenAI Agents SDK capabilities relevant to this demo live inside this one demo, without splitting capability families into separate demos.
- Covers the backend orchestration boundary, the AI SDK UI bridge, AI Gateway transport, run state, approvals, sessions, tracing, and the frontend surfaces needed to show them.
- Does not cover `trace-eval-agent`; that feature is being worked on separately and should not be edited for this demo unless the user explicitly widens scope.

## Domain Language

- **Ultra OpenAI Agents SDK demo**: A complete **Agent Demo** whose demo-related code is expected to be copied away together and whose capability surface covers every stable OpenAI Agents SDK TypeScript capability family that can be shown in this app: agents, models, tools, guardrails, running, streaming, orchestration, handoffs, results, human-in-the-loop, sessions, context, MCP, tracing, sandbox agents, voice-adjacent references, and extensions.
- **Whole-demo copy boundary**: The complete `openai-agents-sdk-demo` feature slice, including route entries, UI, server modules, tests, docs, setup contract, and any demo-local runtime adapters needed to move the demo into a compatible project.
- **Official-source parity**: The implementation standard that the demo should preserve the AI SDK and OpenAI Agents SDK documentation behavior, helper names, run surfaces, and runtime semantics before adding project-specific polish.
- **Non-pruned capability coverage**: The rule that a capability should not be omitted just because it adds UI or backend complexity. If the SDK capability is stable enough to demonstrate and fits this app, implement it inside this demo.
- **Document-by-document integration path**: The implementation order for the ultra demo: walk the official OpenAI Agents SDK TypeScript docs one guide at a time, integrate the documented capability, then expose only enough UI to prove that capability works.
- **Thin demo adapter**: The smallest route, state, or UI adapter needed to fit an official SDK capability into this app without replacing the official SDK pattern with custom orchestration.
- **SDK-first backend**: Backend code shaped around official SDK primitives such as `Agent`, `Runner`, `run()`, `RunContext`, `RunState`, `RunResult`, `StreamedRunResult`, `tool()`, `handoff()`, sessions, and tracing.
- **Run state surface**: The persisted or returned data needed to continue a run safely: `history`, `newItems`, `finalOutput`, `interruptions`, `state`, `lastAgent` / `activeAgent`, `lastResponseId`, `runContext`, usage, and trace metadata.
- **AI SDK UI bridge**: The official adapter from `@openai/agents-extensions/ai-sdk-ui` that converts an OpenAI Agents SDK stream into AI SDK UI-compatible chunks.
- **Gateway-backed OpenAI client**: The official `openai` client configured against AI Gateway's OpenAI-compatible Responses endpoint and injected into the OpenAI Agents SDK with `setDefaultOpenAIClient(...)`.
- **Provider transport boundary**: The narrow layer where `AI_GATEWAY_API_KEY`, base URL, model id, and reasoning settings are configured. Agent behavior must still be modeled through OpenAI Agents SDK primitives.
- **Provider capability block**: An explicit setup or runtime state used when AI Gateway or the selected model/provider cannot support an official OpenAI Agents SDK capability.
- **Capability lane**: One coherent mode or section inside the ultra demo, such as "tools and approvals" or "handoffs and typed results", with its own backend module, focused tests, and visible UI states while remaining inside the same **Whole-demo copy boundary**.
- **General OpenAI Agent**: The product shape for the ultra demo: a ChatGPT-like conversational agent built from OpenAI Agents SDK primitives, with official SDK capabilities exposed through one coherent chat workspace.
- **Official Guide Coverage Panel**: The right-side inspector surface that maps the current run and implemented capabilities back to the OpenAI Agents SDK guide families.
- **Runtime Inspector Panel**: The right-side operational surface that shows run state, active agent, tool calls, handoffs, approvals, sessions, traces, and which official guide capabilities were exercised.
- **Developer-verifiable coverage evidence**: The per-capability proof shown in the inspector: source guide, SDK primitive, run item or stream event, implementation status, and whether the current run exercised it.
- **Investment Research Task**: The default suggested task for the general agent: an investment-company analyst running deep research on a public company.
- **Company Research Target**: The public company being analyzed in the workspace. Tesla should be the default target because the user can judge whether the analysis quality is credible.
- **Analyst Review Packet**: The final artifact produced by the demo: a structured, sourced research packet that a human analyst can review, challenge, and refine.

## Business Shape

- This demo should model a complete OpenAI Agents SDK capability workspace, not a thin bridge or minimal smoke test.
- The primary product goal is official capability coverage. The implementation should follow the OpenAI Agents SDK docs guide by guide, preserving each guide's source-core behavior before adding demo polish.
- The expected evaluator is the repository's **Technical Evaluator**: a developer or technical reviewer who wants to judge whether the whole feature slice can be copied into another compatible project.
- The product shape is a **General OpenAI Agent**: effectively a ChatGPT-like conversational agent rebuilt on top of OpenAI Agents SDK capabilities.
- The **Investment Research Task** is the default suggested task for exercising the agent. The default **Company Research Target** should be Tesla, because the task is familiar enough for the user to judge output quality and broad enough to exercise the SDK capability surface.
- The user-facing form remains a conversational **Demo Workspace**, consistent with `skills-agent`: the evaluator chats with the agent, while the workspace exposes runtime state, tools, handoffs, approvals, traces, sessions, and final artifacts around the conversation.
- The main left surface should stay ChatGPT-like: prompt input, assistant messages, streaming output, and retry/stop controls. Do not turn the primary experience into a docs checklist UI.
- The right-side panel should combine the **Official Guide Coverage Panel** and **Runtime Inspector Panel**. It should show which OpenAI Agents SDK guide families are implemented and which ones were actually exercised in the current run.
- Coverage should optimize for **Technical Evaluator** verification. Each guide-family row should expose **Developer-verifiable coverage evidence** such as `Handoffs -> handoff() -> handoff call/output item -> used this run`.
- The default workflow can feel like a Tesla deep research task: collect source material, inspect financials and market context, split work across specialist agents, request human approval for sensitive or high-cost actions, challenge conclusions with guardrails, and produce an **Analyst Review Packet**. Do not over-optimize around this artifact; use it mainly to make official SDK capabilities easy to judge.
- The demo should produce research analysis and cited reasoning, not investment advice. It should avoid buy/sell/hold recommendations unless the user explicitly asks for a simulated analyst opinion, and even then it must label the result as a demo artifact for human review.
- Financial facts are time-sensitive. Do not hardcode current Tesla metrics, prices, filings, or earnings claims as durable product truth; fetch, upload, or cite source material at runtime, or ask the user for the analysis period.
- All demo-related code is expected to travel together. Keep the **Copy Boundary** centered on `apps/web/features/openai-agents-sdk-demo` plus the thin Next.js page/API route entries that invoke it.
- Follow the AI SDK and OpenAI Agents SDK docs closely. Preserve the **Source Core** for official runtime behavior before adding repo-specific UI organization.
- Use `skills-agent` as the local quality reference: preserve the official source core, expose the real runtime capability surface, show generated artifacts or runtime events visibly, keep setup errors explicit, and keep the feature slice portable.
- Do not intentionally reduce the SDK capability surface to make implementation easier. If a stable SDK feature needs UI, state, or route work, add that work inside this demo instead of cutting the feature.
- Avoid custom orchestration, custom tool frameworks, or custom agent abstractions when the official OpenAI Agents SDK docs already provide the pattern. Add a **Thin demo adapter** only to connect the official SDK behavior to the existing route, chat UI, runtime panel, and tests.
- Do not silently degrade provider-specific OpenAI Agents SDK behavior. If AI Gateway, the selected model, or missing native OpenAI credentials cannot support an official capability, show a **Provider capability block**.
- Do not use custom tools, custom fetchers, or custom orchestration to pretend an unsupported official capability is covered. The coverage panel should say `blocked` or `requires OPENAI_API_KEY` instead of counting a custom substitute as official coverage.
- Use internal modes or lanes to keep the UX navigable, but do not turn major OpenAI Agents SDK capability families into separate homepage demos.

## Canonical Source Set

- Treat the OpenAI Agents SDK TypeScript docs as the canonical backend source set for the ultra demo:
  - `https://openai.github.io/openai-agents-js/`
  - `https://openai.github.io/openai-agents-js/guides/quickstart/`
  - `https://openai.github.io/openai-agents-js/guides/agents/`
  - `https://openai.github.io/openai-agents-js/guides/models/`
  - `https://openai.github.io/openai-agents-js/guides/tools/`
  - `https://openai.github.io/openai-agents-js/guides/guardrails/`
  - `https://openai.github.io/openai-agents-js/guides/running-agents/`
  - `https://openai.github.io/openai-agents-js/guides/streaming/`
  - `https://openai.github.io/openai-agents-js/guides/multi-agent/`
  - `https://openai.github.io/openai-agents-js/guides/handoffs/`
  - `https://openai.github.io/openai-agents-js/guides/results/`
  - `https://openai.github.io/openai-agents-js/guides/human-in-the-loop/`
  - `https://openai.github.io/openai-agents-js/guides/sessions/`
  - `https://openai.github.io/openai-agents-js/guides/context/`
  - `https://openai.github.io/openai-agents-js/guides/mcp/`
  - `https://openai.github.io/openai-agents-js/guides/tracing/`
  - `https://openai.github.io/openai-agents-js/guides/sandbox-agents`
  - `https://openai.github.io/openai-agents-js/extensions/ai-sdk/`
- Treat `https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-compat/responses` as the canonical AI Gateway source for OpenAI-compatible Responses API usage, model ids in `provider/model` format, streaming, reasoning settings, and error codes.
- Treat `openai/openai-agents-js` examples as implementation references after the public docs are checked:
  - `examples/ai-sdk-ui` for the AI SDK UI bridge.
  - `examples/nextjs` for app wiring and approval UX references.
  - `examples/agent-patterns` for orchestration patterns.
- Refresh all of the above before implementation batches. Model names, default model settings, bridge helpers, and beta sandbox APIs are drift-prone.
- Implement capabilities in the same order as the docs when practical. If a later guide depends on an earlier one, integrate the earlier guide first instead of inventing a shortcut.

## Current Implementation Status

- The first feature slice exists under `apps/web/features/openai-agents-sdk-demo`.
- The route contract is split as:
  - `apps/web/app/demos/openai-agents-sdk-demo/page.tsx`
  - `apps/web/app/api/demos/openai-agents-sdk-demo/route.ts`
- The backend currently uses a feature-local `Agent`, `run(..., { stream: true })`, and `createAiSdkUiMessageStream(...)` wrapped in AI SDK UI response helpers.
- The provider path currently uses `setOpenAIAPI("responses")` plus `setDefaultOpenAIClient(new OpenAI(...))` to route through AI Gateway's OpenAI-compatible Responses endpoint.
- The current default demo model is `openai/gpt-5-mini`, inherited from the repo's AI Gateway config style. Keep the default configurable through `AI_GATEWAY_CHAT_MODEL` and `OPENAI_AGENTS_MODEL`.
- The `Agents` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/agents.ts`, which constructs the official `Agent` used by the chat route.
- The `Models` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/models.ts`, which centralizes model id, Responses API selection, HTTP transport, AI Gateway base URL, reasoning effort, and text verbosity.
- The current agent now passes both `modelSettings.reasoning.effort` and `modelSettings.text.verbosity` into the official `Agent` constructor. This matters because once custom `modelSettings` are provided, the SDK no longer applies the GPT-5 default `text.verbosity = low` automatically.
- The `Tools` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/tools.ts`, which configures one official `tool()`, two hosted OpenAI tools, and one `agent.asTool()` specialist for the current demo.
- The `Guardrails` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/guardrails.ts`, which configures one input guardrail and one output guardrail on the main agent.
- The first guide-family coverage registry lives in `apps/web/features/openai-agents-sdk-demo/server/guide-coverage.ts`. It tracks source guide URL, SDK primitive, observable runtime evidence, implementation status, provider capability status, and current-run readiness for each planned guide family.
- The chat route now writes tool-usage and guardrail-evaluation metadata after the streamed run settles, so the workspace can mark `Tools`, `Guardrails`, and individual catalog rows from real SDK results instead of inferring usage from visible text alone.
- The route also converts guardrail tripwires into explicit user-visible error messages. Input tripwires return a 400 before the stream starts, and output tripwires surface through the AI SDK UI error channel.
- The right-side workspace panel now renders the initial **Official Guide Coverage Panel** plus a visible model profile, tool catalog, and guardrail catalog. The `Agents`, `Models`, `Tools`, and `Guardrails` rows are marked `implemented` / `ready` before chat; `Agents` and `Models` move to `used this run` after assistant output, while `Tools` and `Guardrails` move from actual SDK metadata.
- The frontend currently renders text parts only. It does not yet expose SDK run items, tool calls, handoffs, approval interruptions, session ids, usage, traces, or typed final output.
- The current message replay path manually converts `UIMessage` text into `AgentInputItem[]`. This is enough for a basic chat smoke test and too lossy for the ultra version because it drops non-text parts, tool outputs, handoff boundaries, approval state, response ids, and SDK item metadata.
- The current core-contract tests cover request validation, setup errors, guide coverage exposure, AI Gateway client injection, message conversion, bridge invocation, stream-error surfacing, tool and guardrail catalog exposure, tool and guardrail injection into the main `Agent`, tool-usage metadata emission, and explicit input-guardrail 400 handling.
- The first tools QA probe confirmed that AI Gateway's OpenAI-compatible Responses path in this repo accepts both hosted `web_search` and hosted `code_interpreter`.

## Architecture Direction

- Keep the frontend stack: Next.js route entries, the existing demo catalog shape, AI SDK UI state, AI Elements primitives, and feature-local workspace components.
- Keep the demo copyable as one feature slice. Shared abstractions should appear only when reuse is already real, and any new shared dependency must not make the demo harder to lift into a compatible project.
- Keep capability modules aligned to official guide names and examples. A future reader should be able to map one module or mode back to one OpenAI Agents SDK guide without reverse-engineering repo-specific orchestration.
- Move the backend toward a SDK-first deep module before adding more visible features:
  - `server/agents.ts`: agent graph definitions, `Agent.create(...)` where handoff output types matter, tools, guardrails, and output schemas.
  - `server/runner.ts`: `Runner` construction, run options, cancellation, `maxTurns`, tracing metadata, and Gateway client bootstrap.
  - `server/state.ts`: session ids, serialized `RunState`, approval resolution, `history`, `lastResponseId`, and any local persistence boundary.
  - `server/stream.ts`: full SDK event handling plus the AI SDK UI bridge. Text streaming should stay bridged; richer SDK events should be emitted through explicit UI message parts or feature-local side-channel metadata.
  - `server/capabilities/*`: one file per official-document capability lane when the module gets large enough. These are internal lanes inside one demo, not separate Agent Demos.
- Configure SDK-wide defaults in one stable bootstrap path, not ad hoc inside every request branch. The OpenAI Agents SDK config docs describe `setDefaultOpenAIClient(...)` and `setOpenAIAPI(...)` as process-wide defaults.
- Keep AI Gateway as a transport/provider layer. Do not let provider swapping erase SDK semantics. Features that depend on OpenAI Responses-specific behavior should fail explicitly when the selected Gateway model/provider cannot support them.
- Capability support must be explicit. A capability can be `implemented`, `used this run`, `not exercised`, `blocked by provider`, or `requires native OpenAI credentials`; it should never be treated as covered by a silent fallback.
- Prefer OpenAI Responses API chaining, sessions, or serialized `RunState` over manual UI transcript reconstruction once tools, approvals, handoffs, or MCP enter the flow.
- Preserve the official AI SDK UI bridge for assistant text and standard AI SDK UI chunks. Add feature-local rendering for SDK-native artifacts that the bridge does not expose well enough.
- Mirror the `skills-agent` product posture: real runtime capability first, visible state second, explanatory copy only where it helps the evaluator operate the workspace.
- Keep official guide coverage visible in the right-side inspector. A user should be able to see that a Tesla research conversation exercised `Tools`, `Handoffs`, `Results`, `Sessions`, `Tracing`, or other official guide families without reading the code.
- Make coverage evidence concrete enough for code review. Avoid vague "supported" badges unless the row also names the official guide, SDK primitive, observable run item/event, and current-run usage state.
- Keep all credentials explicit:
  - `AI_GATEWAY_API_KEY` is required for the Gateway-backed OpenAI client.
  - `OPENAI_AGENTS_GATEWAY_BASE_URL` remains an optional demo-local override.
  - `OPENAI_AGENTS_MODEL` remains an optional demo-local model override.
  - Add hosted-tool, MCP, tracing, sandbox, or voice credentials only when the matching lane is implemented.

## Implementation Rhythm

- First build the coverage skeleton before deepening any one feature:
  - guide-family registry
  - implementation status
  - provider capability block status
  - per-run usage status
  - run-state normalization shape
  - right-side coverage/runtime inspector
- Then integrate OpenAI Agents SDK capabilities one official guide at a time.
- After finishing one guide, run a narrow QA pass only for that newly added capability. Do not expand QA into full Tesla research until the guide-family coverage is complete.
- Keep each QA pass simple and capability-specific:
  - can the user trigger the new capability from the chat?
  - does the inspector mark the matching official guide as `used this run`?
  - does the visible runtime evidence name the SDK primitive and run item/event?
  - does provider-blocked behavior show an explicit blocked/setup state?
- Run the full Tesla investment-research task only after the official guide-family coverage has been implemented and smoke-tested guide by guide.

## Capability Matrix

| Official guide family | Ultra-demo target | Current status | First implementation target |
| --- | --- | --- | --- |
| Agents | Agent graph with dynamic instructions, typed context, lifecycle hooks, and output schemas | First slice implemented: `Agent` construction is feature-local and visible in guide coverage | Complete the remaining Agents-guide surface: dynamic instructions, lifecycle hooks, clone/copy behavior, `handoffDescription`, and output type where it is not owned by later guides |
| Sandbox agents | Show sandbox agent shape and workspace lifecycle inside the same demo if the SDK/browser runtime path is stable enough | Missing | Add as a later internal lane; document beta status and require explicit runtime choice |
| Models | Model settings, reasoning effort, provider data, Gateway model ids, and unsupported-provider errors | First slice implemented: centralized model profile, explicit Responses API + HTTP transport, and visible reasoning/verbosity diagnostics | Add provider-specific capability blocks for unsupported transport or deferred-tool-loading paths |
| Tools | Official function tools, hosted tools where supported, agents-as-tools, and tool states | Implemented with one explicit provider block: `tool()`, `webSearchTool()`, `fileSearchTool()` (setup-gated), `codeInterpreterTool()`, `imageGenerationTool()` (registered but provider-blocked on the current AI Gateway Responses path), `toolSearchTool()`, `agent.asTool()`, tool catalog, and per-run tool metadata | Keep the provider block visible until AI Gateway returns renderable image artifacts for hosted image generation on the official streamed run path |
| Guardrails | Input, output, and tool guardrails with visible tripwire/error states | First slice implemented: one input guardrail, one output guardrail, explicit tripwire errors, guardrail catalog, and per-run guardrail metadata | Add tool guardrails and richer tripwire/result rendering once run-state and results surfaces land |
| Running Agents | `Runner`, `maxTurns`, abort signal, context, run config, trace metadata | Basic `run()` call | Introduce feature-local runner module and typed run options |
| Streaming | Text deltas plus full SDK event stream for tools, handoffs, approvals, agent switches | Text bridge only | Keep AI SDK UI bridge and add SDK event capture for the right panel |
| Agent orchestration | Official agents-as-tools and code-orchestrated examples | Missing | Reproduce the documented orchestration patterns before adding Tesla-specific naming |
| Handoffs | Official handoff examples, typed final output, active-agent continuation | Missing | Use the documented handoff APIs and expose current/last agent |
| Results | `finalOutput`, `newItems`, `history`, `interruptions`, `state`, usage, raw diagnostics | Mostly hidden | Wait for `completed` and persist/show settled result summary |
| Human-in-the-loop | Approval interruptions, approve/reject UI, resume from `RunState` | Missing | Add one approval-required tool and resume flow |
| Sessions | SDK session memory, session input callback, approval compatibility | Missing | Add per-browser demo session id and `MemorySession` or local session adapter |
| Context management | Local `RunContext<T>` for dependencies and user/session metadata | Missing | Define demo context and pass it through tools, hooks, guardrails |
| MCP | Hosted MCP and/or local MCP server tool path with approval behavior | Missing | Add only after base tools and approvals are stable |
| Tracing | Built-in tracing metadata, trace/group ids, usage, optional flush in serverless runtime | Missing in UI | Add local trace panel before external exporter work |
| Voice agents | Cover the voice-agent docs inside this demo's planning surface, then implement only if the realtime transport/UI contract can live in the same copy boundary | Missing | Start as a documented later internal lane because `RealtimeAgent` / `RealtimeSession` need a different transport |
| Extensions | AI SDK model adapter and AI SDK UI bridge | UI bridge present | Keep UI bridge; use AI SDK model adapter only for models that do not need deferred Responses tool loading |

## Ultra Implementation Checklist

- [ ] Refresh official source docs and examples before coding the next slice.
- [ ] Build the first-stage coverage skeleton before deepening individual capabilities.
- [ ] Implement the OpenAI Agents SDK guides through a **Document-by-document integration path**.
- [ ] After each official guide is integrated, run a narrow QA pass for only that newly added capability.
- [ ] Defer full Tesla investment-research QA until the official guide-family coverage is complete.
- [ ] For each capability, preserve the official source core before writing custom orchestration, tools, prompts, or state machines.
- [ ] Treat the Tesla investment-research flow as the default suggested task for a **General OpenAI Agent**, not as permission to replace official SDK patterns with domain-specific custom logic.
- [ ] Add explicit **Provider capability block** states for official capabilities that AI Gateway or the selected model/provider cannot support.
- [ ] Do not count custom tools, custom fetchers, or custom orchestration as official capability coverage.
- [ ] Refactor backend into SDK-first modules without changing the route or frontend contract.
- [ ] Keep every implemented capability inside the `openai-agents-sdk-demo` copy boundary unless the user explicitly approves shared extraction.
- [ ] Add a stable Gateway/OpenAI bootstrap path and tests proving it is not repeatedly reconfigured with conflicting per-request state.
- [ ] Replace lossy text-only replay with a continuation strategy: `history`, `session`, `RunState`, `lastResponseId`, or an explicit combination chosen per capability lane.
- [ ] Add a run-result normalization layer that preserves `finalOutput`, `newItems`, `interruptions`, `state`, `history`, `lastAgent`, `lastResponseId`, usage, and trace metadata.
- [ ] Extend the UI beyond text: tool calls, tool results, agent switches, handoffs, approval cards, guardrail failures, session status, result summary, and trace summary.
- [x] Add the initial **Official Guide Coverage Panel** on the right side of the chat workspace.
- [ ] Add the full **Runtime Inspector Panel** for SDK run items, state, approvals, sessions, and traces.
- [ ] Mark both implementation coverage and per-run usage for each official guide family.
- [x] For each coverage row, show source guide, SDK primitive, run item/event, implementation status, and current-run status.
- [ ] Match the `skills-agent` quality bar: real source-core runtime, visible configured capability surface, visible runtime artifacts/events, explicit setup contract, and a portable README.
- [ ] Add focused tests around the core 10 percent: run state normalization, approval resume, handoff active-agent continuation, guardrail tripwire behavior, and session continuation.
- [ ] Keep typecheck/lint failures from unrelated work out of this demo's acceptance notes.

## Agents Guide Checklist

- [x] Keep the first `Agent` on the official SDK construction path and route it through `run(agent, input, { stream: true })`.
- [x] Move the first agent definition into `server/agents.ts` so later guide work can deepen the SDK graph without bloating `server/chat.ts`.
- [x] Expose the official `Agents` guide evidence in runtime state and the right-side coverage panel.
- [x] Add a core-contract test that proves runtime state exposes `Agents -> Agent -> Agent instance passed to run()`.
- [ ] Add dynamic instructions from the `Agents` guide and pass typed run context through the official SDK path.
- [ ] Add visible lifecycle hook capture for `agent_start` and `agent_end` before claiming hook coverage.
- [ ] Add clone/copy behavior only when there is a visible mode or test proving the cloned agent is used.
- [ ] Add `handoffDescription` with the handoffs guide, unless an earlier `Agents` guide slice needs it for visible coverage.
- [ ] Add `outputType` with the results / structured-output slice, unless the `Agents` guide slice can show it without breaking chat text output.

## Models Guide Checklist

- [x] Centralize model id, Gateway base URL, Responses API selection, and transport in `server/models.ts`.
- [x] Pass explicit `modelSettings.reasoning.effort` and `modelSettings.text.verbosity` into the official `Agent` constructor.
- [x] Expose a developer-verifiable model profile in runtime state and the right-side inspector.
- [x] Mark the `Models` guide row as `implemented` / `ready`, then `used this run` after a successful assistant turn.
- [x] Add a core-contract test that proves runtime state exposes the active model profile for the Models guide.
- [x] Add a chat-path test that proves GPT-5 text verbosity remains explicit when custom reasoning settings are provided.
- [ ] Add provider capability blocks for Responses WebSocket transport and deferred Responses tool loading before claiming those paths.
- [ ] Add visible provider-data diagnostics when a later guide needs provider-specific settings beyond reasoning and verbosity.

## Tools Guide Checklist

- [x] Add one thin official `tool()` example that fits the Tesla-style research flow without pretending to cover unsupported capabilities.
- [x] Add hosted `webSearchTool()` to the main agent and expose it in the right-side tool catalog.
- [x] Add hosted `codeInterpreterTool()` to the main agent and expose it in the right-side tool catalog.
- [x] Add one specialist `agent.asTool()` path and keep it inside the same demo copy boundary.
- [x] Mark the `Tools` guide row as `implemented` / `ready`, then `used this run` from actual run-item metadata.
- [x] Add a core-contract test that proves runtime state exposes the current tool catalog and the Tools guide coverage row.
- [x] Add a chat-path test that proves the main `Agent` receives the configured tool set and that tool usage is returned to the UI as message metadata.
- [x] Wire `fileSearchTool()` behind a real vector-store contract: `OPENAI_AGENTS_VECTOR_STORE_IDS`.
- [x] Render assistant file outputs as first-class chat artifacts when the upstream run returns image bytes.
- [x] Wire `toolSearchTool()` into the Tools slice and gate it by model support.
- [x] Register `imageGenerationTool()` and show an explicit provider capability block when the current AI Gateway Responses path cannot deliver a renderable artifact.

## Guardrails Guide Checklist

- [x] Add one input guardrail on the official `inputGuardrails` path and keep it inside the main demo agent.
- [x] Add one output guardrail on the official `outputGuardrails` path and keep it inside the main demo agent.
- [x] Mark the `Guardrails` guide row as `implemented` / `ready`, then `used this run` from actual guardrail-result metadata.
- [x] Expose a developer-verifiable guardrail catalog in runtime state and the right-side inspector.
- [x] Return explicit input-guardrail errors instead of letting the request collapse into `failed to fetch`.
- [x] Surface output-guardrail tripwires through the AI SDK UI error handler with a demo-specific explanation.
- [x] Add focused tests that prove the main `Agent` receives the configured guardrails, that guardrail metadata reaches the UI, and that input tripwires return a 400 response.
- [ ] Add tool guardrails when the later Tools and Results slices expose tool input/output state as first-class runtime artifacts.

## Update Triggers

- Update this file when the canonical OpenAI Agents SDK TypeScript guide routes change.
- Update this file when the AI SDK UI bridge package or helper names change.
- Update this file when the demo moves from the base bridge slice into an ultra capability lane.
- Update this file when AI Gateway model/provider support changes the safe feature matrix for tools, reasoning, MCP, tracing, or structured output.
