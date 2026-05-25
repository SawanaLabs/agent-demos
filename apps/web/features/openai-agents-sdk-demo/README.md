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
apps/web/features/openai-agents-sdk-demo/
├── README.md
├── demo-meta.ts
├── message-metadata.ts
├── server/
│   ├── agents.ts
│   ├── chat.test.ts
│   ├── chat.ts
│   ├── guardrails.ts
│   ├── guide-coverage.ts
│   ├── models.ts
│   ├── runtime.test.ts
│   ├── runtime.ts
│   └── tools.ts
└── ui/
    ├── openai-agents-sdk-demo-screen.tsx
    └── openai-agents-sdk-demo-workspace.tsx
```

## Contracts

- Missing `AI_GATEWAY_API_KEY` blocks chat requests with an explicit setup error.
- The backend source core stays on the official OpenAI Agents SDK run path.
- The route returns the official AI SDK UI bridge response instead of a repo-local custom stream format.
- The current Tools slice wires `tool()`, `webSearchTool()`, `fileSearchTool()` when vector stores are configured, `codeInterpreterTool()`, `imageGenerationTool()`, `toolSearchTool()` on supported GPT-5.4+/5.5 models, and `agent.asTool()` into the main agent.
- Tool availability stays explicit. In the current AI Gateway Responses configuration, `imageGenerationTool()` is registered but provider-blocked for user-facing runs because streamed hosted image generation does not return a renderable artifact to the AI SDK UI bridge.
- The current Guardrails slice wires one input guardrail and one output guardrail into the main agent, returns explicit tripwire errors, and surfaces per-run guardrail evaluation back to the UI through message metadata.
