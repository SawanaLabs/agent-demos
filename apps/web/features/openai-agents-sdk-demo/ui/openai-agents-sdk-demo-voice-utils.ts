import { type RealtimeItem, utils } from "@openai/agents/realtime";
import type { OpenAiAgentsSdkDemoVoiceConnectionStatus as VoiceConnectionStatus } from "./openai-agents-sdk-demo-workspace-layout";

export interface OpenAiAgentsSdkDemoVoiceHistorySummary {
  historyItemCount: number;
  lastAssistantTranscript: string | null;
  lastUserTranscript: string | null;
}

function getUserMessageText(item: Extract<RealtimeItem, { type: "message" }>) {
  if (item.role !== "user") {
    return null;
  }

  const value = item.content
    .map((part) =>
      part.type === "input_text" ? part.text : (part.transcript ?? "")
    )
    .join("\n")
    .trim();

  return value.length > 0 ? value : null;
}

function getAssistantMessageText(
  item: Extract<RealtimeItem, { type: "message" }>
) {
  if (item.role !== "assistant") {
    return null;
  }

  const transcript =
    utils.getLastTextFromAudioOutputMessage(item) ??
    item.content
      .map((part) =>
        part.type === "output_text" ? part.text : (part.transcript ?? "")
      )
      .join("\n")
      .trim();

  return transcript.length > 0 ? transcript : null;
}

export function getOpenAiAgentsSdkDemoVoiceHistorySummary(
  history: RealtimeItem[]
): OpenAiAgentsSdkDemoVoiceHistorySummary {
  let lastAssistantTranscript: string | null = null;
  let lastUserTranscript: string | null = null;

  for (const item of [...history].reverse()) {
    if (item.type !== "message") {
      continue;
    }

    if (!lastAssistantTranscript) {
      lastAssistantTranscript = getAssistantMessageText(item);
    }

    if (!lastUserTranscript) {
      lastUserTranscript = getUserMessageText(item);
    }

    if (lastAssistantTranscript && lastUserTranscript) {
      break;
    }
  }

  return {
    historyItemCount: history.length,
    lastAssistantTranscript,
    lastUserTranscript,
  };
}

export function getVoicePanelStatusLabel(status: VoiceConnectionStatus) {
  if (status === "connected") {
    return "Connected";
  }

  if (status === "connecting") {
    return "Connecting";
  }

  if (status === "error") {
    return "Error";
  }

  return "Disconnected";
}
