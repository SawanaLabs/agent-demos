import { loadUltraChatbotAgentScreenData } from "@/lib/ultra-chatbot-agent/server/session";
import { UltraChatbotAgentScreen } from "@/components/ultra-chatbot-agent/ultra-chatbot-agent-screen";

export const dynamic = "force-dynamic";

export default async function UltraChatbotAgentPage() {
  const screenData = await loadUltraChatbotAgentScreenData({
    chatId: null,
  });

  return <UltraChatbotAgentScreen {...screenData} />;
}
