# OpenAI Agents SDK Demo

`openai-agents-sdk-demo` keeps the backend on the official OpenAI Agents SDK path, swaps the default provider transport onto AI Gateway's OpenAI-compatible Responses endpoint, and keeps the frontend on the repo's existing AI SDK UI stack.

## Business shape

This demo proves the narrowest official bridge:

- `@openai/agents` defines and runs the agent
- an `OpenAI` client pointed at AI Gateway is registered through `setDefaultOpenAIClient(...)`
- `run(..., { stream: true })` produces the streamed run
- `@openai/agents-extensions/ai-sdk-ui` converts that run into the AI SDK UI response the existing chat workspace can consume

## Feature slice

```text
app/
├── api/demos/openai-agents-sdk-demo/
│   ├── route.ts
│   ├── mcp/route.ts
│   └── realtime/
│       ├── client-secrets/route.ts
│       ├── sip/route.ts
│       └── twilio/incoming-call/route.ts
└── demos/openai-agents-sdk-demo/page.tsx
components/openai-agents-sdk-demo/
├── openai-agents-sdk-demo-runtime-inspector.ts
├── openai-agents-sdk-demo-screen.tsx
├── openai-agents-sdk-demo-session.ts
├── openai-agents-sdk-demo-voice-panel.tsx
├── openai-agents-sdk-demo-voice-utils.ts
├── openai-agents-sdk-demo-workspace-layout.ts
└── openai-agents-sdk-demo-workspace.tsx
lib/openai-agents-sdk-demo/
├── README.md
├── message-metadata.ts
├── voice-lane.ts
├── server/
│   ├── agents.ts
│   ├── approvals.ts
│   ├── chat.ts
│   ├── context.ts
│   ├── demo-mcp-server.ts
│   ├── extensions.ts
│   ├── handoff-extensions.ts
│   ├── handoffs.ts
│   ├── guardrails.ts
│   ├── guide-coverage.ts
│   ├── mcp.ts
│   ├── models.ts
│   ├── results.ts
│   ├── running.ts
│   ├── sandbox.ts
│   ├── sessions.ts
│   ├── stream-artifacts.ts
│   ├── streaming.ts
│   ├── tracing.ts
│   ├── voice-extensions.ts
│   ├── voice-cloudflare-app.ts
│   ├── voice-cloudflare-worker-module.ts
│   ├── voice-cloudflare-worker.ts
│   ├── voice-realtime.ts
│   ├── voice-server-audio.ts
│   ├── voice-sip-route.ts
│   ├── voice-sip.ts
│   ├── voice-twilio-app.ts
│   ├── voice-twilio-bridge.ts
│   ├── voice-twilio-route.ts
│   ├── voice-websocket.ts
│   ├── voice.ts
│   ├── runtime.ts
│   └── tools.ts
```

## Contracts

