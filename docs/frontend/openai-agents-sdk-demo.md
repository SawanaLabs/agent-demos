---
title: OpenAI Agents SDK Demo
description: Complete copy-boundary, capability coverage, and bridge conventions for the ultra OpenAI Agents SDK demo running through AI Gateway.
updateAt: 2026-06-03
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
- **Runtime Inspector Module**: The feature-local UI module that derives the current **Runtime Inspector Panel** state from AI SDK UI messages, guide coverage, and setup profiles before rendering.
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
  - `https://openai.github.io/openai-agents-js/guides/voice-agents/`
  - `https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/`
  - `https://openai.github.io/openai-agents-js/guides/voice-agents/transport/`
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
- The `Tools` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/tools.ts`, which configures thin official `tool()` examples, one approval-required `tool({ needsApproval: true })`, hosted OpenAI tools, and one `agent.asTool()` specialist for the current demo.
- The `Guardrails` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/guardrails.ts`, which configures one input guardrail and one output guardrail on the main agent.
- The `Running Agents` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/running.ts`, which owns continuation strategy, provider-aware `previousResponseId` selection, `MemorySession` fallback, explicit `maxTurns`, and request-signal usage.
- The `Streaming` guide first slice is now separated into `apps/web/features/openai-agents-sdk-demo/server/streaming.ts`, which wraps the official `RunStreamEvent` source with a thin observer and records stream metadata without replacing the official AI SDK UI bridge.
- The `Agent Orchestration` guide first slice currently reuses the existing `research_memo_agent` specialist in `server/tools.ts` as the official `agent.asTool()` path and marks that guide from real run metadata when the specialist executes.
- The `Handoffs` guide first slice now lives in `server/handoffs.ts`. The main demo agent exposes one direct specialist agent in `handoffs: [agent]` and one explicit `handoff()` with `inputType`, `onHandoff`, and a local copy of the official `removeAllTools` / prompt-prefix helpers because the published `@openai/agents-core/extensions` entry is not resolvable through the current app package graph.
- The `Results` guide first slice now lives in `server/results.ts`. The chat route waits for `await agentStream.completed` and then maps the settled `RunResult` surface into message metadata: `activeAgent`, `lastAgent`, `finalOutput`, `history`, `newItems`, `output`, `interruptions`, `state.usage`, and `rawResponses`.
- The `Human-in-the-loop` guide first slice now lives in `server/approvals.ts`. The chat route serializes paused `RunState`, surfaces real `RunToolApprovalItem` metadata, and resumes the same run through `RunState.fromString(...)` plus `state.approve(...)` / `state.reject(...)`.
- The `Sessions` guide first slice now lives in `server/sessions.ts`. The chat route passes an official `MemorySession` into every `run(...)`, carries the session id through assistant metadata, reuses the same session for AI Gateway follow-ups, true `previousResponseId` follow-ups, and approval resume, and rehydrates a process-local session from visible transcript history after a cold store miss.
- The `Tracing` guide first slice now lives in `server/tracing.ts`. The chat route passes explicit per-run tracing config through the official `run(...)` path: `workflowName`, `traceId`, `groupId`, `traceMetadata`, `tracingDisabled`, `traceIncludeSensitiveData`, and optional `tracing.apiKey`.
- The `Sandbox Agents` guide first slice now lives in `server/sandbox.ts`. It defines one official `SandboxAgent` with `Manifest`, `localDir(...)`, and `Capabilities.default()`, passes a `UnixLocalSandboxClient` through `run(..., { sandbox })`, persists `sessionState` by demo `sessionId`, and exposes sandbox profile plus latest sandbox summary in the runtime inspector.
- The `Extensions / AI SDK Integration` first slice now lives in `server/extensions.ts`. The route keeps the official `@openai/agents-extensions/ai-sdk-ui` bridge on `createAiSdkUiMessageStream(...)`, writes bridge usage metadata after each settled run, and exposes the beta `aisdk(model)` adapter as an explicit `not-used` boundary because this demo's main run still needs deferred Responses tool loading.
- The `Voice Agents` slice now spans `server/voice.ts`, `server/voice-realtime.ts`, `server/voice-websocket.ts`, `server/voice-server-audio.ts`, `server/voice-sip.ts`, `server/voice-sip-route.ts`, `server/voice-cloudflare-worker.ts`, `server/voice-cloudflare-app.ts`, `server/voice-cloudflare-worker-module.ts`, `server/voice-twilio-route.ts`, `server/voice-twilio-bridge.ts`, `server/voice-twilio-app.ts`, `server/voice-extensions.ts`, and `ui/openai-agents-sdk-demo-voice-panel.tsx`. It exposes the official `RealtimeAgent` / `RealtimeSession` primitives, wires a real `/api/demos/openai-agents-sdk-demo/realtime/client-secrets` route through `client.realtime.clientSecrets.create()`, meters successful client-secret minting as `send_message` usage for `openai-agents-sdk-demo`, starts a browser `OpenAIRealtimeWebRTC` session through `session.connect({ apiKey })` on the page itself, includes dedicated server-side factories for `OpenAIRealtimeWebSocket`, a raw server audio loop on `RealtimeSession.sendAudio()` plus `session.on("audio")`, `OpenAIRealtimeSIP`, `CloudflareRealtimeTransportLayer`, and `TwilioRealtimeTransportLayer`, and now exposes a Cloudflare worker runtime wrapper, a deployed-shape Cloudflare fetch app, a deployable Cloudflare worker module, and a deployed-shape Twilio media-stream app factory. The workspace layout keeps `Conversation + Screen` as the only persistent regions inside the `100svh` demo surface; the right-side screen rail owns the compact voice entry strip, and the full realtime controls live in a dialog so the voice lane does not keep compressing the chat column.
- The first guide-family coverage registry lives in `apps/web/features/openai-agents-sdk-demo/server/guide-coverage.ts`. It tracks source guide URL, SDK primitive, observable runtime evidence, implementation status, provider capability status, and current-run readiness for each planned guide family.
- The current-run inspector derivation lives in `apps/web/features/openai-agents-sdk-demo/ui/openai-agents-sdk-demo-runtime-inspector.ts`. The **Demo Workspace** passes messages, guide coverage, and setup profiles into this **Runtime Inspector Module** instead of scanning assistant metadata inline.
- The chat route now writes tool-usage and guardrail-evaluation metadata after the streamed run settles, so the workspace can mark `Tools`, `Guardrails`, and individual catalog rows from real SDK results instead of inferring usage from visible text alone.
- The chat route now also writes stream-summary metadata after the streamed run settles. The current summary captures agent names plus counts and unique names for `raw_model_stream_event` and `run_item_stream_event`.
- The chat route now also writes handoff-summary metadata after the streamed run settles. The current summary captures `lastAgent`, handoff target names, and handoff transitions from real `handoff_call_item` / `handoff_output_item` values.
- The chat route now also writes result-summary metadata after the streamed run settles. The current summary captures the final output preview, active/last agent, history/output/new-item counts, interruption count, `state.usage`, raw-response count, and whether resumable run state was captured.
- The route also converts guardrail tripwires into explicit user-visible error messages. Input tripwires return a 400 before the stream starts, and output tripwires surface through the AI SDK UI error channel.
- The right-side workspace panel now renders the initial **Official Guide Coverage Panel** plus visible model, running, session, streaming, AI SDK extension, voice, handoff, approval, result, tracing, sandbox, tool, and guardrail inspector sections. The `Agents`, `Models`, `Tools`, `Guardrails`, `Running Agents`, `Streaming`, `Agent Orchestration`, `Handoffs`, `Results`, `Human-in-the-loop`, `Sessions`, `Tracing`, `Sandbox Agents`, `Voice Agents`, and `AI SDK Extension` rows are marked `implemented` before chat. `Voice Agents` stays `blocked` only when `OPENAI_API_KEY` is missing for the realtime client-secret route, moves to `ready` once configured, and moves to `used this run` after the browser voice lane connects or sends a realtime turn. The voice inspector now also surfaces explicit SIP route, Cloudflare worker runtime/app/module, and Twilio/Cloudflare transport contracts.
- The frontend currently renders assistant text, tool parts, approval cards, file attachments, running state, session-summary metadata, stream-summary metadata, AI SDK extension metadata, handoff-summary metadata, approval-summary metadata, settled result-summary metadata, trace-summary metadata, and sandbox-summary metadata. It still does not expose typed final output cards or raw trace drilldowns.
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

| Official guide family | Ultra-demo target                                                                                                                                  | Current status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | First implementation target                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agents                | Agent graph with dynamic instructions, typed context, lifecycle hooks, and output schemas                                                          | First slice implemented: `Agent` construction is feature-local and visible in guide coverage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Complete the remaining Agents-guide surface: dynamic instructions, lifecycle hooks, clone/copy behavior, `handoffDescription`, and output type where it is not owned by later guides |
| Sandbox agents        | Show sandbox agent shape and workspace lifecycle inside the same demo if the SDK/browser runtime path is stable enough                             | First slice implemented: `SandboxAgent`, `Manifest`, `Capabilities.default()`, `UnixLocalSandboxClient`, `RunConfig.sandbox`, repo-docs/feature `localDir(...)` mounts, and process-local `sessionState` persistence are visible in runtime metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Add Docker/hosted clients, snapshots, memory, and skills only after the local Unix sandbox lane is stable                                                                            |
| Models                | Model settings, reasoning effort, provider data, Gateway model ids, and unsupported-provider errors                                                | First slice implemented: centralized model profile, explicit Responses API + HTTP transport, and visible reasoning/verbosity diagnostics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Add provider-specific capability blocks for unsupported transport or deferred-tool-loading paths                                                                                     |
| Tools                 | Official function tools, hosted tools where supported, agents-as-tools, and tool states                                                            | Implemented with one explicit provider block: `tool()`, `webSearchTool()`, `fileSearchTool()` (setup-gated), `codeInterpreterTool()`, `imageGenerationTool()` (registered but provider-blocked on the current AI Gateway Responses path), `toolSearchTool()`, `agent.asTool()`, tool catalog, and per-run tool metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Keep the provider block visible until AI Gateway returns renderable image artifacts for hosted image generation on the official streamed run path                                    |
| Guardrails            | Input, output, and tool guardrails with visible tripwire/error states                                                                              | First slice implemented: one input guardrail, one output guardrail, explicit tripwire errors, guardrail catalog, and per-run guardrail metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Add tool guardrails and richer tripwire/result rendering once run-state and results surfaces land                                                                                    |
| Running Agents        | `run()`, provider-aware `previousResponseId` / `MemorySession` continuation, `maxTurns`, request abort signal, and visible run profile             | First slice implemented: feature-local running module, explicit `maxTurns`, request-scope `AbortSignal`, `resp_*` `lastResponseId` continuation, AI Gateway `gen_*` MemorySession continuation, and visible runtime inspector state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Add richer trace metadata and explicit error-handler coverage                                                                                                                        |
| Streaming             | Text deltas plus full SDK event stream for tools, handoffs, approvals, agent switches                                                              | First slice implemented: keep `createAiSdkUiMessageStream()` on the main path and collect `RunStreamEvent` metadata for the inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Expand beyond counts into visible handoff, approval, and richer item-event rendering                                                                                                 |
| Agent orchestration   | Official agents-as-tools and code-orchestrated examples                                                                                            | First slice implemented: `research_memo_agent` runs through `agent.asTool()` and marks guide usage from real tool metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Add code-orchestrated examples only after the documented agents-as-tools path is fully visible in the workspace                                                                      |
| Handoffs              | Official handoff examples, typed final output, active-agent continuation                                                                           | First slice implemented: one direct specialist agent in `handoffs: [agent]`, one explicit `handoff()`, handoff catalog, and per-run handoff metadata in the inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Add typed final-output unions and richer active-agent transitions now that Results summary exists                                                                                    |
| Results               | `finalOutput`, `newItems`, `history`, `interruptions`, `state`, usage, raw diagnostics                                                             | First slice implemented: settled result summary mapped from `StreamedRunResult` after `completed`, exposed through message metadata and the runtime inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Deepen from summary counts/previews into typed result cards, resumable state actions, and richer raw-response diagnostics                                                            |
| Human-in-the-loop     | Approval interruptions, approve/reject UI, resume from `RunState`                                                                                  | First slice implemented: one approval-required `tool({ needsApproval: true })`, AI SDK approval UI, serialized paused `RunState`, and resume via `RunState.fromString(...)` plus `state.approve(...)` / `state.reject(...)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Add multi-approval batches, sticky decisions, and session-aware approval resume                                                                                                      |
| Sessions              | SDK session memory, session input callback, approval compatibility                                                                                 | First slice implemented: process-local `MemorySession`, assistant-metadata session id handoff, reuse across AI Gateway follow-ups, true `previousResponseId` follow-ups, and approval resume, and session inspector metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Add `sessionInputCallback`, visible CRUD actions, and compaction-aware session options                                                                                               |
| Context management    | Local `RunContext<T>` for dependencies and user/session metadata                                                                                   | First slice implemented: typed demo context built from the latest user turn plus `MemorySession`, passed through `run(..., { context })`, consumed by dynamic instructions, `tool()`, `agent.asTool`, and guardrails, with context profile/summary visible in the inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Add lifecycle-hook usage and any later dependency objects only when a visible lane needs them                                                                                        |
| MCP                   | Hosted MCP and/or local MCP server tool path with approval behavior                                                                                | First slice implemented: one demo-local `MCPServerStreamableHttp` route, `connectMcpServers(...)`, `Agent.mcpServers`, `Agent.mcpConfig.includeServerInToolNames`, MCP catalog, and per-run MCP connection/usage metadata in the runtime inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Add hosted MCP and approval-specific MCP examples after the local Streamable HTTP path is stable                                                                                     |
| Tracing               | Built-in tracing metadata, trace/group ids, usage, optional flush in serverless runtime                                                            | First slice implemented: explicit per-run `workflowName`, `traceId`, `groupId`, `traceMetadata`, `tracingDisabled`, `traceIncludeSensitiveData`, optional `tracing.apiKey` override, trace summary metadata, and a visible tracing panel in the runtime inspector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Add exporter/flush visibility and deeper span drilldowns once a native OpenAI trace credential path is configured                                                                    |
| Voice agents          | Cover the voice-agent docs inside this demo's planning surface, then implement realtime voice only through the official realtime route/UI contract | Current slice implemented: `RealtimeAgent`, `RealtimeSession`, `OpenAIRealtimeWebRTC`, `OpenAIRealtimeWebSocket`, a server audio loop on `RealtimeSession.sendAudio()` plus `session.on("audio")`, `OpenAIRealtimeSIP`, `CloudflareRealtimeTransportLayer`, `TwilioRealtimeTransportLayer`, `/api/.../realtime/client-secrets`, `/api/.../realtime/sip`, `/api/.../realtime/twilio/incoming-call`, a Cloudflare worker runtime wrapper on `CloudflareRealtimeTransportLayer + RealtimeSession.connect(...)`, a deployed-shape Cloudflare fetch app with `/` and `/connect`, a deployable Cloudflare worker module with `export default { fetch(...) }`, a Twilio websocket media-stream bridge on `TwilioRealtimeTransportLayer + RealtimeSession.connect(...)`, a deployed-shape Twilio app factory with `/`, `/incoming-call`, and `/media-stream`, browser microphone controls, realtime text smoke-test input, native `OPENAI_API_KEY` setup state, one realtime handoff target, two realtime function tools, approval controls, visible session-event state, and dedicated server-side transport factories; text chat still is not counted as voice support | Deploy one of the worker/server wrappers in its target runtime and verify a live provider call or socket path end to end                                                             |
| Extensions            | AI SDK model adapter and AI SDK UI bridge                                                                                                          | First slice implemented: official AI SDK UI bridge is visible in coverage/runtime metadata; beta `aisdk(model)` remains an explicit `not-used` boundary because deferred Responses tool loading is required by this demo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Keep UI bridge on the main path; revisit AI SDK model adapter only for models that do not need deferred Responses tool loading                                                       |

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
- [x] Replace lossy text-only replay with a continuation strategy: `history`, `session`, `RunState`, `lastResponseId`, or an explicit combination chosen per capability lane.
- [x] Add a run-result normalization layer that preserves `finalOutput`, `newItems`, `interruptions`, `state`, `history`, `lastAgent`, `lastResponseId`, and usage. Keep trace metadata for the Tracing guide.
- [x] Extend the UI beyond text: tool calls, tool results, agent switches, handoffs, approval cards, guardrail failures, session status, result summary, and trace summary.
- [x] Add the initial **Official Guide Coverage Panel** on the right side of the chat workspace.
- [x] Add the full **Runtime Inspector Panel** for SDK run items, state, approvals, sessions, and traces.
- [ ] Mark both implementation coverage and per-run usage for each official guide family.
- [x] For each coverage row, show source guide, SDK primitive, run item/event, implementation status, and current-run status.
- [ ] Match the `skills-agent` quality bar: real source-core runtime, visible configured capability surface, visible runtime artifacts/events, explicit setup contract, and a portable README.
- [x] Add focused tests around the core 10 percent: run state normalization, approval resume, handoff active-agent continuation, guardrail tripwire behavior, and session continuation.
- [x] Add a first official MCP lane using the local `MCPServerStreamableHttp` route before attempting hosted MCP or connector-backed MCP.
- [ ] Keep typecheck/lint failures from unrelated work out of this demo's acceptance notes.

