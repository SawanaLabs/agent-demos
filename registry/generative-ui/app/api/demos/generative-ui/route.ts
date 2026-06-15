import { handleGenerativeUiRequest } from "@/lib/generative-ui/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleGenerativeUiRequest(request);
}
