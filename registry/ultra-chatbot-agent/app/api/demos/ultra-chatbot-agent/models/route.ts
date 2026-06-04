import { getUltraChatbotAgentModelCatalog } from "@/lib/ultra-chatbot-agent/server/models";

export async function GET() {
  return Response.json(
    {
      models: getUltraChatbotAgentModelCatalog(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