## Agents Guide Checklist

- [x] Keep the first `Agent` on the official SDK construction path and route it through `run(agent, input, { stream: true })`.
- [x] Move the first agent definition into `server/agents.ts` so later guide work can deepen the SDK graph without bloating `server/chat.ts`.
- [x] Expose the official `Agents` guide evidence in runtime state and the right-side coverage panel.
- [x] Add a core-contract test that proves runtime state exposes `Agents -> Agent -> Agent instance passed to run()`.
- [x] Add dynamic instructions from the `Agents` guide and pass typed run context through the official SDK path.
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

## Running Agents Guide Checklist

- [x] Keep the official `run()` helper on the main execution path and expose that choice in the coverage panel.
- [x] Move run-shaping logic into `server/running.ts` so the guide slice has one focused module for continuation strategy and run options.
- [x] Pass explicit `maxTurns` into the run options instead of relying on hidden SDK defaults.
- [x] Pass the request `AbortSignal` from the route/runtime layer into the OpenAI Agents SDK run call.
- [x] Continue follow-up turns with `previousResponseId` only when a settled assistant turn exposed a true OpenAI Responses `resp_*` id; otherwise continue with latest-user input backed by the official `MemorySession` so AI Gateway `gen_*` ids do not break history.
- [x] Surface the running profile in runtime state and the right-side inspector: workflow name, continuation strategy, max turns, and last response id.
- [x] Mark the `Running Agents` guide row as `implemented` / `ready`, then `used this run` from real run metadata.
- [x] Add focused tests that prove runtime state exposes the running profile, the route passes request abort state through, `resp_*` follow-ups use `previousResponseId`, and AI Gateway `gen_*` follow-ups use `MemorySession` continuation.
- [x] Add typed `RunContext<T>` once the Context Management guide lands.
- [ ] Add `errorHandlers` coverage once the demo can visibly distinguish handled `maxTurns` / `modelRefusal` results from thrown errors.

