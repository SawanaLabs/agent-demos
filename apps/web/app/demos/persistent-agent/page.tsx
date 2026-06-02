import { loadPersistentAgentScreenData } from "@/features/persistent-agent/server/session";
import { PersistentAgentScreen } from "@/features/persistent-agent/ui/persistent-agent-screen";

export const dynamic = "force-dynamic";

export default async function PersistentAgentPage() {
  const screenData = await loadPersistentAgentScreenData({
    chatId: null,
  });

  return <PersistentAgentScreen {...screenData} />;
}
