# Agent Demos

[English](./README.md) | [简体中文](./README.zh-CN.md)

Agent Demos turns agent prototypes into deployable apps.

Pick a production-ready demo slice, hand the guide to Codex, and ship a working Next.js agent app in about an hour. If you already have a LangGraph agent, use it as the launch path to a real web product.

- Live gallery: [agent-demos.hsawana9.com](https://agent-demos.hsawana9.com)
- Registry guide: [agent-demos.hsawana9.com/registry-guide](https://agent-demos.hsawana9.com/registry-guide)
- Public registry namespace: `@agent-demos`
- License: MIT

## Why This Exists

Agent builders usually face three weak paths: examples that stop before deployment, templates that lock them into one starting shape, or full apps that are hard to break apart.

Agent Demos gives Codex an executable launch path and gives developers a catalog of pluggable demo slices. Pick the agent scenario you need, install the slice through the registry, let Codex adapt it to your project, and ship from working code.

## Install a Demo

Use the public registry from a Next.js App Router project that already has shadcn/ui initialized:

```bash
pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/foundation-chat
```

Set `AI_GATEWAY_API_KEY` in the target app, run the app, then open `/demos/foundation-chat`.

`foundation-chat` is the recommended first install because it is the smallest complete chat slice. You can replace it with another public demo slug when you want a specific agent pattern.

## Agent Scenario Coverage

The project uses multiple demos to cover practical agent application scenarios instead of presenting one generic chatbot.

| Scenario | Demos | What it covers |
| --- | --- | --- |
| Chat foundations | `foundation-chat`, `streaming-chat-shell`, `persistent-agent`, `ultra-chatbot-agent` | Base chat runtime, streaming traces, URL-backed persistence, resumable streams, and full app-shape chatbot patterns. |
| Knowledge and memory | `rag-chatbot`, `customer-memory-agent` | Retrieval over documents, durable storage, explicit memory writes, thread persistence, and handoff compaction. |
| Multimodal and structured generation | `multimodal-chatbot`, `object-generation` | Image/PDF inputs, structured outputs, schema-backed generation, and assistant-rendered objects. |
| Tool loops and evaluation | `loop-agent`, `trace-eval-agent` | Parallel tool calls, dependent checks, human approval, bounded loop control, telemetry, and judge-style evals. |
| Workspace and code agents | `sandbox-agent`, `skills-agent` | Sandbox-backed file work, command execution, live previews, repo-local skill loading, and reusable skill drafting. |
| Runtime and framework bridges | `mcp-agent`, `langgraph-agent`, `openai-agents-sdk-demo` | MCP tool discovery, LangGraph Agent Server streaming, and OpenAI Agents SDK integration through the existing UI shell. |

## Demo Catalog

| Demo | Registry | Pattern | Summary |
| --- | --- | --- | --- |
| Foundation Chat | Public | Foundation | A production-ready base chat wired to AI Gateway and AI SDK 6. |
| RAG Chatbot | Public | RAG | Knowledge-base ingestion and retrieval over durable storage. |
| Multi-Modal Chatbot | Public | Multimodal | Chat over user-provided images and PDFs in a single turn. |
| Object Generation | Public | Structured output | Generate a typed object from text, images, and PDFs, then render it in the assistant message. |
| Memory & Persistence Agent | Public | Tools | Persist chat threads, explicit memory-tool writes, and handoff compactions. |
| Persistent & Resume Agent | Public | Foundation | URL-backed chat with visitor isolation, Postgres persistence, and resumable streams. |
| Streaming Chat Shell | Public | Foundation | Shared chat state, feature-local request metadata, and replayable SSE traces. |
| Loop Agent | Public | Loop | Support triage with context lookup, SLA checks, human approval, and bounded loop control. |
| LangGraph Agent | Public | LangGraph | Next.js and AI Elements frontend wired to a separately running LangGraph backend. |
| Skills Builder Agent | Public | Skills | Sandbox-backed ToolLoopAgent that loads repo-local skills and drafts reusable `SKILL.md` artifacts. |
| Sandbox Workspace Agent | Public | Sandbox | Agent-generated files, command execution, and live preview inside a sandbox workspace. |
| MCP Runtime Doctor Agent | Public | MCP | MCP-backed runtime and repo inspection through namespaced tool calls. |
| Trace and Eval Agent | Public | Tools | Live research run with source, answer-shape, and expected-path evaluation checks. |
| OpenAI Agents SDK Demo | Repo demo | Foundation | OpenAI Agents SDK backend bridged into the shared AI SDK UI workspace. |
| Ultra Chatbot Agent | Repo demo | Foundation | Application-shape chatbot port with visitor-owned URLs, model selection, persistence, and resumable streams. |

The public registry source is tracked in `registry/registry-demos.json`. Repo demos are interactive in this codebase but still need a narrower portable packaging contract before they enter the public registry export.

## Related Resources

This project builds on public docs, tools, and open-source work from the broader Next.js and AI agent ecosystem. The `/registry-guide` page follows the same idea in executable form: start from shadcn Create, install one registry slice, configure AI Gateway, then give a focused task brief to a coding agent.

| Resource | Why it matters here |
| --- | --- |
| [AI SDK](https://ai-sdk.dev/docs) | Core TypeScript agent, chat, streaming, tool-calling, structured output, persistence, testing, and telemetry contracts. |
| [AI Elements](https://elements.ai-sdk.dev/docs) | shadcn-style AI interface components for conversations, messages, prompt input, tool state, reasoning, sources, and workflow UI. |
| [shadcn/ui](https://ui.shadcn.com/docs) and [shadcn Create](https://ui.shadcn.com/create) | Source-owned UI primitives and the fastest path to a styled Next.js consumer app before installing a demo slice. |
| [shadcn Registry](https://ui.shadcn.com/docs/registry) | The distribution model used by `@agent-demos` to ship copyable pages, routes, components, libs, and env examples. |
| [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/authentication) | The default provider contract for public demos so installs can start from one server-side key. |
| [Next.js](https://nextjs.org/docs) and [Turborepo](https://turbo.build/repo/docs) | The app-router and monorepo foundation used by the gallery, registry guide, demo routes, and packages. |
| [next-forge](https://www.next-forge.com/docs) | A production-grade Turborepo/Next.js reference for teams that want a fuller SaaS application shell around copied demo slices. |
| [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) | Isolated command/file execution and live-preview infrastructure behind the sandbox-oriented demos. |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | The stateful Python agent runtime used by the LangGraph Agent frontend bridge. |
| [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) | The official Agents SDK runtime used by the OpenAI Agents SDK Demo and its AI SDK UI bridge. |
| [Model Context Protocol](https://modelcontextprotocol.io/docs) | The tool discovery and runtime integration protocol exercised by the MCP Runtime Doctor Agent. |
| [Matt Pocock's skills](https://github.com/mattpocock/skills) and [agent-docs-system-skill](https://github.com/multicul-silver-wolf/agent-docs-system-skill) | Agent workflow and project-memory resources referenced by the registry guide and explored by the Skills Builder Agent. |

## Repository Layout

```text
apps/web/                 Next.js demo gallery, demo routes, and registry guide
apps/langgraph-agent-api/  Python LangGraph backend used by the LangGraph Agent demo
packages/ui/              Shared shadcn/ui, AI Elements, Tailwind, hooks, and UI utilities
packages/database/        Shared Drizzle schema and database tooling
registry/                 Source shadcn registry slices for public demo installs
apps/web/public/r/        Generated static registry JSON served by the web app
docs/                     Durable project docs and repo-specific conventions
CONTEXT.md                Product language and glossary for Agent Demos
```

## Local Development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Open `http://localhost:3000`.

Most demos need `AI_GATEWAY_API_KEY`. Persistence, Redis-backed streaming, Vercel Sandbox, and LangGraph demos have additional optional or demo-specific environment variables documented in the relevant `.env.example`, demo UI, registry item, or internal docs.

For the local LangGraph stack:

```bash
pnpm dev:langgraph-agent
```

## Registry Author Workflow

Use these checks when changing registry source or demo availability:

```bash
pnpm registry:check
pnpm registry:validate
pnpm registry:build
```

`pnpm registry:build` regenerates `registry.json` and `apps/web/public/r/*` from the source registry files. Do not hand-edit generated public registry JSON.

## Quality Gates

```bash
pnpm check
pnpm typecheck
pnpm build
```

For focused contract changes, run the closest test or integration command in the touched package. For registry distribution changes, prove the item in a fresh shadcn Next.js consumer app before treating it as release-ready.

## Project Docs

Start with these files before changing product language, copy boundaries, or registry distribution behavior:

- `CONTEXT.md`
- `docs/index.md`
- `docs/DOCS.md`
- `docs/frontend/shadcn-registry-distribution.md`
- `docs/repo/monorepo.md`

## License

MIT, copyright 2026 SawanaLabs.
