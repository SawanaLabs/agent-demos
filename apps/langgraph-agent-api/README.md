# LangGraph Agent API

Python LangGraph backend for the `langgraph-agent` frontend demo.

It has two deployment entries:

- `langgraph.json` for local `langgraph dev` and any future full Agent Server
  target.
- `app.py` for a Vercel-compatible FastAPI wrapper that exposes the minimum
  Agent Server-like surface required by the current Next.js demo.
- `vercel.json` for the Vercel FastAPI framework preset. Keep this file in the
  API project root; otherwise a CLI-created Vercel project can serve `app.py` as
  a static file instead of mounting it as an ASGI app.

## Setup

```bash
pnpm dev:langgraph-agent
```

`pnpm dev:langchain-agent` is also available as a compatibility alias.

To run only the LangGraph CLI Python backend:

```bash
pnpm dev:langgraph-agent-api
```

To run the Vercel-compatible FastAPI backend and paired web app:

```bash
pnpm dev:langgraph-agent-fastapi
```

To run only the FastAPI backend:

```bash
pnpm dev:langgraph-agent-fastapi-api
```

When running the frontend outside the paired script, set these variables in
`apps/web/.env.local`:

```bash
LANGGRAPH_AGENT_API_URL=http://localhost:2024
LANGGRAPH_AGENT_ASSISTANT_ID=agent
```

To run only the paired local web app process:

```bash
pnpm dev:langgraph-agent-web
```

`LANGGRAPH_AGENT_API_KEY` is optional for local `langgraph dev`; use it when the
frontend talks to a hosted backend that requires an API key.

The local scripts default `LANGGRAPH_AGENT_MODEL` to `openai/gpt-5-mini`.
Set `LANGGRAPH_AGENT_MODEL` before running either script to test a different
OpenAI-compatible model through Vercel AI Gateway.

## Vercel FastAPI Entry

Run the lightweight FastAPI wrapper locally:

```bash
pnpm dev:langgraph-agent-fastapi
```

The paired script starts the FastAPI backend on `127.0.0.1:2024` and the web
app with `LANGGRAPH_AGENT_API_URL=http://localhost:2024` plus
`LANGGRAPH_AGENT_ASSISTANT_ID=agent`.

For a Vercel project, use `apps/langgraph-agent-api` as the project root and
keep `framework` set to `fastapi` through `vercel.json`. The current production
project is `agent-demos-langgraph-agent-api` at:

```text
https://agent-demos-langgraph-agent-api.vercel.app
```

Keep `pyproject.toml` and `uv.lock` as the dependency source of truth. The
Vercel project config pins the install step to:

```bash
if [ -d apps/langgraph-agent-api ]; then cd apps/langgraph-agent-api; fi; uv sync --active --frozen --no-dev
```

It also runs a uv-backed build smoke check:

```bash
if [ -d apps/langgraph-agent-api ]; then cd apps/langgraph-agent-api; fi; uv run --active --frozen --no-dev python -c 'from app import app'
```

Do not add a generated `requirements.txt` for this deployment path. Keep the
`.vercelignore` entries that exclude the root pnpm/Turbo workspace files;
otherwise Vercel can classify this FastAPI project as the monorepo workspace and
skip the Python dependency install.

For local PREPROD verification, run this from the repository root:

```bash
pnpm preprod:langgraph-agent-api
```

The script runs `uv python install/find` for the version in `.python-version`,
exports that uv-managed Python directory into `PATH`, and then delegates to
`vercel build --prod --yes`. This matters because Vercel's local Python builder
spawns `python3.12` before the project install command runs. A uv-managed Python
can exist on disk while still being invisible to that subprocess unless its bin
directory is present in `PATH`.

The required API project environment variables are:

```bash
AI_GATEWAY_API_KEY=<vercel-ai-gateway-key>
LANGGRAPH_AGENT_API_KEY=<optional-shared-service-key>
LANGGRAPH_AGENT_MODEL=openai/gpt-5-mini
```

Set the web project to the deployed API URL and the same service key:

```bash
LANGGRAPH_AGENT_API_URL=https://<api-project>.vercel.app
LANGGRAPH_AGENT_ASSISTANT_ID=agent
LANGGRAPH_AGENT_API_KEY=<same-optional-shared-service-key>
```

The FastAPI entry is intentionally lightweight. It confirms UUID threads,
invokes the existing compiled LangGraph graph, and streams `updates` plus
`messages-tuple` events. It does not provide durable checkpoint resume,
interrupt/resume, crash recovery, or LangSmith/LangGraph Platform monitoring.

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
