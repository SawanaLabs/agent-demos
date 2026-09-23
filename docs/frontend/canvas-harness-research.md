---
title: Canvas Agent Harness 选型研究
description: AI SDK HarnessAgent、Pi 与按需 Skills 对 Canvas 编排场景的收益、限制和验证方案。
updateAt: 2026-09-21
---

# Canvas Agent Harness 选型研究

## Scope

2026-09-21 的官方文档、上游 README 和本地源码研究。未安装新依赖、运行候选 Harness、修改应用或做性能对比。以下建议为 Proposed，不能视为迁移验收结论。上游 main 和在线文档会变化，实施时需要重新锁定版本。

## 当前实现

- `apps/web/package.json` 和 `packages/ui/package.json` 声明 `ai: ^6.0.188`。
- `apps/web/features/canvas-agent/server/handler.ts` 使用 `streamText`、`stepCountIs(12)` 和带 execute 的工具，已经有多步工具循环；串行修改图，通过 `data-canvas` 发布状态。
- Agent 调用节点编辑、连接、查询、整理和运行工具；`server/runner.ts` 执行生成及资源计费。工作流节点失败返回结构化结果，Agent 可以继续对话。
- 文本多结果由 runner 的 `generateText + Output.object` 产生，图片多结果由 `generateImage` 产生。此能力与对话编排运行时独立。
- 仓库已有 `skills-agent`：`server/official-tools.ts` 使用 `bash-tool` 的 `experimental_createSkillTool`，并在沙箱内刷新技能目录。增加 Skills 无须先采用新 Harness；其完整沙箱工作台也不应直接搬入 Canvas。

## 官方能力与边界

AI SDK 7 的 HarnessAgent 将外部 Agent 运行时接入统一 Agent 接口，提供 generate/stream、自定义工具、Skills、会话生命周期、审批与流式事件等接口。能力仍受适配器限制，不能假定每个运行时完全等价。Harness 包仍标记 experimental。

当前官方适配器目录列出 Claude Code、Cline、Codex、Cursor、Deep Agents、fx、GitHub Copilot、Grok Build、OpenCode、Pi。Amp、Goose、Mastra 位于 Coming Soon。该目录与最早只列三个适配器的发布公告不同。

| 方案 | 与 Canvas 有关的特征 | 代价或限制 |
| --- | --- | --- |
| 现有 AI SDK 工具循环，可按需整理成 ToolLoopAgent | 已有工具契约、流式 UI、节点执行分离；普通工具即可加载 Skills | 长会话存储、压缩策略仍需接入；换成 ToolLoopAgent 本身不保证编排更准确 |
| HarnessAgent + Pi | 多供应商；宿主 Node 进程运行；Skills、压缩、会话；复用 AI SDK 自定义工具；thinkingLevel 支持 medium | 仍需 sandbox 接口；新增会话管理；适配层 experimental；原生插件能力只部分开放 |
| HarnessAgent + Claude Code | Claude Agent SDK 和 CLI；技能和工具生态；沙箱内桥接 | 需要支持网络端口的沙箱、CLI 和桥接生命周期；当前纯画布编排较少用到代码工作区能力 |
| HarnessAgent + Codex | Codex SDK 和 CLI；沙箱内桥接；可接业务工具 | 同样需要沙箱桥接；不能假定其模型与技能加载语义和 Pi 完全相同 |

Pi 适配器的已核实细节：

- Pi 本体运行在宿主 Node 进程，沙箱提供文件和 shell 能力，不需要在沙箱内安装桥接进程或暴露端口。官方提供 Vercel Sandbox 和 just-bash 两种接法；本地 shell 仿真不等于完整系统运行环境。
- 支持 `auth: 'ai-gateway'`、显式自定义 provider/model 配置和 `thinkingLevel: 'medium'`。现有模型 ID、Gateway base URL、reasoning 映射必须单独验证。
- `extensionFactories` 只加载显式传入的可信扩展，扩展代码运行在宿主；文件系统自动扩展发现、themes 和 prompt templates 保持禁用。采用 Pi 适配器不等于自动获得全部 Pi CLI 插件。
- 官方 Pi 页面明确不支持 HarnessAgent 的结构化 `output`，会抛 `HarnessCapabilityUnsupportedError`。保留 Canvas runner 的直接模型调用，可继续使用现有结构化文本多结果；不需要让编排层承担结果生成。
- Harness 的 `activeTools` 可以限制内置与业务工具。若保留 Pi 原生按需 Skill 加载，应给它受控读取 Skill 的能力；完全关闭 read/bash 后，需要提供等价 loadSkill 工具并验证实际激活行为。
- Pi 自身明确没有内置子 Agent、计划模式和通用权限弹窗；扩展和 AI SDK 适配层可提供部分相关能力，应分别核实。
- Codex 适配器当前 README 特别描述 factory-level skills 会逐轮内联到用户提示词。该说明只作为适配器文档限制，不能推广为 Codex 产品普遍不支持技能发现，也不能据此断言所有技能入口采用同一机制。

