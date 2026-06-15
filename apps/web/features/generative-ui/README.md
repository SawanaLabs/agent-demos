# Generative UI

This Agent Demo shows AI SDK UI generative interfaces in a portable chat slice. The assistant can use OpenAI hosted `web_search` through AI Gateway when a question needs current information, then render either a comparison matrix or a recommendation card through `tool-*` UI message parts.

## Feature Slice

```txt
apps/web/features/generative-ui/
├── demo-meta.ts
├── model/
│   ├── ui-contract.test.ts
│   └── ui-contract.ts
├── server/
│   ├── chat.test.ts
│   ├── chat.ts
│   ├── env-source.ts
│   ├── env.test.ts
│   ├── env.ts
│   ├── model.ts
│   ├── runtime.test.ts
│   └── runtime.ts
└── ui/
    ├── feature-comparison-matrix.tsx
    ├── feature-comparison-matrix.test.tsx
    ├── generative-ui-screen.tsx
    ├── generative-ui-workspace.tsx
    ├── message-parts.test.ts
    ├── message-parts.ts
    ├── partial-rendering.tsx
    ├── plan-recommendation-card.test.tsx
    ├── plan-recommendation-card.tsx
    └── use-generative-ui-chat.ts
```

Thin app entries live at:

```txt
apps/web/app/demos/generative-ui/page.tsx
apps/web/app/api/demos/generative-ui/route.ts
```

## Runtime

- `AI_GATEWAY_API_KEY` is required.
- `AI_GATEWAY_BASE_URL` defaults to `https://ai-gateway.vercel.sh/v3/ai`.
- `GENERATIVE_UI_CHAT_MODEL` overrides the feature default, which is `openai/gpt-5-mini`.

The source core is `streamText` with `tool({ inputSchema })`, OpenAI hosted `web_search`, `convertToModelMessages`, and `toUIMessageStreamResponse({ sendSources: true })`.
