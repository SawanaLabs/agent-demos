---
title: LangGraph Agent
description: Durable conventions for the LangChain/LangGraph plus Next.js, AI SDK, and AI Elements demo.
updateAt: 2026-06-02
---

# LangGraph Agent

## Scope

- Covers the LangChain/LangGraph Agent Demo under the frontend domain.
- Covers the integration boundary between a LangGraph runtime, a Next.js route handler, AI SDK UI messages, and AI Elements rendering.
- Covers graph-state, checkpoint, interrupt, and stream-display expectations before implementation starts.
- Serves teams that already build agents on Python LangChain/LangGraph and need a fast path from an existing agent to a full-stack product surface.
- Applies the feature-slice and copy-boundary rules from [Agent Demo Structure](./agent-demo-structure.md).

## Domain Language

- **LangGraph runtime**: Feature-local server code that owns LangGraph graph construction, node/tool orchestration, checkpoint config, and LangChain message conversion for this Agent Demo.
- **Graph event stream**: A LangGraph or LangChain stream normalized into AI SDK UI message parts for AI Elements rendering.
- **Graph checkpoint**: Thread-scoped LangGraph state that lets a Demo Workspace resume or inspect a graph run.
- **Graph interrupt**: A human-in-the-loop pause from the graph runtime that requires user input or approval before execution continues.
- **Graph progress surface**: A secondary UI surface that shows node progress, checkpoints, tool calls, and graph-specific state without taking over the main answer path.
- **Remote LangGraph adapter**: Feature-local server boundary that converts this demo's AI SDK UI requests into calls against an independently deployed Python LangGraph agent.
- **Frontend slice distribution**: Registry distribution for the Next.js demo UI and API adapter only; the Python LangGraph agent remains a separately deployed dependency.
- **Thread-scoped persistence**: Official LangGraph checkpoint persistence keyed by `thread_id`, owned by the remote Agent Server or LangSmith Deployment rather than by the Next.js frontend.

## Current Subdomain Docs

