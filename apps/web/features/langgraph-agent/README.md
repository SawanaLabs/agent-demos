# LangGraph Agent Demo

This demo connects a Next.js AI Elements workspace to a remote Python
LangGraph Agent Server through the official thread-scoped streaming endpoint.

## Local Run

Start the Python Agent Server:

```bash
pnpm dev:langgraph-agent-api
```

Add the frontend env keys in `apps/web/.env.local`:

```bash
LANGGRAPH_AGENT_API_URL=http://localhost:2024
LANGGRAPH_AGENT_ASSISTANT_ID=agent
```

Then run the web app:

```bash
pnpm dev:langgraph-agent-web
```

Open `/demos/langgraph-agent`.

Both local scripts default `LANGGRAPH_AGENT_MODEL` to `openai/gpt-5-mini`.
Override it in the shell when you need to verify another Gateway model.

## Frontend Contract

The Next.js route first creates or confirms the active thread:

```text
POST {LANGGRAPH_AGENT_API_URL}/threads
```

with:

```json
{
  "thread_id": "<uuid>",
  "if_exists": "do_nothing"
}
```

The `thread_id` must be a UUID. After that, the route starts the streaming run:

```text
POST {LANGGRAPH_AGENT_API_URL}/threads/{thread_id}/runs/stream
```

with:

```json
{
  "assistant_id": "agent",
  "input": {
    "messages": [{ "role": "human", "content": "..." }]
  },
  "stream_mode": ["updates", "messages-tuple"]
}
```

The route converts LangGraph SSE frames into AI SDK UI message chunks:

- `updates` becomes `data-graph-progress` for the side panel.
- `messages-tuple` becomes answer text deltas plus active-node progress.

The frontend owns only the active `threadId` for the current workspace session.
Agent Server owns checkpoints and persistence.

When the backend is the Vercel-compatible FastAPI wrapper in
`apps/langgraph-agent-api/app.py`, `/threads` is contract confirmation rather
than durable thread creation. The wrapper can chat and stream graph progress,
but ordinary chat continuity depends on the frontend sending the current visible
messages with each request.

## Adapting an Existing Python LangGraph Agent

1. Expose your graph through `langgraph.json` with a stable graph id.
2. Run it with `langgraph dev`, `langgraph up`, or a hosted LangGraph/LangSmith deployment.
3. Point `LANGGRAPH_AGENT_API_URL` at that Agent Server.
4. Set `LANGGRAPH_AGENT_ASSISTANT_ID` to your graph id.
5. Ensure the server supports `POST /threads` plus thread-scoped streaming runs.
6. Ensure the server can stream `updates` and `messages-tuple`.

The frontend does not require your Python graph to use this repository's sample
nodes. It only requires the official thread-scoped run endpoint and stream
modes above.

For a lightweight Vercel deployment, expose the same contract through FastAPI
without adding LangServe, LangCorn, or a template project. Keep the graph module
unchanged and add only the deployment adapter needed for `/threads` and
`/runs/stream`.

## Source Anchors

- LangGraph local Agent Server: https://docs.langchain.com/langsmith/local-dev-testing
- LangGraph streaming: https://docs.langchain.com/oss/python/langgraph/streaming
- LangGraph persistence and threads: https://docs.langchain.com/oss/python/langgraph/persistence
- LangGraph frontend graph execution pattern: https://docs.langchain.com/oss/javascript/langgraph/frontend/graph-execution
- AI SDK UI stream protocol: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
- AI SDK LangChain adapter: https://ai-sdk.dev/providers/adapters/langchain
- AI Elements: https://docs.vercel.com/academy/ai-sdk/ai-elements
- Vercel AI Gateway OpenAI-compatible API: https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions
- Vercel AI Gateway LangChain integration: https://vercel.com/docs/ai-gateway/ecosystem/framework-integrations/langchain
