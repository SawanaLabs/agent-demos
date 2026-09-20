---
title: Docs Index
description: Entry point for project-specific durable knowledge and docs domains.
updateAt: 2026-08-17
---

# Docs Index

Start here, then read `docs/DOCS.md` for cross-domain conventions. Follow the domain links only when the current task touches that area.

## Domains

- [Repo](./repo/index.md): Monorepo layout, workspace boundaries, and root workflow conventions.
- [Quality](./quality/index.md): Ultracite, Biome, type checking, and quality-gate behavior.
- [Frontend](./frontend/index.md): Next.js app wiring and shared workspace UI conventions.
- [Observability](./observability/index.md): Development-only observability harness, metrics/logs/traces boundaries, and backend-adapter conventions.
- [Telemetry](./telemetry/index.md): Production product analytics, runtime error logging, privacy, deployment gates, and registry isolation.
- [Planning](./planning/index.md): Recoverable work topics, intended future states, and planning docs for future agents or teammates.
- [Research](./research/index.md): 模型成本、工具与产品技术选择的研究证据和比较边界。

<!-- BEGIN:docs-generated-catalog -->
| File | Title | Description | Updated |
| --- | --- | --- | --- |
| ./DOCS.md | Project Knowledge Protocol | Cross-domain language, collaboration conventions, and repository boundary rules. | 2026-06-02 |
| ./frontend/DOCS.md | Frontend Knowledge Protocol | Domain-level language, reading path, and boundary principles for frontend work. | 2026-06-01 |
| ./frontend/agent-demo-structure.md | Agent Demo Structure | Durable conventions for organizing independent full-stack agent demos as portable feature slices. | 2026-07-01 |
| ./frontend/ai-sdk-recipes-checklist.md | AI SDK Recipes Checklist | Working checklist for turning AI SDK recipe, guide, and docs examples into portable Agent Demos. | 2026-06-16 |
| ./frontend/canvas-agent.md | Canvas Agent | Independent canvas workflow runtime and floating conversation contract. | 2026-09-21 |
| ./frontend/canvas-node-research.md | 无边画布节点职责与竞品研究 | 图片与视频工作流的节点分类、竞品证据，以及 Canvas Agent 的产品设计建议。 | 2026-09-20 |
| ./frontend/customer-memory-agent.md | Memory & Persistence Agent | Stable source-core, storage, and compaction conventions for the Batch 6 memory and persistence demo. | 2026-06-09 |
| ./frontend/depth-video-tool.md | Depth Video Tool | Product and runtime boundary for the browser-local depth video processor. | 2026-09-20 |
| ./frontend/generative-ui.md | Generative UI | Stable conventions for the Generative UI Agent Demo. | 2026-06-15 |
| ./frontend/homepage-gallery.md | Homepage Gallery | Durable conventions for the homepage surface that presents agent demos. | 2026-09-21 |
| ./frontend/image-workflow-agent.md | Image Workflow Agent | Stable UI, route, and copy-boundary conventions for the image workflow canvas demo. | 2026-08-20 |
| ./frontend/index.md | Frontend | Navigation for Next.js app and shared UI package conventions. | 2026-06-16 |
| ./frontend/langgraph-agent.md | LangGraph Agent | Durable conventions for the LangChain/LangGraph plus Next.js, AI SDK, and AI Elements demo. | 2026-06-04 |
| ./frontend/loop-agent.md | Loop Agent | Stable UI, reasoning-display, and HITL conventions for the loop-agent support triage demo. | 2026-05-24 |
| ./frontend/mcp-agent.md | MCP Agent | Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo. | 2026-06-11 |
| ./frontend/minimal-chat-agent.md | Minimal Chat Agent | Source-backed conventions for hosted search, public GitHub lookup, and questionnaire-driven human-in-the-loop tool output. | 2026-09-20 |
| ./frontend/multimodal-chatbot.md | Multi-Modal Chatbot | Durable conventions for the image and PDF chat demo, including local QA boundaries for page-render hangs. | 2026-06-02 |
| ./frontend/openai-agents-sdk-demo.md | OpenAI Agents SDK Demo | Complete copy-boundary, capability coverage, and bridge conventions for the ultra OpenAI Agents SDK demo running through AI Gateway. | 2026-06-16 |
| ./frontend/persistent-agent.md | Persistent & Resume Agent | Batch 6.5 rules for URL-backed chat persistence, visitor isolation, and resumable streams. | 2026-06-01 |
| ./frontend/project-guide-companion.md | Project Guide Companion | Site-owned companion chatbot boundary, page visibility policy, session history policy, model selector, and Project Docs MCP answer surface. | 2026-06-16 |
| ./frontend/rag-chatbot.md | RAG Chatbot | Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo. | 2026-06-08 |
| ./frontend/registry-sync.md | Registry Sync | Author-side rules for keeping app-first Agent Demos aligned with registry copy boundaries. | 2026-06-04 |
| ./frontend/sandbox-agent.md | Sandbox Agent | Stable source-core, preview, and sandbox lifecycle conventions for the shipped sandbox-agent demo. | 2026-06-03 |
| ./frontend/shadcn-registry-distribution.md | shadcn Registry Distribution | Durable rules for packaging Agent Demos as shadcn registry items. | 2026-06-04 |
| ./frontend/site-usage-gate.md | Site Usage Gate | Visitor credit allowance, resource pricing, atomic spending, and homepage balance UI for the published demo website. | 2026-09-21 |
| ./frontend/skills-agent.md | Skills Agent | Stable source-core, sandbox lifecycle, runtime toolchain, and UI conventions for the shipped skills-agent demo. | 2026-06-03 |
| ./frontend/system-status-pages.md | System Status Pages | Durable conventions for branded app-level error, global-error, 404, and client exception reporting surfaces. | 2026-08-17 |
| ./frontend/trace-eval-agent.md | Trace and Eval Agent | Stable research-agent, product trace-panel, and eval-pipeline conventions for the trace-eval-agent demo. | 2026-06-12 |
| ./frontend/ultra-chatbot-agent-source-checklist.md | Ultra Chatbot Agent Source Checklist | Source-tree checklist for the vercel/chatbot application-shape port. | 2026-05-28 |
| ./frontend/ultra-chatbot-agent.md | Ultra Chatbot Agent | Product and architecture boundary for the vercel/chatbot application-shape port. | 2026-06-04 |
| ./frontend/workspace-ui.md | Workspace UI | Durable conventions for shared UI exports and Next.js app consumption. | 2026-05-26 |
| ./observability/DOCS.md | Observability Knowledge Protocol | Domain-level language and boundaries for the development-only observability harness. | 2026-09-21 |
| ./observability/development-harness.md | Development Harness | Development-only lifecycle, exposure, storage, and adapter boundaries for the observability harness. | 2026-09-21 |
| ./observability/index.md | Observability | Navigation for development-only observability harness knowledge. | 2026-06-16 |
| ./observability/victoriametrics.md | VictoriaMetrics | First metrics backend integration and numeric latency signal boundaries for the development observability harness. | 2026-06-16 |
| ./planning/DOCS.md | Planning Knowledge Protocol | Domain-level language, reading path, and boundary principles for recoverable planning docs. | 2026-05-29 |
| ./planning/index.md | Planning | Navigation for recoverable planning docs and future work topics. | 2026-05-29 |
| ./planning/work-roadmap.md | Work Roadmap | Recoverable work topics and intended future states for this repository. | 2026-06-03 |
| ./quality/DOCS.md | Quality Knowledge Protocol | Domain-level language, reading path, and boundary principles for quality tooling and verification. | 2026-06-04 |
| ./quality/environment-config.md | Environment Config | Durable rules for environment-variable contracts, env modules, and direct process.env usage. | 2026-09-21 |
| ./quality/index.md | Quality | Navigation for quality tooling and verification workflow knowledge. | 2026-06-04 |
| ./quality/integration-testing.md | Integration Testing | General conventions for repository integration tests, including Vercel Sandbox-backed contract tests. | 2026-06-12 |
| ./quality/resource-abuse-privacy-review.md | Resource Abuse and Privacy Review | Focused review boundary for protecting provider spend, hosted resources, private demo data, and project code integrity. | 2026-06-04 |
| ./quality/ultracite.md | Ultracite | Durable conventions for the repository's Ultracite and Biome quality gate. | 2026-06-08 |
| ./repo/DOCS.md | Repo Knowledge Protocol | Domain-level language, reading path, and boundary principles for repository layout and workspace workflow. | 2026-05-26 |
| ./repo/database-workflow.md | Database Workflow | Durable rules for schema sync, Drizzle CLI usage, and escalation when database changes are blocked. | 2026-05-26 |
| ./repo/index.md | Repo | Navigation for repository layout and workflow knowledge. | 2026-05-21 |
| ./repo/monorepo.md | Monorepo | Durable conventions for the pnpm and Turborepo workspace structure. | 2026-06-02 |
| ./research/DOCS.md | Research Knowledge Protocol | Evidence, freshness, and scope conventions for reusable project research. | 2026-09-21 |
| ./research/index.md | Research | 按主题组织模型、工具与产品技术选择的研究证据。 | 2026-09-21 |
| ./research/text-model-cost-research.md | 文本模型标价与任务成本研究 | GPT-4.1 mini、GPT-5 mini 与 GPT-5.6 Luna 的官方标价、Artificial Analysis 任务成本与比较边界。 | 2026-09-21 |
| ./telemetry/DOCS.md | Telemetry Knowledge Protocol | Domain language and hard boundaries for deployed product analytics and runtime error logging. | 2026-08-17 |
| ./telemetry/index.md | Telemetry | Navigation for deployed product analytics and runtime error logging knowledge. | 2026-08-17 |
| ./telemetry/production-telemetry.md | Production Telemetry | GA4 product analytics and Vercel Runtime Logs contracts for the published Agent Demos site. | 2026-08-20 |
<!-- END:docs-generated-catalog -->