- Treat this as a frontend Agent Demo subdomain. Do not create a new first-level docs domain for LangGraph unless LangGraph work grows beyond one demo.
- Use `apps/web/features/langgraph-agent/` as the default feature slice unless the demo slug changes during planning.
- Keep the route entry thin under `apps/web/app/demos/langgraph-agent/page.tsx` and keep any API route thin under `apps/web/app/api/demos/langgraph-agent/route.ts`.
- Use a dedicated `langgraph` catalog pattern for this demo. During implementation, update `DemoPattern`, `demoPatternLabels`, and the demo metadata instead of placing this demo under the existing `loop` pattern.
- Build v1 around a remote Python LangGraph runtime. The frontend demo should prove that an existing Python LangGraph agent can be connected to a product-quality Next.js surface without rewriting the agent in JavaScript.
- Defer the concrete business scenario until the official integration path is proven. Start with a general capability validation graph instead of designing a domain-specific agent first.
- Preserve the official Python LangGraph source-core shape around `langgraph.json`, graph package modules, dependencies, environment variables, streaming, checkpoints, and deployment URL.
- Use `@ai-sdk/langchain` as the bridge only when the chosen backend exposes an in-process LangChain/LangGraph stream to the Next.js server. The implemented v1 uses a remote Python Agent Server over HTTP, so the feature-local adapter normalizes official LangGraph SSE frames into AI SDK UI message chunks directly.
- Keep the client on the repo's existing AI SDK UI shape: `@ai-sdk/react` `useChat`, `DefaultChatTransport` when a custom API path is needed, and AI Elements for message, tool, reasoning, checkpoint, node, edge, and agent visualization.
- Make at least one LangGraph-native capability visible. Good first-version candidates are graph node progress, thread-scoped checkpoint resume, or a human-in-the-loop interrupt. A plain tool loop would duplicate the existing [Loop Agent](./loop-agent.md).
- Keep JavaScript LangGraph as a later runtime variant, not the v1 source core. It can become useful for a single-language Next.js demo after the Python adapter story is proven.
- Treat LangGraph Platform, LangSmith deployment transport, or a compatible self-hosted Python service as valid backend targets when the frontend adapter contract stays stable.
- Treat a Vercel-compatible FastAPI backend as a second deployment entry for the same Python LangGraph backend, not as a second Agent Demo, catalog entry, frontend experience, or replacement graph core. Its job is to preserve the existing frontend Agent Server contract while making the backend deployable on Vercel.
- Keep the Vercel-compatible FastAPI backend acceptance bar intentionally lightweight: the graph can be invoked, the demo can chat, answer tokens can stream, and basic graph progress can reach the existing UI. Durable thread resume, interrupt/resume, crash recovery, and platform-grade concurrency stay outside this deployment entry until explicitly added.
- Keep the existing frontend adapter stable for this lightweight deployment path. The Vercel-compatible backend should implement the same `POST /threads` and thread-scoped `/runs/stream` surface so the frontend can switch between local `langgraph dev`, hosted Agent Server, and Vercel wrapper through `LANGGRAPH_AGENT_API_URL`.
- In the Vercel-compatible backend, treat `/threads` as contract confirmation instead of durable thread creation. Without a persistent checkpointer, ordinary chat continuity depends on the frontend sending the current visible message context with each run request.
- Do not introduce LangServe, LangCorn, `agent-service-toolkit`, or another wrapper framework for the first Vercel-compatible backend. The immediate goal is a small FastAPI adaptation and deployment layer around the existing `langgraph_agent` graph so the Next.js frontend can keep receiving Agent Server-like stream messages.
- Use the official LangGraph Agent Server API as the v1 backend contract. The canonical adapter path creates or confirms a UUID thread through `POST /threads` and then calls the thread-scoped `/runs/stream` endpoint with `assistant_id`, `input.messages`, and `stream_mode`.
- Do not define a custom streaming protocol for v1. If a team already has a FastAPI wrapper or another Python service, the tutorial should show how to adapt that service to the official LangGraph-compatible stream contract.
- Use official LangGraph thread-scoped persistence as the v1 persistence boundary. The Next.js adapter should create, receive, or forward a UUID `thread_id`, confirm it through the official `POST /threads` API, and pass it through the official LangGraph SDK/API when streaming runs.
- Treat threadless `/runs/stream` as an early smoke-test path only. The shipped v1 adapter should use a thread-scoped run so the contract can grow into checkpoint resume and interrupts without changing the integration boundary.
- Let the Python LangGraph Agent Server, LangSmith Deployment, or compatible Agent Server own checkpoints and storage. Do not implement a custom checkpoint store in the Next.js app.
- Treat `langgraph dev` in-memory storage as development/test-only. Production usage requires a LangGraph deployment with persistent storage, following official LangGraph guidance.
- In v1, the frontend may keep the active `thread_id` in request/client state, but it must not add a chat-history database, thread history UI, or cross-thread memory store.
- Keep the tutorial explicit about the difference between LangGraph thread/checkpoint persistence and cross-thread memory stores.
- Use Vercel AI Gateway for LangChain model access when possible. The current Vercel LangChain integration configures `ChatOpenAI` with an AI Gateway API key and `configuration.baseURL`.
- Keep any new environment variables behind feature-local `keys.ts` and `env.ts`; do not scatter direct `process.env` access through graph nodes or UI code.
- Render graph telemetry as secondary evidence. The main conversation should still prioritize the user-facing answer, with node updates, checkpoint state, interrupts, tool calls, and traces in a side panel or collapsible region.
- Use a three-stage capability plan. V1 is visual graph progress plus streaming answer. V2 is checkpoint/thread resume after persistence boundaries are explicit. V3 is human-in-the-loop interrupt and approval/resume UX.
- Keep v1 focused on showing that a remote Python LangGraph agent can stream through the official contract into a product-quality frontend. Do not pull durable resume or approval workflows into v1 unless the user explicitly reopens scope.
- Treat v1 as an official-docs integration spike before product scenario design. The first acceptance target is end-to-end capability: Python LangGraph Agent Server `/runs/stream` -> Next.js adapter -> AI SDK UI stream/data parts -> AI Elements message and graph-progress UI.
- Keep the validation graph intentionally general. It may use simple nodes such as route, plan, tool, synthesize, and answer, but those nodes should exist to verify streaming metadata and UI rendering rather than to define the final demo domain.
- Use `packages/ui` AI Elements primitives through feature-local wrappers. Do not fork AI Elements primitives or add demo-specific graph behavior directly to `packages/ui`.
- For graph visualization, prefer the existing AI Elements workflow primitives already present in `packages/ui/src/components/ai-elements`, especially `node`, `edge`, `checkpoint`, `tool`, `reasoning`, `agent`, and `chain-of-thought`.
- Distribute only the frontend slice through shadcn registry when this demo reaches registry packaging. The registry item may include the Next.js page, route proxy, adapter client, UI wrappers, and documentation, but it must not pretend to install or deploy the Python LangGraph agent.
- Include a concise adapter tutorial for existing Python LangGraph users. It must show the expected backend URL/env keys, the minimal request shape, streaming event expectations, and how to adapt an existing graph without changing the frontend.
- Anchor the tutorial to official LangGraph docs first: local server, application structure, streaming, deployment, and the LangGraph frontend graph-execution pattern. Use custom Python server notes only as migration guidance for teams that have already wrapped their graph.
- Start core-contract tests around request validation, UI message to LangChain message conversion, graph stream normalization, checkpoint/thread-id handling, and interrupt resume decisions.
- If the first version uses only in-memory checkpoints, label that limitation explicitly in the demo copy and README. Do not imply durable persistence until the checkpointer and storage env contract are real.
- If durable checkpoints are added, keep the persistence boundary feature-local first and document the required env keys before wiring the catalog entry as `ready`.
- Record official source anchors in the feature README when implementation begins: AI SDK LangChain adapter, LangGraph overview, LangGraph streaming, LangGraph persistence, Vercel AI Gateway LangChain integration, and AI Elements component docs.
- Choose the final sample-agent scenario only after the general capability validation passes.