- Missing `AI_GATEWAY_API_KEY` blocks chat requests with an explicit setup error.
- The backend source core stays on the official OpenAI Agents SDK run path.
- The route returns the official AI SDK UI bridge response instead of a repo-local custom stream format.
- The current Tools slice wires `tool()`, one approval-required `tool({ needsApproval: true })`, `webSearchTool()`, `fileSearchTool()` when vector stores are configured, `codeInterpreterTool()`, `imageGenerationTool()`, `toolSearchTool()` on supported GPT-5.4+/5.5 models, and `agent.asTool()` into the main agent.
- Tool availability stays explicit. In the current AI Gateway Responses configuration, `imageGenerationTool()` is registered but provider-blocked for user-facing runs because streamed hosted image generation does not return a renderable artifact to the AI SDK UI bridge.
- The current Guardrails slice wires one input guardrail and one output guardrail into the main agent, returns explicit tripwire errors, and surfaces per-run guardrail evaluation back to the UI through message metadata.
- The current Running Agents slice uses the official `run()` helper with explicit `maxTurns`, request-scoped `AbortSignal`, and provider-aware continuation: true OpenAI Responses ids (`resp_*`) use `previousResponseId`, while AI Gateway ids (`gen_*`) continue through `MemorySession` history instead of being sent back as unusable response ids.
- The current Streaming slice keeps the official `createAiSdkUiMessageStream()` bridge for assistant text while wrapping the underlying `RunStreamEvent` iterable with a thin observer that records `agent_updated_stream_event`, `raw_model_stream_event`, and `run_item_stream_event` metadata for the runtime inspector.
- The workspace inspector now exposes the latest stream summary: agent names, raw model event count/types/sources, and run-item event count/names.
- The current Agent Orchestration slice treats the already-configured `research_memo_agent` specialist as the first official `agent.asTool()` coverage path. When that tool runs, the workspace marks both `Tools` and `Agent Orchestration` from real run metadata.
- The current Handoffs slice exposes one specialist agent directly in `handoffs: [agent]` and one explicit `handoff()` with `inputType`, `onHandoff`, and a tool-history filter. The workspace inspector now exposes configured handoffs plus per-run active-agent, target, and transition metadata from real handoff items.
- The current Results slice waits for `await agentStream.completed`, then maps the settled `RunResult` surface into message metadata: `activeAgent`, `lastAgent`, `finalOutput`, `history`, `newItems`, `output`, `interruptions`, `state.usage`, and `rawResponses`.
- The workspace inspector now exposes the latest settled result summary: active agent, final output preview, history/output/new-item counts, interruption count, usage totals, and whether resumable run state was captured.
- The current Human-in-the-loop slice pauses on a real approval-required tool, surfaces AI SDK approval cards in the chat, serializes paused `RunState`, and resumes through `RunState.fromString(...)` plus `state.approve(...)` / `state.reject(...)`.
- The workspace inspector now exposes the latest approval summary: pending approvals, reviewer decisions, and whether a paused run state is serialized and ready to resume.
- The current Sessions slice passes an official `MemorySession` into every `run(...)`, carries the session id through assistant metadata, reuses the same session for AI Gateway follow-ups, true `previousResponseId` follow-ups, and approval resume, and exposes session profile plus latest session summary in the workspace inspector.
- The current Context Management slice builds a typed local `RunContext<T>` object from the latest user turn plus `MemorySession`, passes it through `run(..., { context })`, uses dynamic instructions on the main agent, reads `runContext.context` in `tool()` and guardrail callbacks, and exposes context summary/profile in the runtime inspector.
- The current MCP slice uses the official local `MCPServerStreamableHttp` path against a demo-local Streamable HTTP MCP route, connects servers through `connectMcpServers(...)`, passes `mcpServers.active` into `Agent.mcpServers`, enables `includeServerInToolNames`, and exposes connection state plus prefixed MCP tool usage in the runtime inspector.
- The current Tracing slice keeps the official per-run tracing path on `run(...)`: explicit `workflowName`, `traceId`, `groupId`, `traceMetadata`, `tracingDisabled`, `traceIncludeSensitiveData`, and optional `tracing.apiKey` override. The workspace inspector exposes the latest trace summary plus the tracing setup contract.
- The current Sandbox Agents slice keeps the official sandbox path on `SandboxAgent`, `Manifest`, `Capabilities.default()`, `UnixLocalSandboxClient`, and `run(..., { sandbox })`. The sandbox specialist mounts `docs/frontend` and the demo feature slice read-only, persists `sessionState` by demo session id, and exposes sandbox profile/summary metadata in the workspace inspector.
- The current Extensions / AI SDK Integration slice keeps the official `@openai/agents-extensions/ai-sdk-ui` bridge on the route, exposes bridge usage through assistant metadata, and keeps the beta `aisdk(model)` adapter as an explicit `not-used` provider boundary while the run depends on deferred Responses tool loading.
- The current Voice Agents slice exposes the official `RealtimeAgent` / `RealtimeSession` primitives, WebRTC browser transport, a real `/api/demos/openai-agents-sdk-demo/realtime/client-secrets` route backed by `client.realtime.clientSecrets.create()`, successful client-secret minting counted as `send_message` usage for `openai-agents-sdk-demo`, and a browser voice lane that calls `session.connect({ apiKey })`. The workspace now keeps the main surface to two columns by moving voice entry into a compact screen-rail strip plus a detail dialog, while the full realtime controls, transcripts, approvals, and event feed stay inside that dialog. That voice lane also carries official realtime function tools, an approval-required publish tool, one realtime handoff target, suggested smoke prompts, and visible session-event state.
- The current server-side transport slice now includes a real `OpenAIRealtimeWebSocket` session factory in `server/voice-websocket.ts`. It proves the official server transport path, keeps raw event access on `session.transport.sendEvent()`, and still requires a custom audio pipeline before it becomes a full end-to-end product lane.
- The current server-audio slice now includes a real `RealtimeSession.sendAudio()` loop in `server/voice-server-audio.ts`. It buffers `session.on("audio")` output chunks, forwards raw `transport_event` items, exposes `session.transport.requestResponse()` and `RealtimeSession.interrupt()`, and keeps the application-owned capture/playback layer explicit.
- The current SIP transport slice now includes a real `OpenAIRealtimeSIP` session factory in `server/voice-sip.ts` plus an `OpenAIRealtimeSIP.buildInitialConfig()` helper for call-accept payloads. It keeps the `callId` and provider call-control contract explicit instead of pretending the current browser page can start SIP calls directly.
- The current SIP route slice now includes a real `/api/demos/openai-agents-sdk-demo/realtime/sip` endpoint in `server/voice-sip-route.ts`. It validates `callId`, gates on `OPENAI_API_KEY`, and returns the official `OpenAIRealtimeSIP.buildInitialConfig()` payload so an external SIP provider or a future OpenAI call-control lane can accept the call without rebuilding session config logic outside the SDK.
- The current provider-extension slice now includes real `CloudflareRealtimeTransportLayer` and `TwilioRealtimeTransportLayer` factories in `server/voice-extensions.ts`. They preserve the official extension primitives, require a native `OPENAI_API_KEY`, and keep provider/runtime prerequisites explicit.
- The current Cloudflare worker slice now includes a real runtime wrapper in `server/voice-cloudflare-worker.ts`. It consumes `CloudflareRealtimeTransportLayer`, connects through `RealtimeSession.connect(...)`, and keeps the workerd-specific `fetch() + Upgrade: websocket`, `skipOpenEventListeners: true`, and `nodejs_compat` contract explicit without pretending the Next app already runs inside Cloudflare Workers.
- The current Cloudflare worker-app slice now includes a real fetch-wrapper factory in `server/voice-cloudflare-app.ts`. It follows the official worker entry shape with `export default { fetch(request, env, ctx) }`, exposes `/` health plus `/connect` session-bootstrap behavior, validates the `Upgrade: websocket` contract up front, and composes the existing Cloudflare transport runtime instead of inventing a repo-local transport.
- The current Cloudflare worker-module slice now includes a deployable module wrapper in `server/voice-cloudflare-worker-module.ts`. It exports the actual `fetch(request, env, ctx)` entry contract on top of the existing worker app factory, so the remaining gap is deployment/runtime wiring and live socket verification, not missing SDK glue.
- The current Twilio call-control slice now includes a real `/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call` endpoint in `server/voice-twilio-route.ts`. It returns TwiML `<Connect><Stream />`, requires `OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL` to point at an external `wss://` media-stream server, and keeps the WebSocket hosting boundary explicit instead of pretending the current Next route already terminates Twilio media streams.
- The current Twilio media-stream slice now includes a real bridge factory in `server/voice-twilio-bridge.ts`. It consumes `TwilioRealtimeTransportLayer`, connects the session with `RealtimeSession.connect(...)`, and closes the session when the upstream Twilio websocket closes. Hosting the websocket server is still an external deployment concern, and the demo keeps that contract explicit.
- The current Twilio deployed-server slice now includes a real app factory in `server/voice-twilio-app.ts`. It follows the official Fastify/WebSocket example shape with `/`, `/incoming-call`, and `/media-stream` entry points, derives the public `wss://.../media-stream` URL from the incoming request host, and composes the existing TwiML builder plus realtime bridge so an external server can reuse demo-local voice primitives without rewriting them.
- `server/handoff-extensions.ts` is a local copy of the official handoff prompt-prefix and `removeAllTools` semantics. It exists because the published `@openai/agents-core/extensions` entry is not resolvable from the current app package graph even though the upstream package ships those helpers.
