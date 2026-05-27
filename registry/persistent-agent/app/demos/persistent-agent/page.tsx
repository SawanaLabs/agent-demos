import { loadPersistentAgentScreenData } from "@/lib/persistent-agent/server/session";
import { PersistentAgentScreen } from "@/components/persistent-agent/persistent-agent-screen";

export default async function PersistentAgentPage() {
  const screenData = await loadPersistentAgentScreenData({
    chatId: null,
  });

  return <PersistentAgentScreen {...screenData} />;
}
