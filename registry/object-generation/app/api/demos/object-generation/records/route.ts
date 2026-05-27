import { handleObjectGenerationRecordRequest } from "@/lib/object-generation/object-generation-records";

export async function GET(request: Request) {
  return handleObjectGenerationRecordRequest(request);
}
