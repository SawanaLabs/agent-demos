import { loadUltraChatbotAgentScreenData } from "@/features/ultra-chatbot-agent/server/session";
import { UltraChatbotAgentScreen } from "@/features/ultra-chatbot-agent/ui/ultra-chatbot-agent-screen";

export const dynamic = "force-dynamic";

export default async function UltraChatbotAgentPage() {
  const screenData = await loadUltraChatbotAgentScreenData({
    chatId: null,
  });

  return <UltraChatbotAgentScreen {...screenData} />;
}