## Streaming Guide Checklist

- [x] Keep the official `createAiSdkUiMessageStream()` bridge on the main execution path.
- [x] Add a feature-local `server/streaming.ts` module that observes `RunStreamEvent` values without changing the bridged event shape.
- [x] Capture developer-verifiable stream metadata for `agent_updated_stream_event`, `raw_model_stream_event`, and `run_item_stream_event`.
- [x] Surface the latest stream summary in the right-side inspector with counts and unique event names/sources.
- [x] Mark the `Streaming` guide row as `implemented` / `ready`, then `used this run` from actual stream metadata.
- [x] Add focused tests that prove the observer preserves event order, metadata collection works, and the chat route returns the stream summary to the UI.
- [ ] Expand stream rendering beyond summary metadata now that Handoffs, Human-in-the-loop, and Results are on the main path.

## Agent Orchestration Guide Checklist

- [x] Keep the first orchestration slice on the official `agent.asTool()` path that already exists inside the demo tool graph.
- [x] Mark the `Agent Orchestration` guide row as `implemented` / `ready` in runtime state.
- [x] Mark the `Agent Orchestration` guide row as `used this run` when `research_memo_agent` executes.
- [x] Add focused tests that prove runtime state exposes the guide row and run metadata maps `research_memo_agent` usage back to `agent-orchestration`.
- [ ] Add code-orchestrated multi-agent examples only after the current `agent.asTool()` path is visibly exercised in the workspace.

