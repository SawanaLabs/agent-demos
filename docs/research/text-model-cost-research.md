---
title: 文本模型标价与任务成本研究
description: GPT-4.1 mini、GPT-5 mini 与 GPT-5.6 Luna 的官方标价、Artificial Analysis 任务成本与比较边界。
updateAt: 2026-09-21
---

# 文本模型标价与任务成本研究

研究日期：2026-09-21。用户希望比较三个默认文本模型候选的标价，以及完成任务的总成本。本文将用户口述的「Area 的 Index」理解为 Artificial Analysis Intelligence Index。

## 官方标价

单位：美元 / 百万文本 token，普通 API 标价；不包含工具调用、图片生成、网关或基础设施费用。

| 模型及官方来源 | 输入 | 缓存输入 | 输出 |
| --- | ---: | ---: | ---: |
| [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) | 0.40 | 0.10 | 1.60 |
| [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini) | 0.25 | 0.025 | 2.00 |
| [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | 0.20 | 0.02 | 1.20 |

按表中单价计算，Luna 相比 GPT-5 mini 的输入和缓存输入便宜 20%，输出便宜 40%；相比 GPT-4.1 mini 的输入便宜 50%，缓存输入便宜 80%，输出便宜 25%。GPT-5 mini 相比 GPT-4.1 mini，输入较便宜，输出较贵。

Luna 官方注明 reasoning effort 默认 medium。输入超过 272K token 时，整个请求按 2 倍输入价格、1.5 倍输出价格计费；缓存写入按普通输入价格的 1.25 倍计费。上表缓存输入列指缓存读取，不能用于缓存写入。来源：[Luna 模型页](https://developers.openai.com/api/docs/models/gpt-5.6-luna)。

## Artificial Analysis 有任务成本指标

AA 的 `Cost per Intelligence Index Task` 是加权平均任务成本：先对每项评测的输入、缓存读取、缓存写入、推理和答案 token 计算费用，再除以该评测任务数，最后按 Intelligence Index 权重汇总。它涵盖实际 token 消耗差异，不能理解为每个成功任务的成本或每个任务都收取的固定价格。来源：[AA 指标说明](https://artificialanalysis.ai/models/releases/gpt-5-mini)。

另有 `Cost to Run Artificial Analysis Intelligence Index`，汇总整套评测的 token 费用，排除重复运行。它与加权平均任务成本的计算口径不同，不能用两者相除推断任务数量。来源：[AA 成本说明](https://artificialanalysis.ai/models/gpt-4-1-mini/)。

本次查阅的页面快照：

| 模型 / effort | 加权平均每任务成本 | 整套 Index 费用 | 来源 |
| --- | ---: | ---: | --- |
| GPT-4.1 mini / 无推理档位 | N/A | 未取得数值 | [模型页](https://artificialanalysis.ai/models/gpt-4-1-mini/) |
| GPT-5 mini / medium | 未展示 | 未取得数值 | [系列页](https://artificialanalysis.ai/models/releases/gpt-5-mini) |
| GPT-5 mini / high | $0.05 | $188.66 | [模型页](https://artificialanalysis.ai/models/gpt-5-mini) |
| GPT-5.6 Luna / medium | $0.02 | $44.32 | [模型页](https://artificialanalysis.ai/models/gpt-5-6-luna-medium) |
| GPT-5.6 Luna / max | $0.18 | $319.93 | [模型页](https://artificialanalysis.ai/models/gpt-5-6-luna) |

Luna 系列页还展示 low / 无推理约 $0.01、high 约 $0.04、xhigh 约 $0.09 每任务。相同模型的 effort 对实际任务成本影响明显。来源：[Luna 系列页](https://artificialanalysis.ai/models/releases/gpt-5-6-luna)。

### 比较边界

- 以上金额为页面展示的取整结果，价格与评测数据可能更新。
- Luna medium 的公开成本约为 GPT-5 mini high 的 40%，但两个 effort 不同。GPT-5 mini medium 成本缺失，无法据此声称 medium 对 medium 节省 60%。
- 查阅时 Luna medium 和系列页标注 Index v4.3.2，旧模型详情页存在 v4.3 标注；历史测评数据可能未同步到同一版本。上述表格用于记录公开快照，不能当作严格受控的同版本实验。
- GPT-4.1 mini 的 N/A 表示缺少该项数据，不能推出免费或比其他模型便宜。
- 这些指标反映 AA 基准任务。Canvas Agent 的工具调用轮数、上下文长度、重试和图片生成费用会改变用户实际任务成本。

## 对当前项目的启发

Luna medium 的单位标价和公开任务成本都支持将它作为低成本默认模型候选；本研究没有实际运行本项目的模型对照实验，也没有修改模型配置。

后续若要确认收益，可用少量固定的真实任务对照：创建图片工作流、修改已有节点、生成图片后接 GIF。固定提示词、工具集和初始画布，记录完整对话各轮模型费用、工具费用、成功率和耗时。分别汇总文本模型费用与图片生成等工具费用，避免图片成本掩盖模型替换的效果。重试应计入完整任务成本，失败任务也应保留记录。

## 维护

再次据此调整默认模型或预算前，重新打开官方价格页和 AA 对应 effort 页面。不要仅凭模型默认展示的 max 页面推断 medium 成本。