## Skills 的选择

标准 SKILL.md 将名称、描述与正文分开。启动时放入轻量目录，需要时通过读取工具加载正文和引用资源。工具说明一般随可用工具进入模型上下文，不能理解成等到调用后才首次看到。

AI SDK 官方 Skills 指南明确允许技能来自文件、静态资源、API 或远程目录；只有执行附带脚本时才需要命令执行能力。因此，品牌规范、角色一致性、广告分镜、结果分流等 Canvas 编排知识可先按标准格式保存，以受控 loadSkill 工具读取。无需为了这些内容开放任意 shell。

如果未来要支持含脚本、依赖和文件处理的技能，应明确执行归属：Agent 加载流程知识、编排节点；节点执行脚本、生成资产、计费并记录结果。不要让新运行时的内置 bash 成为绕过节点执行记录的路径。

## 建议与验证方案

建议当前继续使用 AI SDK 工具循环并加入按需业务 Skills；在需要长会话压缩、会话恢复、运行中引导或更多运行时扩展时，优先试验 HarnessAgent + Pi。若现在必须在 Pi、Claude Code、Codex 中选择，Pi 最贴合可定制的业务编排方向。这是架构适配判断，尚无本项目成功率、速度或成本优势的实测证据。

不要把升级 AI SDK 7 与切换运行时捆绑成一个不可分割的大改。当前 web/shared UI 都依赖 AI SDK 6，升级影响消息与工具类型、流协议和其他 Demo，需先单独评估。

最小对比试验应使用相同模型、effort、工具 schema 和用户任务；尽可能保持指令一致，并记录 Harness 自身增加的上下文。比较现有实现与 Pi：

1. 从空画布生成两个独立提示词，并将结果 0/1 分别连接两个图片节点。
2. 已有参考图，制作角色网格和 GIF，并保留原结果。
3. 节点因额度不足失败，Agent 解释已完成内容、保留图并可继续编辑。
4. 多轮修改后按需加载一个业务 Skill，压缩后核查图状态和结果路由。
5. 会话跨请求恢复、取消生成，以及手动修改画布后 Agent 读取最新图。

验收比较图正确率、重复生成/扣费、首段响应时间、完整耗时、token 和沙箱成本。必要契约：图仍为权威状态；工具仍通过串行修改入口；AI Elements 保留消息顺序、动态工具和失败结果；会话恢复不能重放已收费执行。Pi 成功率未改善且增加负担时，保留现有实现即可。

近期上游也有 Pi 文件系统镜像、扩展与跨进程工具审批问题及修复记录。示例：#20417 与 #18018 均显示 Closed。历史问题用于确定验证项目，不能当成所选新版本必然仍有故障的证据。

## Sources

- [AI SDK 7 发布](https://vercel.com/changelog/ai-sdk-7)
- [当前 Harness 适配器及能力目录](https://ai-sdk.dev/v7/docs/ai-sdk-harnesses/harness-adapters)
- [HarnessAgent README，含 experimental 状态](https://github.com/vercel/ai/blob/main/packages/harness/README.md)
- [Harness 工具、过滤及审批](https://ai-sdk.dev/v7/docs/ai-sdk-harnesses/tools)
- [Harness Skills](https://ai-sdk.dev/v7/docs/ai-sdk-harnesses/skills)
- [Pi 适配器官方文档](https://ai-sdk.dev/providers/ai-sdk-harnesses/pi)
- [Pi 适配器 README](https://github.com/vercel/ai/blob/main/packages/harness-pi/README.md)
- [Claude Code 适配器 README](https://github.com/vercel/ai/blob/main/packages/harness-claude-code/README.md)
- [Codex 适配器 README](https://github.com/vercel/ai/blob/main/packages/harness-codex/README.md)
- [Pi 本体](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)
- [Pi Skills 加载机制](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md)
- [AI SDK 为普通 Agent 增加 Skills](https://ai-sdk.dev/cookbook/guides/agent-skills)
- [Pi 扩展文件访问问题 #20417](https://github.com/vercel/ai/issues/20417)
- [Pi 跨进程审批问题 #18018](https://github.com/vercel/ai/issues/18018)

## Update Triggers

- 采用新运行时、开放新技能来源或增加脚本型技能前重新核实支持边界。
- 完成同模型对照实验后补充数据，避免将架构推断当作已验证收益。