## Handoffs Guide Checklist

- [x] Add one direct specialist agent through `handoffs: [agent]` and keep it inside the demo copy boundary.
- [x] Add one explicit `handoff()` example with `inputType`, `onHandoff`, and an input filter that strips tool history before transfer.
- [x] Prefix specialist-agent instructions with the official recommended handoff prompt semantics, using a demo-local helper because `@openai/agents-core/extensions` is not resolvable from the current app package graph.
- [x] Surface a developer-verifiable handoff catalog in runtime state and the right-side inspector.
- [x] Mark the `Handoffs` guide row as `implemented` / `ready`, then `used this run` from real `handoff_call_item` / `handoff_output_item` metadata.
- [x] Add focused tests that prove runtime state exposes the handoff catalog, the main `Agent` receives the configured handoff surface, and run metadata maps real handoff items back to the `handoffs` guide.
- [ ] Add typed final-output unions and richer current-agent transitions on top of the current Results summary.

## Results Guide Checklist

- [x] Wait for `await agentStream.completed` before reading settled `RunResult` fields.
- [x] Move result-summary shaping into `server/results.ts` so the guide slice stays isolated from the stream bridge.
- [x] Persist/show `activeAgent`, `lastAgent`, `finalOutput`, `history`, `newItems`, `output`, `interruptions`, `state.usage`, and `rawResponses` through message metadata.
- [x] Surface the latest settled result summary in the right-side inspector with final-output preview, counts, usage totals, and resumable-state status.
- [x] Mark the `Results` guide row as `implemented` / `ready`, then `used this run` from real settled result metadata.
- [x] Add focused tests that prove result-summary shaping works, the chat route emits settled result metadata, and runtime state exposes the Results guide coverage row.
- [ ] Deepen the inspector from summary-level counts into typed result cards and raw-response drilldowns.

