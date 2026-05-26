import { notFound } from "next/navigation";

import { loadUltraChatbotAgentScreenData } from "@/features/ultra-chatbot-agent/server/session";
import { UltraChatbotAgentScreen } from "@/features/ultra-chatbot-agent/ui/ultra-chatbot-agent-screen";

export default async function UltraChatbotAgentConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const screenData = await loadUltraChatbotAgentScreenData({
    chatId: id,
  });

  if (!screenData.initialSession) {
    notFound();
  }

  return <UltraChatbotAgentScreen {...screenData} />;
}
