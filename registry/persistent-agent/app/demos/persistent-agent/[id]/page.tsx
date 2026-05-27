import { notFound } from "next/navigation";

import { loadPersistentAgentScreenData } from "@/lib/persistent-agent/server/session";
import { PersistentAgentScreen } from "@/components/persistent-agent/persistent-agent-screen";

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
