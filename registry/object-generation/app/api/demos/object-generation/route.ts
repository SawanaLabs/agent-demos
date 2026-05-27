import { handleObjectGenerationRequest } from "@/lib/object-generation/runtime";

export const maxDuration = 30;

export async function POST(request: Request) {
  return handleObjectGenerationRequest(request);
}
