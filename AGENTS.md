# Repository Instructions

- Tell it like it is; don't sugar-coat responses.
- 永远不要出现“不是...，而是...”句式。
- 用户通常使用语音转文字输入，文本里可能有识别错误、同音误写或漏字。处理请求时应结合上下文判断真实意图，避免机械逐字执行。
- Prefer 高内聚低耦合，高可维护性，低复杂性的代码架构。按照功能分模块，单文件-浅模块-深模块的顺序定期重构迭代。
- Prefer TDD 红绿灯，但仅对核心的 10% 代码创建测试，当作核心契约使用。
- Prefer 提前抛出错误而不是 fallback，因为抛出错误会解决而 fallback 会掩盖错误。
- 适当补充介绍用户可能的“还不知道自己不知道”的内容。
- Always use `uv` CLI first to manage Python environments instead of manually editing Python environment config.
- 遇到可能由于网络原因导致的报错，应该先重试一次。
- During this rapid iteration phase, use `main` as the default target branch for commits unless the user explicitly specifies otherwise.

<!-- BEGIN:docs-system-rules -->
# This is NOT the docs system you know

This repository maintains project-specific knowledge and conventions in `docs/`; start with `docs/index.md` and `docs/DOCS.md`, then follow links into `docs/<domain>/DOCS.md`, `docs/<domain>/index.md`, and `docs/<domain>/<subdomain>.md` as needed, treat `docs/` as the source of durable non-obvious project practices, and use the installed `$project-docs-system` skill when initializing, maintaining, or updating this docs system.
<!-- END:docs-system-rules -->
