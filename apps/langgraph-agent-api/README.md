# LangGraph Agent API

Python LangGraph backend for the `langgraph-agent` frontend demo.

## Setup

```bash
pnpm dev:langgraph-agent-api
```

Set these frontend variables in `apps/web/.env.local`:

```bash
LANGGRAPH_AGENT_API_URL=http://localhost:2024
LANGGRAPH_AGENT_ASSISTANT_ID=agent
```

For the paired local web app, use:

```bash
pnpm dev:langgraph-agent-web
```

`LANGGRAPH_AGENT_API_KEY` is optional for local `langgraph dev`; use it when the
frontend talks to a hosted LangGraph/LangSmith deployment that requires an API
key.

The local scripts default `LANGGRAPH_AGENT_MODEL` to `openai/gpt-5-mini`.
Set `LANGGRAPH_AGENT_MODEL` before running either script to test a different
OpenAI-compatible model through Vercel AI Gateway.

## Contract

The frontend first creates or confirms the active thread:

```text
POST /threads
```

with:

```json
{
  "thread_id": "<uuid>",
  "if_exists": "do_nothing"
}
```

Then it calls the official thread-scoped Agent Server stream endpoint:

```text
POST /threads/{thread_id}/runs/stream
```

The request body includes:

```json
{
  "assistant_id": "agent",
  "input": {
    "messages": [{ "role": "human", "content": "..." }]
  },
  "stream_mode": ["updates", "messages-tuple"]
}
```

Existing Python LangGraph teams can keep their own graph and expose it through
Agent Server. The frontend requires the official thread endpoint above, UUID
thread ids, `updates` events for graph progress, and `messages-tuple` events for
answer tokens.