## Implementation Status

- V1 is implemented under `apps/web/features/langgraph-agent/` with thin route entries at `apps/web/app/demos/langgraph-agent/page.tsx` and `apps/web/app/api/demos/langgraph-agent/route.ts`.
- The frontend requires `LANGGRAPH_AGENT_API_URL` and `LANGGRAPH_AGENT_ASSISTANT_ID`; `LANGGRAPH_AGENT_API_KEY` is optional for hosted Agent Server deployments.
- The Next.js runtime uses `POST /threads` with `if_exists: "do_nothing"` before `POST /threads/{thread_id}/runs/stream` with `stream_mode: ["updates", "messages-tuple"]`, converts UI messages to LangGraph `human`/`ai`/`system` messages, and emits AI SDK text chunks plus `data-graph-progress` data parts.
- The active thread id is generated client-side as a UUID for the current workspace session. V1 does not add a frontend chat-history database, thread list, cross-thread memory, or durable resume UI.
- The Python validation backend lives in `apps/langgraph-agent-api/` and is managed by `uv`. It exposes graph id `agent` through `langgraph.json`, uses a route -> plan -> tool -> synthesize -> answer graph, and runs locally with `uv run langgraph dev --port 2024`.
- The Python backend also exposes `app.py` as a Vercel-compatible FastAPI entry. This wrapper keeps the existing `POST /threads` and `/threads/{thread_id}/runs/stream` contract, invokes the same compiled graph, and streams only the `updates` plus `messages-tuple` events the frontend already understands.
- Use `pnpm dev:langgraph-agent` to start the fixed-port local Python server and paired Next.js app together. `pnpm dev:langchain-agent` is a compatibility alias for the same command. The underlying API script sources root `.env` and `.env.local`, defaults `LANGGRAPH_AGENT_MODEL` to `openai/gpt-5-mini`, then runs LangGraph on port 2024. The web script points at `http://localhost:2024`, carries the same model default for screen metadata, and keeps the existing Next.js port 3000 contract. Use `pnpm dev:langgraph-agent-api` or `pnpm dev:langgraph-agent-web` only when one side needs to be run independently.
- Local `langgraph dev` uses in-memory persistence for development and testing. Hosted LangGraph or LangSmith deployments own durable persistence for production.
- The Vercel-compatible FastAPI entry currently uses no persistent checkpointer. Treat it as the lightweight hosted chat path for the demo, with continuity supplied by the frontend request messages.

## Open Decisions

- Final sample-agent scenario after general capability validation passes.

## Update Triggers

- Update this file when the demo slug, catalog pattern, primary capability, runtime boundary, or persistence stance changes.
- Update this file when implementation chooses concrete LangGraph packages, checkpointer storage, backend adapter contract, or LangGraph Platform deployment.
- Update this file when general capability validation is complete and the final sample-agent scenario is chosen.
- Update this file when AI SDK LangChain adapter behavior changes the UI message bridge.
- Update this file when AI Elements graph, checkpoint, reasoning, or tool rendering conventions change.