## Human-in-the-loop Guide Checklist

- [x] Add one approval-required `tool({ needsApproval: true })` inside the demo copy boundary.
- [x] Keep the approval pause/resume flow on the official `RunToolApprovalItem` plus `RunState` path.
- [x] Surface approval-requested tool parts through AI SDK UI approval cards instead of a custom prompt workaround.
- [x] Serialize paused `RunState` into assistant metadata and resume through `RunState.fromString(...)`.
- [x] Apply approve/reject decisions with `state.approve(...)` and `state.reject(...)`, then continue the same root run with `run(agent, state, { stream: true })`.
- [x] Surface approval summary metadata in the right-side inspector with pending approvals, decisions, and paused-state status.
- [x] Mark the `Human-in-the-loop` guide row as `implemented` / `ready`, then `used this run` from real approval metadata.
- [x] Add focused tests that prove paused-state serialization, approval resume, and pending-approval blocking behavior.
- [ ] Add multi-approval batches, sticky decisions, and session-aware approval resume.

## Sessions Guide Checklist

- [x] Add one official `MemorySession` on the main run path and keep the session primitive visible in runtime state.
- [x] Carry the session id through assistant message metadata so later turns can reuse the same session without widening the route contract.
- [x] Reuse the same session for AI Gateway follow-up turns, true `previousResponseId` follow-up turns, and `RunState` approval resume.
- [x] Rehydrate a missing process-local session from visible transcript history so the demo can recover after a store miss without inventing custom session abstractions.
- [x] Surface session profile and latest session summary in the right-side inspector: primitive, storage scope, transport, session id, and history item count.
- [x] Mark the `Sessions` guide row as `implemented` / `ready`, then `used this run` from real message metadata.
- [x] Add focused tests that prove session creation, session reuse, session rehydration, and chat-path session wiring.
- [ ] Add `sessionInputCallback`, visible history CRUD actions, and compaction-aware session options after Context Management is on the main path.

