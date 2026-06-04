import { handleOpenAiAgentsSdkDemoMcpRequest } from "@/lib/openai-agents-sdk-demo/server/demo-mcp-server";

export const runtime = "nodejs";

export function DELETE(request: Request) {
  return handleOpenAiAgentsSdkDemoMcpRequest(request);
}

export function GET(request: Request) {
  return handleOpenAiAgentsSdkDemoMcpRequest(request);
}

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoMcpRequest(request);
}
