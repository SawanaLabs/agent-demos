import { handleProjectDocsMcpRequest } from "@/features/shared/project-docs-mcp/server/project-mcp-server";

export const runtime = "nodejs";

export function DELETE(request: Request) {
  return handleProjectDocsMcpRequest(request);
}

export function GET(request: Request) {
  return handleProjectDocsMcpRequest(request);
}

export function POST(request: Request) {
  return handleProjectDocsMcpRequest(request);
}
