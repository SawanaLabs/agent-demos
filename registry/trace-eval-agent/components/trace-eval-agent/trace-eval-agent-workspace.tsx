"use client";

import { MagnifyingGlassIcon, StopIcon } from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeferredValue } from "react";
import { classifyTraceEvalRunOutcome } from "@/lib/trace-eval-agent/model/trace-eval-run-outcome";
import { buildTraceEvalRunRecord } from "@/lib/trace-eval-agent/model/trace-eval-run-record";
import { buildTraceEvalSnapshotFromRunRecord } from "@/lib/trace-eval-agent/model/trace-eval-snapshot";
import type { TraceEvalAgentRuntimeState } from "@/lib/trace-eval-agent/server/runtime";
import { TraceEvalAgentAssistantMessage } from "./trace-eval-agent-assistant-message";
import { TraceEvalAgentEvalPanel } from "./trace-eval-agent-eval-panel";
import {
  getTextContent,
  traceEvalAgentSamplePrompts,
} from "./trace-eval-agent-model";
import { TraceEvalAgentRuntimeSidebar } from "./trace-eval-agent-runtime-sidebar";
import { TraceEvalAgentTracePanel } from "./trace-eval-agent-trace-panel";
import { useTraceEvalAgentChat } from "./use-trace-eval-agent-chat";
import { useTraceEvalJudge } from "./use-trace-eval-judge";

interface TraceEvalAgentWorkspaceProps {
  runtimeState: TraceEvalAgentRuntimeState;
}

export function TraceEvalAgentWorkspace({
  runtimeState,
}: TraceEvalAgentWorkspaceProps) {
  const {
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useTraceEvalAgentChat();
  const deferredMessages = useDeferredValue(messages);
  const runRecord = buildTraceEvalRunRecord(deferredMessages, isBusy);
  const snapshot = buildTraceEvalSnapshotFromRunRecord(runRecord);
  const runOutcome = classifyTraceEvalRunOutcome({
    error,
    record: runRecord,
  });
  const judge = useTraceEvalJudge({
    judgeModel: runtimeState.chatModel,
    outcome: runOutcome,
    snapshot,
  });

  function resetTransientFailure() {
    clearError();
  }

  async function handleSendMessage(text: string) {
    resetTransientFailure();
    await sendMessage({ text });
  }

  async function handleRetry() {
    resetTransientFailure();
    await regenerate();
  }

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="grid min-h-[70svh] gap-4 lg:grid-rows-[minmax(0,1fr)_22rem]">
        <div className="flex min-h-[30rem] flex-col border border-foreground/10 bg-background">
          {runtimeState.isChatAvailable ? null : (
            <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
              {runtimeState.setupMessage}
            </div>
          )}

          {runOutcome.kind === "failed-run" ? (
            <div className="flex items-center justify-between gap-4 border-foreground/10 border-b px-4 py-3 text-xs/relaxed">
              <p className="text-destructive">{runOutcome.detail}</p>
              <Button
                onClick={() => {
                  handleRetry();
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          ) : null}

          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto flex w-full max-w-4xl flex-1 gap-6 px-4 pt-6 pb-[3lh]">
              {hasMessages ? (
                messages.map((message, index) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-4xl" : "max-w-2xl"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <TraceEvalAgentAssistantMessage
                          isStreaming={isBusy && index === messages.length - 1}
                          message={message}
                        />
                      ) : (
                        <MessageResponse>
                          {getTextContent(message)}
                        </MessageResponse>
                      )}
                    </MessageContent>
                  </Message>
                ))
              ) : (
                <ConversationEmptyState
                  description="Ask for live research. The agent will search the web through AI Gateway, then the trace and eval panel below will score the current conversation."
                  icon={<MagnifyingGlassIcon className="size-5" />}
                  title="Research agent is ready"
                />
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-foreground/10 border-t px-4 py-4">
            <div className="mx-auto w-full max-w-4xl">
              <PromptInput
                onSubmit={({ text }) => {
                  handleSendMessage(text);
                }}
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    disabled={!runtimeState.isChatAvailable || isBusy}
                    placeholder="Ask the agent to research a topic and ground the answer with live web search."
                  />
                </PromptInputBody>
                <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">ResearchAgent</Badge>
                    <Badge variant="outline">Trace + Eval</Badge>
                    <Badge variant="outline">{runtimeState.chatModel}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBusy ? (
                      <Button
                        onClick={stop}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <StopIcon className="size-3.5" />
                        Stop
                      </Button>
                    ) : null}
                    {hasMessages ? (
                      <Button
                        onClick={() => {
                          handleRetry();
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    ) : null}
                    <PromptInputSubmit
                      disabled={!runtimeState.isChatAvailable}
                      status={status}
                    />
                  </div>
                </PromptInputFooter>
              </PromptInput>

              {hasMessages ? null : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {traceEvalAgentSamplePrompts.map((item) => (
                    <Button
                      className="h-auto whitespace-normal text-left [overflow-wrap:anywhere]"
                      key={item.prompt}
                      onClick={() => {
                        handleSendMessage(item.prompt);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <MagnifyingGlassIcon className="size-3.5" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <TraceEvalAgentTracePanel
            runOutcome={runOutcome}
            snapshot={snapshot}
          />
          <TraceEvalAgentEvalPanel
            judge={judge}
            runOutcome={runOutcome}
            snapshot={snapshot}
          />
        </div>
      </section>

      <TraceEvalAgentRuntimeSidebar
        judge={judge}
        onPromptSelect={(prompt) => {
          handleSendMessage(prompt);
        }}
        runOutcome={runOutcome}
        runtimeState={runtimeState}
        snapshot={snapshot}
      />
    </div>
  );
}
