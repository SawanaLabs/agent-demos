"use client";

import type { RunToolApprovalItem } from "@openai/agents";
import {
  OpenAIRealtimeWebRTC,
  type RealtimeAgent,
  RealtimeSession,
  type RealtimeSessionConnectOptions,
} from "@openai/agents/realtime";
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  SpeakerHighIcon,
  StopCircleIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useCallback, useEffect, useRef, useState } from "react";

import type { OpenAiAgentsSdkDemoVoiceProfile } from "../server/voice";
import {
  createOpenAiAgentsSdkDemoVoiceAgentBundle,
  getOpenAiAgentsSdkDemoVoiceLaneProfile,
} from "../voice-lane";
import { getOpenAiAgentsSdkDemoVoiceHistorySummary } from "./openai-agents-sdk-demo-voice-utils";
import {
  getOpenAiAgentsSdkDemoVoicePrimarySummary,
  openAiAgentsSdkDemoWorkspaceLayout,
  type OpenAiAgentsSdkDemoVoiceConnectionStatus as VoiceConnectionStatus,
} from "./openai-agents-sdk-demo-workspace-layout";

interface OpenAiAgentsSdkDemoVoiceClientSecretResponse {
  error?: string;
  value?: string;
}

interface PendingVoiceApproval {
  agentName: string;
  approvalItem: RunToolApprovalItem;
  arguments: string | null;
  toolName: string;
  type: "function_approval" | "mcp_approval_request";
}

function getVoicePanelStatusLabel(status: VoiceConnectionStatus) {
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

function getVoicePanelStatusClassName(status: VoiceConnectionStatus) {
  if (status === "connected") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "connecting") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (status === "error") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-foreground/10 bg-muted/40 text-muted-foreground";
}

function getVoiceSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `voice-${Date.now()}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Voice session setup failed.";
}

export function OpenAiAgentsSdkDemoVoicePanel({
  onUsageChange,
  voiceProfile,
}: {
  onUsageChange: (used: boolean) => void;
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  const laneProfile = getOpenAiAgentsSdkDemoVoiceLaneProfile();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<RealtimeSession | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<VoiceConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyItemCount, setHistoryItemCount] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastAssistantTranscript, setLastAssistantTranscript] = useState<
    string | null
  >(null);
  const [lastHandoffLabel, setLastHandoffLabel] = useState<string | null>(null);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [lastToolCallLabel, setLastToolCallLabel] = useState<string | null>(
    null
  );
  const [lastUserTranscript, setLastUserTranscript] = useState<string | null>(
    null
  );
  const [pendingApproval, setPendingApproval] =
    useState<PendingVoiceApproval | null>(null);
  const [realtimeEventFeed, setRealtimeEventFeed] = useState<string[]>([]);
  const [availableMcpToolCount, setAvailableMcpToolCount] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [usedVoiceGuide, setUsedVoiceGuide] = useState(false);

  useEffect(() => {
    onUsageChange(usedVoiceGuide);
  }, [onUsageChange, usedVoiceGuide]);

  const closeCurrentVoiceSession = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    setConnectionStatus("disconnected");
    setIsAudioPlaying(false);
    setIsAgentResponding(false);
    setIsMuted(false);
    setPendingApproval(null);
  }, []);

  useEffect(
    () => () => {
      sessionRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const connectVoiceSession = useCallback(async () => {
    if (voiceProfile.browserTransport.status !== "configured") {
      setConnectionStatus("error");
      setErrorMessage(
        "OPENAI_API_KEY is missing. Voice Agents browser transport requires the realtime client-secret route to be configured first."
      );

      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setConnectionStatus("error");
      setErrorMessage(
        "This browser does not expose navigator.mediaDevices.getUserMedia(), so the official WebRTC voice path cannot start."
      );

      return;
    }

    closeCurrentVoiceSession();
    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      const pushRealtimeEvent = (value: string) => {
        setRealtimeEventFeed((current) => [value, ...current].slice(0, 8));
      };
      const clientSecretResponse = await fetch(
        voiceProfile.browserTransport.routePath,
        {
          body: JSON.stringify({
            sessionId: getVoiceSessionId(),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );
      const clientSecretBody =
        (await clientSecretResponse.json()) as OpenAiAgentsSdkDemoVoiceClientSecretResponse;

      if (!(clientSecretResponse.ok && clientSecretBody.value)) {
        throw new Error(
          clientSecretBody.error ??
            "The realtime client-secret route did not return a usable ephemeral token."
        );
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = mediaStream;

      const audioElement =
        audioElementRef.current ?? document.createElement("audio");
      audioElement.autoplay = true;

      const transport = new OpenAIRealtimeWebRTC({
        audioElement,
        mediaStream,
      });
      const { primaryAgent } = createOpenAiAgentsSdkDemoVoiceAgentBundle();
      const agent: RealtimeAgent = primaryAgent;
      const session = new RealtimeSession(agent, {
        config: {
          audio: {
            output: {
              voice: voiceProfile.browserTransport.sessionVoice,
            },
          },
        },
        model: voiceProfile.browserTransport.sessionModel,
        transport,
      });

      session.on("history_updated", (history) => {
        const summary = getOpenAiAgentsSdkDemoVoiceHistorySummary(history);

        setHistoryItemCount(summary.historyItemCount);
        setLastAssistantTranscript(summary.lastAssistantTranscript);
        setLastUserTranscript(summary.lastUserTranscript);

        if (summary.historyItemCount > 0) {
          setUsedVoiceGuide(true);
        }
      });
      session.on("transport_event", (event) => {
        setLastEventType(event.type);
      });
      session.on("agent_start", () => {
        setIsAgentResponding(true);
        pushRealtimeEvent("agent_start");
      });
      session.on("agent_end", (_context, _agent, output) => {
        setIsAgentResponding(false);
        pushRealtimeEvent("agent_end");

        if (output.trim().length > 0) {
          setLastAssistantTranscript(output);
        }
      });
      session.on("agent_handoff", (_context, fromAgent, toAgent) => {
        setLastHandoffLabel(`${fromAgent.name} -> ${toAgent.name}`);
        pushRealtimeEvent("agent_handoff");
      });
      session.on("agent_tool_start", (_context, _agent, tool) => {
        setLastToolCallLabel(`${tool.name} running`);
        pushRealtimeEvent(`agent_tool_start:${tool.name}`);
      });
      session.on("agent_tool_end", (_context, _agent, tool) => {
        setLastToolCallLabel(`${tool.name} completed`);
        pushRealtimeEvent(`agent_tool_end:${tool.name}`);
      });
      session.on("tool_approval_requested", (_context, agent, approval) => {
        setPendingApproval({
          agentName: agent.name,
          arguments: approval.approvalItem.arguments ?? null,
          approvalItem: approval.approvalItem,
          toolName: approval.approvalItem.name ?? "unknown_tool",
          type: approval.type,
        });
        pushRealtimeEvent(
          `tool_approval_requested:${approval.approvalItem.name ?? "unknown_tool"}`
        );
      });
      session.on("guardrail_tripped", () => {
        pushRealtimeEvent("guardrail_tripped");
      });
      session.on("mcp_tools_changed", (tools) => {
        setAvailableMcpToolCount(tools.length);
        pushRealtimeEvent(`mcp_tools_changed:${tools.length}`);
      });
      session.on("audio_start", () => {
        setIsAudioPlaying(true);
        pushRealtimeEvent("audio_start");
      });
      session.on("audio_stopped", () => {
        setIsAudioPlaying(false);
        pushRealtimeEvent("audio_stopped");
      });
      session.on("audio_interrupted", () => {
        setIsAudioPlaying(false);
        pushRealtimeEvent("audio_interrupted");
      });
      session.on("error", ({ error }) => {
        setConnectionStatus("error");
        setErrorMessage(getErrorMessage(error));
        pushRealtimeEvent("error");
      });

      sessionRef.current = session;

      await session.connect({
        apiKey: clientSecretBody.value,
      } satisfies RealtimeSessionConnectOptions);

      setConnectionStatus("connected");
      setIsMuted(session.muted ?? false);
      setUsedVoiceGuide(true);
    } catch (error) {
      closeCurrentVoiceSession();
      setConnectionStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  }, [closeCurrentVoiceSession, voiceProfile]);

  const disconnectVoiceSession = useCallback(() => {
    closeCurrentVoiceSession();
    setErrorMessage(null);
  }, [closeCurrentVoiceSession]);

  const toggleMute = useCallback(() => {
    const session = sessionRef.current;

    if (!session) {
      return;
    }

    const nextMuted = !(session.muted ?? false);

    session.mute(nextMuted);
    setIsMuted(session.muted ?? nextMuted);
  }, []);

  const interruptVoiceSession = useCallback(() => {
    sessionRef.current?.interrupt();
    setIsAudioPlaying(false);
  }, []);

  const sendTextTurn = useCallback(() => {
    const session = sessionRef.current;
    const value = textInput.trim();

    if (!session || value.length === 0) {
      return;
    }

    session.sendMessage(value);
    setTextInput("");
    setUsedVoiceGuide(true);
  }, [textInput]);

  const approvePendingToolCall = useCallback(async () => {
    const session = sessionRef.current;

    if (!(session && pendingApproval)) {
      return;
    }

    await session.approve(pendingApproval.approvalItem);
    setPendingApproval(null);
    setRealtimeEventFeed((current) =>
      [`tool_approved:${pendingApproval.toolName}`, ...current].slice(0, 8)
    );
  }, [pendingApproval]);

  const rejectPendingToolCall = useCallback(async () => {
    const session = sessionRef.current;

    if (!(session && pendingApproval)) {
      return;
    }

    await session.reject(pendingApproval.approvalItem, {
      message: "The operator rejected this external publish request.",
    });
    setPendingApproval(null);
    setRealtimeEventFeed((current) =>
      [`tool_rejected:${pendingApproval.toolName}`, ...current].slice(0, 8)
    );
  }, [pendingApproval]);

  const providerStatusClassName =
    voiceProfile.browserTransport.status === "configured"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-destructive/30 bg-destructive/10 text-destructive";
  const detailsSummary = getOpenAiAgentsSdkDemoVoicePrimarySummary({
    connectionStatus,
    errorMessage,
    hasPendingApproval: Boolean(pendingApproval),
  });

  return (
    <>
      <div className="border-foreground/10 border-b p-4">
        <div className="flex flex-col gap-2">
          <div className="flex w-full min-w-0 flex-col gap-3 border border-foreground/10 bg-background px-3 py-3">
            <div className="flex w-full min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-sm">
                  {openAiAgentsSdkDemoWorkspaceLayout.voiceEntryTitle}
                </p>
                <p className="text-muted-foreground text-xs leading-5">
                  {detailsSummary}
                </p>
              </div>
              <Badge
                className={getVoicePanelStatusClassName(connectionStatus)}
                variant="outline"
              >
                {getVoicePanelStatusLabel(connectionStatus)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={providerStatusClassName} variant="outline">
                {voiceProfile.browserTransport.status}
              </Badge>
              {pendingApproval ? (
                <Badge
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  variant="outline"
                >
                  Approval pending
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="min-w-0 justify-start"
                disabled={connectionStatus === "connecting"}
                onClick={() => void connectVoiceSession()}
                size="sm"
                type="button"
                variant="outline"
              >
                <MicrophoneIcon className="size-3.5 shrink-0" />
                <span className="truncate">Connect</span>
              </Button>
              <Button
                className="min-w-0 justify-start"
                disabled={connectionStatus !== "connected"}
                onClick={toggleMute}
                size="sm"
                type="button"
                variant="outline"
              >
                {isMuted ? (
                  <MicrophoneSlashIcon className="size-3.5 shrink-0" />
                ) : (
                  <MicrophoneIcon className="size-3.5 shrink-0" />
                )}
                <span className="truncate">Mute</span>
              </Button>
              <Button
                className="min-w-0 justify-start"
                disabled={connectionStatus !== "connected"}
                onClick={interruptVoiceSession}
                size="sm"
                type="button"
                variant="outline"
              >
                <StopCircleIcon className="size-3.5 shrink-0" />
                <span className="truncate">Interrupt</span>
              </Button>
              <Button
                className="min-w-0 justify-start"
                disabled={
                  connectionStatus !== "connected" &&
                  connectionStatus !== "error"
                }
                onClick={disconnectVoiceSession}
                size="sm"
                type="button"
                variant="outline"
              >
                <PhoneDisconnectIcon className="size-3.5 shrink-0" />
                <span className="truncate">Disconnect</span>
              </Button>
            </div>
          </div>

          <Button
            className="w-full justify-center"
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            {openAiAgentsSdkDemoWorkspaceLayout.voiceDetailsButtonLabel}
          </Button>
        </div>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="grid h-[min(90svh,960px)] max-h-[90svh] max-w-[min(960px,calc(100%-2rem))] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[min(960px,calc(100%-2rem))]">
          <DialogHeader className="border-foreground/10 border-b px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
              <div className="space-y-1">
                <DialogTitle>Voice Agents</DialogTitle>
                <DialogDescription>
                  Official browser path: <code>RealtimeSession</code> over{" "}
                  <code>OpenAIRealtimeWebRTC</code>, backed by{" "}
                  <code>{voiceProfile.browserTransport.routePath}</code>.
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={getVoicePanelStatusClassName(connectionStatus)}
                  variant="outline"
                >
                  {getVoicePanelStatusLabel(connectionStatus)}
                </Badge>
                <Badge className={providerStatusClassName} variant="outline">
                  {voiceProfile.browserTransport.status}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto px-5 py-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={connectionStatus === "connecting"}
                  onClick={() => void connectVoiceSession()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <MicrophoneIcon className="size-3.5" />
                  Connect
                </Button>
                <Button
                  disabled={connectionStatus !== "connected"}
                  onClick={toggleMute}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {isMuted ? (
                    <MicrophoneSlashIcon className="size-3.5" />
                  ) : (
                    <MicrophoneIcon className="size-3.5" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button
                  disabled={connectionStatus !== "connected"}
                  onClick={interruptVoiceSession}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <StopCircleIcon className="size-3.5" />
                  Interrupt
                </Button>
                <Button
                  disabled={
                    connectionStatus !== "connected" &&
                    connectionStatus !== "error"
                  }
                  onClick={disconnectVoiceSession}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PhoneDisconnectIcon className="size-3.5" />
                  Disconnect
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-3 border border-foreground/10 px-3 py-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Model</span>
                    <span>{voiceProfile.browserTransport.sessionModel}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Voice</span>
                    <span>{voiceProfile.browserTransport.sessionVoice}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Muted</span>
                    <span>{isMuted ? "yes" : "no"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Audio playback
                    </span>
                    <span>{isAudioPlaying ? "active" : "idle"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Agent turn</span>
                    <span>{isAgentResponding ? "running" : "idle"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">History items</span>
                    <span>{historyItemCount}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Last handoff</span>
                    <span className="max-w-[10rem] text-right">
                      {lastHandoffLabel ?? "none yet"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Last tool</span>
                    <span className="max-w-[10rem] text-right">
                      {lastToolCallLabel ?? "none yet"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">MCP tools</span>
                    <span>{availableMcpToolCount}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">
                      Last transport event
                    </span>
                    <span className="max-w-[10rem] text-right">
                      {lastEventType ?? "none yet"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border border-foreground/10 px-3 py-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                      Latest user transcript
                    </p>
                    <p className="min-h-12 text-sm/relaxed">
                      {lastUserTranscript ?? "No user transcript yet."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                      Latest assistant transcript
                    </p>
                    <p className="min-h-12 text-sm/relaxed">
                      {lastAssistantTranscript ??
                        "No assistant transcript yet."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border border-foreground/10 px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Realtime tools and approvals
                  </p>
                  <Badge variant="outline">
                    {laneProfile.toolNames.length} tools
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {laneProfile.toolNames.map((toolName) => (
                    <Badge key={toolName} variant="outline">
                      {toolName}
                    </Badge>
                  ))}
                </div>
                {pendingApproval ? (
                  <div className="space-y-2 border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                    <p className="font-medium text-sm">
                      Pending approval: {pendingApproval.toolName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Agent: {pendingApproval.agentName} · Kind:{" "}
                      {pendingApproval.type}
                    </p>
                    <p className="text-xs/relaxed">
                      {pendingApproval.arguments ??
                        "No tool arguments captured."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => void approvePendingToolCall()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => void rejectPendingToolCall()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    No pending approval. Ask the voice agent to publish a
                    research summary to trigger the official approval event.
                  </p>
                )}
              </div>

              <div className="space-y-2 border border-foreground/10 px-3 py-3 text-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  Suggested smoke prompts
                </p>
                <div className="flex flex-wrap gap-2">
                  {laneProfile.recommendedSmokePrompts.map((prompt) => (
                    <button
                      className="border border-foreground/10 px-2 py-1 text-left text-xs transition hover:border-foreground/20"
                      key={prompt}
                      onClick={() => setTextInput(prompt)}
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border border-foreground/10 px-3 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Realtime event feed
                  </p>
                  <Badge variant="outline">
                    {laneProfile.transportEscapeHatch}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(realtimeEventFeed.length > 0
                    ? realtimeEventFeed
                    : laneProfile.emittedSessionEvents
                  ).map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  You can speak after connecting, or send one text turn over the
                  same realtime session for a quick deterministic smoke test.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="min-w-0 flex-1 border border-foreground/10 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/20"
                    disabled={connectionStatus !== "connected"}
                    onChange={(event) => setTextInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendTextTurn();
                      }
                    }}
                    placeholder="Send a short text turn over RealtimeSession after connect."
                    value={textInput}
                  />
                  <Button
                    disabled={
                      connectionStatus !== "connected" ||
                      textInput.trim().length === 0
                    }
                    onClick={sendTextTurn}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <WaveformIcon className="size-3.5" />
                    Send text
                  </Button>
                </div>
              </div>

              {errorMessage ? (
                <div className="border border-destructive/30 bg-destructive/10 px-3 py-3 text-destructive text-xs/relaxed">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">
                  <SpeakerHighIcon className="size-3.5" />
                  WebRTC audio
                </Badge>
                <Badge variant="outline">
                  <WaveformIcon className="size-3.5" />
                  RealtimeSession.connect({"{ apiKey }"})
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <audio autoPlay className="hidden" ref={audioElementRef} />
    </>
  );
}
