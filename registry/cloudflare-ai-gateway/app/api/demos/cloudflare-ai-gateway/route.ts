import { handleGatewayImageRequest } from "@/lib/cloudflare-ai-gateway/server/runtime";

export const maxDuration = 180;
export const POST = handleGatewayImageRequest;
