# Loop Agent

`loop-agent` is a support triage agent demo built from the AI SDK tool-calling and loop-control recipes.

## Capability

- Triage a default support case for an enterprise customer.
- Use multiple business tools before producing the recommendation.
- Show independent context lookups before the dependent SLA decision.
- Gate the high-priority escalation with an AI SDK tool approval request.
- Stream the agent through `ToolLoopAgent` with a bounded `stepCountIs(6)` loop.
- Render tool calls, tool results, and approval states in the AI Elements workspace.

## Feature Slice

```txt
apps/web/features/loop-agent
├── demo-meta.ts
├── README.md
├── server
│   ├── chat.ts
│   ├── runtime.test.ts
│   ├── runtime.ts
│   ├── support-triage.test.ts
│   └── support-triage.ts
└── ui
    ├── loop-agent-screen.tsx
    └── loop-agent-workspace.tsx
```

Thin entries live in:

```txt
apps/web/app/demos/loop-agent/page.tsx
apps/web/app/api/demos/loop-agent/route.ts
```

## Source Core

- `https://ai-sdk.dev/resources/recipes/next/call-tools`
- `https://ai-sdk.dev/resources/recipes/next/call-tools-multiple-steps`
- `https://ai-sdk.dev/resources/recipes/node/call-tools-in-parallel`
- `https://ai-sdk.dev/resources/recipes/node/manual-agent-loop`
- `https://ai-sdk.dev/cookbook/next/human-in-the-loop`
- `https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent`
- `https://ai-sdk.dev/docs/reference/ai-sdk-core/create-agent-ui-stream-response`
- `https://elements.ai-sdk.dev/components/confirmation`
