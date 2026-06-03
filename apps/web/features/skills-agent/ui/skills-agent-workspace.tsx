"use client";

import {
  ArrowClockwiseIcon,
  HammerIcon,
  StopIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { isReasoningUIPart, isToolUIPart, type UIMessage } from "ai";
import { useMemo } from "react";
import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";
import { useSkillsAgentChat } from "./use-skills-agent-chat";

const configuredTools = [
  {
    description: "Load full skill instructions from the configured skills set.",
    name: "skill",
  },
  {
    description: "Run shell commands inside the session sandbox.",
    name: "bash",
  },
  {
    description: "Read sandbox-backed files directly.",
    name: "readFile",
  },
  {
    description: "Write sandbox-backed files directly.",
    name: "writeFile",
  },
] as const;

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

function getToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}

function getToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

function readObjectField(value: unknown, field: string): string | null {
  if (!value || typeof value !== "object" || !(field in value)) {
    return null;
  }

  const candidate = value[field as keyof typeof value];

  return typeof candidate === "string" ? candidate : null;
}

function getActivatedSkills(toolParts: ToolPart[]) {
  const skillNames = toolParts
    .filter(
      (part) =>
        getToolName(part) === "skill" && part.state === "output-available"
    )
    .map((part) => {
      const nestedSkill =
        part.output && typeof part.output === "object" && "skill" in part.output
          ? part.output.skill
          : null;

      return (
        readObjectField(nestedSkill, "name") ??
        readObjectField(part.output, "skillName")
      );
    })
    .filter((name): name is string => Boolean(name));

  return Array.from(new Set(skillNames));
}

function getDraftArtifacts(toolParts: ToolPart[]) {
  return toolParts
    .filter(
      (part) =>
        getToolName(part) === "writeFile" && part.state === "output-available"
    )
    .map((part) => {
      const inputPath = readObjectField(part.input, "path");
      const inputContent = readObjectField(part.input, "content");
      const outputPath = readObjectField(part.output, "path");

      return {
        content: inputContent,
        path: outputPath ?? inputPath,
      };
    })
    .filter((artifact) => artifact.path && artifact.content);
}

interface AssistantTraceProps {
  isLastMessage: boolean;
  isStreaming: boolean;
  message: UIMessage;
}