## Context Management Guide Checklist

- [x] Define one typed demo `RunContext<T>` object and keep it feature-local under `server/context.ts`.
- [x] Build the context from the latest user turn plus the current `MemorySession` id before the initial `run(...)`.
- [x] Pass the typed context through the official `run(..., { context })` path.
- [x] Use dynamic main-agent instructions to expose only the LLM-visible parts of local context.
- [x] Read `runContext.context` inside at least one `tool()` callback and one guardrail callback.
- [x] Read `runContext.toolInput` inside the specialist `agent.asTool()` lane.
- [x] Surface context profile and latest context summary in the right-side inspector.
- [x] Mark the `Context Management` guide row as `implemented` / `ready`, then `used this run` from real assistant metadata.
- [x] Add focused tests that prove context creation, usage metadata, runtime-state exposure, and chat-path `run(..., { context })` wiring.
- [ ] Add lifecycle-hook usage or richer dependency objects only when a later guide exposes them visibly.

## Tracing Guide Checklist

- [x] Keep the first tracing slice on the official per-run `RunConfig` path instead of a demo-local trace wrapper.
- [x] Move tracing-profile and trace-run shaping into `server/tracing.ts`.
- [x] Pass explicit `workflowName`, `traceId`, `groupId`, `traceMetadata`, `tracingDisabled`, and `traceIncludeSensitiveData` through `run(...)`.
- [x] Use the current `MemorySession` id as the visible trace `groupId` so follow-up turns share one conversation grouping key.
- [x] Keep trace-export credentials explicit by using only the official `tracing.apiKey` override path when `OPENAI_AGENTS_TRACING_API_KEY` or `OPENAI_API_KEY` is present.
- [x] Persist the latest trace summary into assistant message metadata and expose it in the right-side inspector.
- [x] Mark the `Tracing` guide row as `implemented` / `ready`, then `used this run` from real trace metadata.
- [x] Add focused tests that prove trace profile shaping, trace run-config shaping, latest-trace reuse on approval resume, and chat-path trace option wiring.
- [ ] Add exporter-loop / flush visibility only after the demo has a deliberate native OpenAI tracing credential contract.

