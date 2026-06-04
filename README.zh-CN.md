# Agent Demos

[English](./README.md) | [简体中文](./README.zh-CN.md)

Agent Demos 帮你把 agent 原型变成可上线应用。

选一个生产可用 demo 切片，把指南交给 Codex，约 1 小时内跑通并部署一个 Next.js agent app。已有 LangGraph Agent，也可以用它快速接到真实 Web 产品界面。

- 在线体验：[agent-demos.hsawana9.com](https://agent-demos.hsawana9.com)
- Registry 指南：[agent-demos.hsawana9.com/registry-guide](https://agent-demos.hsawana9.com/registry-guide)
- 公开 registry namespace：`@agent-demos`
- 许可证：MIT

## 为什么做这个项目

Agent 开发者通常会遇到三种不顺手的路径：示例代码停在上线前，模板把项目锁进一种起步形态，完整应用又很难拆成可复用部分。

Agent Demos 给 Codex 一条可执行的上线路径，也给开发者一组可插拔 demo 切片。选择需要的 agent 场景，通过 registry 安装切片，让 Codex 适配到你的项目，然后从可运行代码开始上线。

## 安装一个 Demo

在已经初始化 shadcn/ui 的 Next.js App Router 项目里使用公开 registry：

```bash
pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/foundation-chat
```

在目标应用里设置 `AI_GATEWAY_API_KEY`，启动应用，然后打开 `/demos/foundation-chat`。

`foundation-chat` 是推荐的第一个安装项，因为它是最小的完整聊天切片。你也可以把它替换成其他公开 demo slug 来安装特定 agent pattern。

## Agent 应用场景覆盖

这个项目通过多个 demo 覆盖实际 agent 应用场景，避免把项目压成一个泛用聊天机器人示例。

| 场景 | Demos | 覆盖内容 |
| --- | --- | --- |
| 聊天基础能力 | `foundation-chat`, `streaming-chat-shell`, `persistent-agent`, `ultra-chatbot-agent` | 基础聊天运行时、流式 trace、URL 持久化、可恢复 stream，以及完整应用形态的 chatbot pattern。 |
| 知识库与记忆 | `rag-chatbot`, `customer-memory-agent` | 文档检索、持久化存储、显式 memory 写入、thread 持久化，以及 handoff compaction。 |
| 多模态与结构化生成 | `multimodal-chatbot`, `object-generation` | 图片/PDF 输入、结构化输出、schema 驱动生成，以及 assistant message 内对象渲染。 |
| 工具循环与评估 | `loop-agent`, `trace-eval-agent` | 并行工具调用、依赖检查、人类审批、有界循环控制、telemetry，以及 judge-style eval。 |
| 工作区与代码 agent | `sandbox-agent`, `skills-agent` | sandbox 文件操作、命令执行、实时预览、仓库本地 skill 加载，以及可复用 skill 草稿生成。 |
| 运行时与框架桥接 | `mcp-agent`, `langgraph-agent`, `openai-agents-sdk-demo` | MCP 工具发现、LangGraph Agent Server streaming，以及通过现有 UI shell 集成 OpenAI Agents SDK。 |

## Demo Catalog

| Demo | Registry | Pattern | 摘要 |
| --- | --- | --- | --- |
| Foundation Chat | Public | Foundation | 接入 AI Gateway 和 AI SDK 6 的生产可用基础聊天切片。 |
| RAG Chatbot | Public | RAG | 基于持久化存储的知识库摄入与检索。 |
| Multi-Modal Chatbot | Public | Multimodal | 在单轮对话中处理用户提供的图片和 PDF。 |
| Object Generation | Public | Structured output | 从文本、图片和 PDF 生成类型化对象，并在 assistant message 中渲染。 |
| Memory & Persistence Agent | Public | Tools | 持久化聊天 thread、显式 memory-tool 写入和 handoff compaction。 |
| Persistent & Resume Agent | Public | Foundation | URL-backed 聊天、visitor 隔离、Postgres 持久化和可恢复 stream。 |
| Streaming Chat Shell | Public | Foundation | 共享聊天状态、feature-local 请求元数据和可回放 SSE trace。 |
| Loop Agent | Public | Loop | 带上下文查询、SLA 检查、人类审批和有界循环控制的支持分诊 agent。 |
| LangGraph Agent | Public | LangGraph | 连接独立 LangGraph 后端的 Next.js 与 AI Elements 前端切片。 |
| Skills Builder Agent | Public | Skills | sandbox-backed ToolLoopAgent，按需加载仓库本地 skills 并生成可复用 `SKILL.md` 草稿。 |
| Sandbox Workspace Agent | Public | Sandbox | 在 sandbox workspace 中生成文件、执行命令并提供实时预览。 |
| MCP Runtime Doctor Agent | Public | MCP | 通过 namespaced tool calls 使用 MCP 做运行时和仓库检查。 |
| Trace and Eval Agent | Public | Tools | 带来源、回答形态和期望路径检查的实时 research agent。 |
| OpenAI Agents SDK Demo | Repo demo | Foundation | 把 OpenAI Agents SDK 后端桥接进共享 AI SDK UI workspace。 |
| Ultra Chatbot Agent | Repo demo | Foundation | 应用形态 chatbot port，包含 visitor-owned URLs、模型选择、持久化和可恢复 stream。 |

公开 registry 源由 `registry/registry-demos.json` 跟踪。Repo demo 可以在本仓库里交互体验，但进入公开 registry export 前还需要更窄的 portable packaging contract。

## 相关资源

这个项目建立在 Next.js 与 AI agent 生态里的公开文档、工具和开源工作之上。`/registry-guide` 页面也采用同一套思路，只是把它变成可执行路径：先用 shadcn Create 创建项目，再安装一个 registry slice，配置 AI Gateway，然后把聚焦的任务说明交给 coding agent。

| 资源 | 在本项目里的作用 |
| --- | --- |
| [AI SDK](https://ai-sdk.dev/docs) | 核心 TypeScript agent、chat、streaming、tool-calling、structured output、persistence、testing 和 telemetry 契约。 |
| [AI Elements](https://elements.ai-sdk.dev/docs) | shadcn-style AI interface components，用于 conversations、messages、prompt input、tool state、reasoning、sources 和 workflow UI。 |
| [shadcn/ui](https://ui.shadcn.com/docs) 与 [shadcn Create](https://ui.shadcn.com/create) | source-owned UI primitives，以及在安装 demo slice 前快速创建带样式的 Next.js consumer app。 |
| [shadcn Registry](https://ui.shadcn.com/docs/registry) | `@agent-demos` 使用的分发模型，用来发布可复制 pages、routes、components、libs 和 env examples。 |
| [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/authentication) | 公开 demos 默认 provider contract，让安装后的 demo 可以从一个 server-side key 起步。 |
| [Next.js](https://nextjs.org/docs) 与 [Turborepo](https://turbo.build/repo/docs) | gallery、registry guide、demo routes 和 packages 使用的 App Router 与 monorepo 基础。 |
| [next-forge](https://www.next-forge.com/docs) | production-grade Turborepo/Next.js 参考，适合想在 copied demo slices 外围补齐更完整 SaaS 应用壳的团队。 |
| [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) | sandbox-oriented demos 背后的隔离命令/文件执行和 live-preview 基础设施。 |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | LangGraph Agent frontend bridge 使用的 stateful Python agent runtime。 |
| [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) | OpenAI Agents SDK Demo 及其 AI SDK UI bridge 使用的官方 Agents SDK runtime。 |
| [Model Context Protocol](https://modelcontextprotocol.io/docs) | MCP Runtime Doctor Agent 演示的 tool discovery 与 runtime integration protocol。 |
| [Matt Pocock's skills](https://github.com/mattpocock/skills) 与 [agent-docs-system-skill](https://github.com/multicul-silver-wolf/agent-docs-system-skill) | registry guide 引用、Skills Builder Agent 也会探索的 agent workflow 与 project-memory 资源。 |

## 仓库结构

```text
apps/web/                 Next.js demo gallery、demo routes 和 registry guide
apps/langgraph-agent-api/  LangGraph Agent demo 使用的 Python LangGraph 后端
packages/ui/              共享 shadcn/ui、AI Elements、Tailwind、hooks 和 UI utilities
packages/database/        共享 Drizzle schema 和数据库工具
registry/                 用于公开 demo 安装的源 shadcn registry slices
apps/web/public/r/        Web 应用提供的生成后静态 registry JSON
docs/                     持久化项目文档和仓库约定
CONTEXT.md                Agent Demos 的产品语言和术语表
```

## 本地开发

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

打开 `http://localhost:3000`。

大多数 demo 需要 `AI_GATEWAY_API_KEY`。持久化、Redis-backed streaming、Vercel Sandbox 和 LangGraph demos 还有额外的可选或 demo-specific 环境变量，相关信息在对应的 `.env.example`、demo UI、registry item 或内部文档中。

本地 LangGraph stack：

```bash
pnpm dev:langgraph-agent
```

## Registry Author Workflow

修改 registry source 或 demo availability 时使用这些检查：

```bash
pnpm registry:check
pnpm registry:validate
pnpm registry:build
```

`pnpm registry:build` 会从 source registry files 重新生成 `registry.json` 和 `apps/web/public/r/*`。不要手动编辑生成后的公开 registry JSON。

## 质量门禁

```bash
pnpm check
pnpm typecheck
pnpm build
```

针对核心契约变更，运行被触达 package 里最接近的测试或 integration command。针对 registry distribution 变更，在干净的 shadcn Next.js consumer app 中验证安装项之后再视为 release-ready。

## 项目文档

修改产品语言、copy boundary 或 registry distribution 行为之前，先读这些文件：

- `CONTEXT.md`
- `docs/index.md`
- `docs/DOCS.md`
- `docs/frontend/shadcn-registry-distribution.md`
- `docs/repo/monorepo.md`

## 许可证

MIT，copyright 2026 SawanaLabs。
