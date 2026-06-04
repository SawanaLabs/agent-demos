import { handleLangGraphAgentRequest } from "@/lib/langgraph-agent/server/runtime";

// This registry item installs the Next.js frontend and proxy route only.
// Run the Python LangGraph backend separately from:
// https://github.com/SawanaLabs/agent-demos/tree/main/apps/langgraph-agent-api
//
// Local-first path: run that backend on http://localhost:2024, then set
// LANGGRAPH_AGENT_API_URL=http://localhost:2024,
// LANGGRAPH_AGENT_ASSISTANT_ID=agent, and LANGGRAPH_AGENT_API_KEY to the same
// shared service key accepted by the backend.
//
// Vercel path: deploy apps/langgraph-agent-api as a FastAPI project using its
// app.py and vercel.json, then point LANGGRAPH_AGENT_API_URL at that deployment.
//
// Official refs:
// - https://docs.langchain.com/langgraph-platform/local-server
// - https://docs.langchain.com/langgraph-platform/cli
// - https://docs.langchain.com/oss/python/langgraph/streaming
// - https://vercel.com/docs/frameworks/backend/fastapi

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleLangGraphAgentRequest(request);
}
