# Minimal Chat Agent feature slice

This feature adapts the Source Core of [`shadcn-ui/chatbot-template`](https://github.com/shadcn-ui/chatbot-template) into the Agent Demos host shell.

## Source Core preserved

- streamed AI SDK chat with a bounded multi-step tool loop;
- provider-native OpenAI `web_search`;
- a server-executed `github_repo` tool for public repository metadata;
- an unexecuted `ask_user` tool whose output is supplied by client UI;
- automatic continuation after every `ask_user` tool result is available.

The source was inspected at commit `8d3939449dbc26dffa86af3b7776618a08f90bb8` on 2026-08-14. The upstream code targets AI SDK 7; this slice adapts the same behavior to the repository's pinned AI SDK 6 contract instead of upgrading the monorepo dependency graph.

## Host adaptation

- The model uses the existing `AI_GATEWAY_*` environment contract and must resolve to an `openai/*` model because the hosted search tool is OpenAI-native.
- The API route is wrapped by the repository's metered demo route.
- Feature-specific UI lives under this directory; only shared chat/shell primitives are imported from the host.
- Registry copies replace `@/` and `@workspace/ui` imports at the explicit copy boundary.

## Runtime flow

1. Client sends `UIMessage[]` to `/api/demos/minimal-chat-agent`.
2. The route validates setup and message structure.
3. `streamText` runs with `web_search`, `github_repo`, and `ask_user` for at most five steps.
4. `github_repo` executes on the server with a five-second timeout.
5. `ask_user` returns no server result. The client renders its questions and calls `addToolOutput`.
6. `lastAssistantMessageIsCompleteWithToolCalls` automatically sends the completed tool result back so the model can continue.

## Required environment

```bash
AI_GATEWAY_API_KEY=...
# Optional; must start with openai/ for this demo.
AI_GATEWAY_CHAT_MODEL=openai/gpt-5-mini
```

The demo uses the AI Gateway OpenAI-compatible `/v1` base URL derived from `AI_GATEWAY_BASE_URL`.

## Verification

```bash
pnpm --dir apps/web exec vitest run features/minimal-chat-agent
pnpm --dir apps/web typecheck
pnpm check
node scripts/registry-sync/sync-registry-demo.mjs --demo minimal-chat-agent --check
pnpm registry:catalog:check
pnpm registry:validate
pnpm build
```