function AssistantTrace({
  isLastMessage,
  isStreaming,
  message,
}: AssistantTraceProps) {
  const text = getTextContent(message);
  const reasoningText = getReasoningText(message);
  const toolParts = getToolParts(message);
  const activatedSkills = getActivatedSkills(toolParts);
  const draftArtifacts = getDraftArtifacts(toolParts);
  const hasReasoning = reasoningText.length > 0;
  const hasText = text.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";
  const showBodyThinking =
    isLastMessage && isStreaming && !hasReasoning && !hasText;
  let bodyContent: React.ReactNode = null;

  if (hasText) {
    bodyContent = <MessageResponse>{text}</MessageResponse>;
  } else if (showBodyThinking) {
    bodyContent = <Shimmer className="text-sm">Thinking...</Shimmer>;
  }

  return (
    <>
      {hasReasoning ? (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      ) : null}

      {activatedSkills.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Activated skills
          </p>
          <div className="flex flex-wrap gap-2">
            {activatedSkills.map((skillName) => (
              <Badge key={skillName} variant="secondary">
                {skillName}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {draftArtifacts.length > 0 ? (
        <div className="space-y-3">
          {draftArtifacts.map((artifact) => (
            <div
              className="space-y-2 border border-foreground/10 p-3"
              key={`${artifact.path}-${artifact.content?.length ?? 0}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">Draft artifact</p>
                <Badge variant="outline">{artifact.path}</Badge>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs/relaxed">
                {artifact.content}
              </pre>
            </div>
          ))}
        </div>
      ) : null}

      {toolParts.map((part) => (
        <Tool key={part.toolCallId}>
          {part.type === "dynamic-tool" ? (
            <ToolHeader
              state={part.state}
              toolName={part.toolName}
              type={part.type}
            />
          ) : (
            <ToolHeader state={part.state} type={part.type} />
          )}
          <ToolContent>
            {part.input ? <ToolInput input={part.input} /> : null}
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      ))}

      {bodyContent}
    </>
  );
}

export interface SkillsAgentWorkspaceProps {
  availableSkills: Array<{
    description: string;
    name: string;
  }>;
  chatModel: string;
  environmentLabel: string;
  isChatAvailable: boolean;
  sandboxProvider: string;
  setupMessage: string | null;
}

export function SkillsAgentWorkspace({
  availableSkills,
  chatModel,
  environmentLabel,
  isChatAvailable,
  sandboxProvider,
  setupMessage,
}: SkillsAgentWorkspaceProps) {
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
  } = useSkillsAgentChat();
  const canStartChatTurn = isChatAvailable && !isBusy;
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const samplePrompts = useMemo(
    () => [
      "Grill this rough idea for a docs chatbot.",
      "Interrogate this agent concept until the glossary and boundaries are precise.",
      "After the context is aligned, draft a reusable SKILL.md package for the workflow.",
    ],
    []
  );
  function sendChatMessage(text: string) {
    if (!canStartChatTurn) {
      return;
    }

    sendMessage({ text });
  }

  function regenerateChatTurn() {
    if (!canStartChatTurn) {
      return;
    }

    regenerate();
  }

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message, index) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <AssistantTrace
                          isLastMessage={index === messages.length - 1}
                          isStreaming={isBusy}
                          message={message}
                        />
                      ) : (
                        <MessageResponse>
                          {getTextContent(message)}
                        </MessageResponse>
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {error ? (
                  <ConversationErrorMessage
                    error={error}
                    isRetryDisabled={!canStartChatTurn}
                    onRetry={retryConversationError}
                  />
                ) : null}
              </>
            ) : (
              <ConversationEmptyState
                description="Ask the agent to challenge a rough idea, align durable context, and turn that workflow into a reusable skill draft."
                icon={<HammerIcon className="size-5" />}
                title="Idea-to-skill workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendChatMessage(text)}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!canStartChatTurn}
                  placeholder="Describe a rough idea or ask for a reusable skill draft."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">ToolLoopAgent</Badge>
                  <Badge variant="outline">Vercel Sandbox</Badge>
                  <Badge variant="outline">{chatModel}</Badge>
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
                      disabled={!canStartChatTurn}
                      onClick={regenerateChatTurn}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <ArrowClockwiseIcon className="size-3.5" />
                      Retry
                    </Button>
                  ) : null}
                  <PromptInputSubmit
                    disabled={!canStartChatTurn}
                    status={status}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>

            {hasMessages ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <Button
                    disabled={!canStartChatTurn}
                    key={prompt}
                    onClick={() => sendChatMessage(prompt)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <WrenchIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <Badge className="mt-2" variant="secondary">
              {environmentLabel}
            </Badge>
            <p className="mt-1 text-muted-foreground text-sm">
              {sandboxProvider}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Available skills
            </p>
            {availableSkills.map((skill) => (
              <div
                className="space-y-1 border border-foreground/10 p-3"
                key={skill.name}
              >
                <p className="font-medium text-sm">{skill.name}</p>
                <p className="text-muted-foreground text-sm/relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Configured tools
            </p>
            {configuredTools.map((tool) => (
              <div
                className="space-y-1 border border-foreground/10 p-3"
                key={tool.name}
              >
                <p className="font-medium text-sm">{tool.name}</p>
                <p className="text-muted-foreground text-sm/relaxed">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Artifact targets
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">artifacts/CONTEXT.md</Badge>
              <Badge variant="secondary">
                artifacts/&lt;skill&gt;/SKILL.md
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Source core
            </p>
            <p className="mt-1 text-sm">
              The model starts from skill metadata, calls <code>skill</code> for
              full instructions, then uses sandbox tools for file and shell
              work.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