## Sandbox Agents Guide Checklist

- [x] Keep the first sandbox slice on the official `SandboxAgent` path and expose it as an `agent.asTool()` specialist inside the main demo agent.
- [x] Define the fresh workspace with `Manifest`, `localDir(...)`, and a stable `/workspace` root that mounts the demo docs and feature slice read-only.
- [x] Use `Capabilities.default()` so the sandbox specialist gets the SDK's default filesystem, shell, and compaction capability surface.
- [x] Pass `UnixLocalSandboxClient` through the official `run(..., { sandbox })` config on both initial runs and approval-resume runs.
- [x] Persist and reuse serialized sandbox `sessionState` by demo `sessionId` without inventing a custom sandbox lifecycle manager.
- [x] Surface sandbox profile and latest sandbox summary in the right-side inspector: backend, specialist model, manifest root, mounted paths, workspace readiness, capabilities, SDK primitives, and persisted session count.
- [x] Mark the `Sandbox Agents` guide row as `implemented` / `ready`, then `used this run` when the sandbox specialist tool executes or SDK sandbox state is serialized.
- [x] Add focused tests that prove sandbox profile exposure, run-config session reuse, guide coverage status, chat-path sandbox config wiring, and sandbox usage metadata emission.
- [ ] Add Docker/hosted sandbox clients only when the demo needs stronger isolation than `UnixLocalSandboxClient`.
- [ ] Add snapshots, sandbox memory, and lazy sandbox skills after the local Unix sandbox lane is stable and visible in QA.

## Voice Agents Guide Checklist

