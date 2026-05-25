import { notFound } from "next/navigation";

import { loadPersistentAgentScreenData } from "@/features/persistent-agent/server/session";
import { PersistentAgentScreen } from "@/features/persistent-agent/ui/persistent-agent-screen";

export default async function PersistentAgentConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const screenData = await loadPersistentAgentScreenData({
    chatId: id,
  });

  if (!screenData.initialSession) {
    notFound();
  }

  return <PersistentAgentScreen {...screenData} />;
}
