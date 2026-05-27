import { handleObjectGenerationRequest } from "@/features/object-generation/server/runtime";

export const maxDuration = 30;

export async function POST(request: Request) {
  return handleObjectGenerationRequest(request);
}
