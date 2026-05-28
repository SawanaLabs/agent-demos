export type OpenAiAgentsSdkDemoVoiceConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export const openAiAgentsSdkDemoWorkspaceLayout = {
  voiceDetailsButtonLabel: "Details",
  voiceEntrySurface: "screen-rail",
  voiceEntryTitle: "Voice",
  voiceDetailsSurface: "dialog",
  workspaceHeightClassName: "h-[100svh]",
} as const;

export function getOpenAiAgentsSdkDemoVoicePrimarySummary({
  connectionStatus,
  errorMessage,
  hasPendingApproval,
}: {
  connectionStatus: OpenAiAgentsSdkDemoVoiceConnectionStatus;
  errorMessage: string | null;
  hasPendingApproval: boolean;
}) {
  if (connectionStatus === "connected") {
    return hasPendingApproval
      ? "Approval pending."
      : "Live session.";
  }

  if (connectionStatus === "connecting") {
    return "Connecting.";
  }

  if (connectionStatus === "error") {
    return errorMessage ? "Retry required." : "Voice failed.";
  }

  return "Browser lane.";
}