- [x] Document the official `RealtimeAgent` / `RealtimeSession` primitive boundary inside the demo copy surface.
- [x] Expose the browser WebRTC path as requiring an ephemeral client secret generated by a backend route.
- [x] Expose the server WebSocket path as requiring a native OpenAI API key and realtime model support.
- [x] Mark the `Voice Agents` guide row from the real browser voice lane instead of counting the current text chat route as realtime voice support.
- [x] Add a runtime inspector panel for the Voice Agents provider/transport block.
- [x] Add focused tests that prove the voice profile and guide coverage block are visible.
- [x] Add a backend route that calls `POST /v1/realtime/client_secrets` with a server API key.
- [x] Add browser audio UI that constructs a real `RealtimeAgent`, `RealtimeSession`, and `session.connect({ apiKey })`.
- [x] Add one realtime handoff target, one approval-required realtime tool, and visible `tool_approval_requested` / `agent_handoff` / `agent_tool_*` state inside the browser voice lane.
- [x] Add a real server-side `OpenAIRealtimeWebSocket` session factory with explicit `OPENAI_API_KEY` gating, `session.transport.sendEvent()` escape hatch, and focused contract tests.
- [x] Add a real server audio lane on top of `RealtimeSession.sendAudio()`, `session.on("audio")`, `session.on("transport_event")`, `session.transport.requestResponse()`, and `RealtimeSession.interrupt()`.
- [x] Add a real `OpenAIRealtimeSIP` session factory plus `OpenAIRealtimeSIP.buildInitialConfig()` helper with explicit `callId` and provider call-control contract.
- [x] Add a real `/api/demos/openai-agents-sdk-demo/realtime/sip` route that validates `callId` and returns the official SIP accept payload from `OpenAIRealtimeSIP.buildInitialConfig()`.
- [x] Add real `CloudflareRealtimeTransportLayer` and `TwilioRealtimeTransportLayer` factories with explicit `OPENAI_API_KEY` setup contracts.
- [x] Add a real Cloudflare worker runtime wrapper on top of `CloudflareRealtimeTransportLayer`, `RealtimeSession.connect(...)`, and the workerd `fetch() + Upgrade: websocket` contract.
- [x] Add a real deployed-shape Cloudflare worker fetch app with `/` health and `/connect` session-bootstrap behavior on top of the current Cloudflare runtime wrapper.
- [x] Add a deployable Cloudflare worker module that exports `fetch(request, env, ctx)` on top of the current worker app factory.
- [x] Add a real `/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call` route that returns TwiML `<Connect><Stream />` and gates on `OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL`.
- [x] Add a real Twilio websocket bridge on top of `TwilioRealtimeTransportLayer`, `RealtimeSession.connect(...)`, and websocket close events.
- [x] Surface SIP route plus SIP/Twilio/Cloudflare transport lanes in runtime state and the right-side inspector without pretending the current page is already a telephony or worker product.
- [x] Add a real deployed-shape Twilio media-stream app factory with `/`, `/incoming-call`, and `/media-stream` entry points on top of the current Twilio transport wrapper.
- [ ] Deploy one of the provider wrappers outside the Next app and verify a live provider or browser-connected socket path end to end.

## Extensions / AI SDK Integration Checklist

- [x] Keep the official `createAiSdkUiMessageStream()` bridge on the main route instead of replacing it with a custom stream protocol.
- [x] Add a feature-local `server/extensions.ts` module that records the official AI SDK extension profile and usage metadata.
- [x] Expose the AI SDK UI bridge profile in runtime state and the right-side inspector: bridge primitive, response helper, and current bridge status.
- [x] Mark the `AI SDK Extension` guide row as `implemented` / `ready`, then `used this run` from real assistant metadata after the bridge path settles.
- [x] Keep the beta `aisdk(model)` model adapter boundary explicit as `not-used` while this demo depends on deferred Responses tool loading.
- [x] Add focused tests that prove extension profile exposure, guide coverage status, and chat-path bridge metadata emission.
- [ ] Revisit `aisdk(model)` only when a specific model lane can run without deferred Responses tool loading or when the extension supports that SDK capability.

## Update Triggers

- Update this file when the canonical OpenAI Agents SDK TypeScript guide routes change.
- Update this file when the AI SDK UI bridge package or helper names change.
- Update this file when the demo moves from the base bridge slice into an ultra capability lane.
- Update this file when AI Gateway model/provider support changes the safe feature matrix for tools, reasoning, MCP, tracing, or structured output.
