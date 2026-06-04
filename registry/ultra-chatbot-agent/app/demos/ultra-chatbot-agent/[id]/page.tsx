import { notFound } from "next/navigation";

import { loadUltraChatbotAgentScreenData } from "@/lib/ultra-chatbot-agent/server/session";
import { UltraChatbotAgentScreen } from "@/components/ultra-chatbot-agent/ultra-chatbot-agent-screen";

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
