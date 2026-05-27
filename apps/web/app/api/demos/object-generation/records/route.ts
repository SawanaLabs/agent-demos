import { handleObjectGenerationRecordRequest } from "@/features/object-generation/server/object-generation-records";

export async function GET(request: Request) {
  return handleObjectGenerationRecordRequest(request);
}
