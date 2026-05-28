import { handleObjectGenerationRecordRequest } from "@/features/object-generation/server/object-generation-records";

export function GET(request: Request) {
  return handleObjectGenerationRecordRequest(request);
}
