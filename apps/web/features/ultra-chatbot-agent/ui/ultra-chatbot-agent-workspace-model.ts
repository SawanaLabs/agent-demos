import type { UltraChatbotAgentCapabilities } from "../server/capabilities";

export interface UltraChatbotAgentWorkspaceChatMeta {
  capabilities: UltraChatbotAgentCapabilities;
  createdAt: string | null;
  id: string;
  selectedChatModel: string;
  updatedAt: string | null;
  visibility: "private" | "public";
}
