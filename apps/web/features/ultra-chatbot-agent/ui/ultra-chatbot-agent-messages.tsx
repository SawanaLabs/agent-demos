"use client";

import { ThumbsDownIcon, ThumbsUpIcon } from "@phosphor-icons/react";
import { Attachments } from "@workspace/ui/components/ai-elements/attachments";
import {
  Message,
  MessageContent,
} from "@workspace/ui/components/ai-elements/message";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";

import { UltraChatbotAgentDocumentPreview } from "./ultra-chatbot-agent-document-preview";
import { UltraChatbotAgentKnowledgeBaseResultCard } from "./ultra-chatbot-agent-knowledge-base-result";
import {
  getUltraChatbotAgentProjectDocsMcpResult,
  isUltraChatbotAgentDocumentResult,
  isUltraChatbotAgentKnowledgeBaseResult,
  isUltraChatbotAgentResearchReportResult,
  type UltraChatbotAgentToolPart,
} from "./ultra-chatbot-agent-message-parts";
import { UltraChatbotAgentMessageReasoning } from "./ultra-chatbot-agent-message-reasoning";
import {
  buildUltraChatbotAgentMessageRenderPlan,
  type UltraChatbotAgentMessageRenderPlan,
  type UltraChatbotAgentPendingVote,
} from "./ultra-chatbot-agent-message-rendering-model";
import { UltraChatbotAgentMessageResponse } from "./ultra-chatbot-agent-message-response";
import { UltraChatbotAgentPreviewAttachment } from "./ultra-chatbot-agent-preview-attachment";
import { UltraChatbotAgentProjectDocsResultCard } from "./ultra-chatbot-agent-project-docs-result";
import { UltraChatbotAgentResearchReport } from "./ultra-chatbot-agent-research-report";
import { UltraChatbotAgentSandboxConfirmation } from "./ultra-chatbot-agent-sandbox-confirmation";
import { UltraChatbotAgentSources } from "./ultra-chatbot-agent-sources";
import {
  hasUltraChatbotAgentDocumentToolError,
  isUltraChatbotAgentDocumentTool,
  isUltraChatbotAgentWeatherResult,
} from "./ultra-chatbot-agent-tool-results";
import { UltraChatbotAgentWeather } from "./ultra-chatbot-agent-weather";

interface UltraChatbotAgentMessagesProps {
  chatId: string;
  editingMessageId: string | null;
  editingRetainedFileUrls: string[];
  editingText: string;
  isBusy: boolean;
  isSandboxUpdating: boolean;
  messages: UIMessage[];
  onArtifactOpen: (documentId: string) => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onRemoveEditingFile: (url: string) => void;
  onSandboxApprovalResponse: (input: {
    approvalId: string;
    approved: boolean;
    reason: string;
  }) => void | Promise<void>;
  onSaveEdit: (message: UIMessage) => void | Promise<void>;
  onStartEdit: (input: {
    retainedFileUrls: string[];
    text: string;
    messageId: string;
  }) => void;
  onVote: (messageId: string, type: "down" | "up") => void | Promise<void>;
  pendingVote: UltraChatbotAgentPendingVote | null;
  showResumeThinking: boolean;
  showThinking: boolean;
  status: string;
  votesByMessageId: Record<string, boolean>;
}

export function UltraChatbotAgentMessages({
  chatId,
  editingMessageId,
  editingRetainedFileUrls,
  editingText,
  isBusy,
  isSandboxUpdating,
  messages,
  onArtifactOpen,
  onCancelEdit,
  onEditTextChange,
  onRemoveEditingFile,
  onSandboxApprovalResponse,
  onSaveEdit,
  onStartEdit,
  onVote,
  pendingVote,
  showResumeThinking,
  showThinking,
  status,
  votesByMessageId,
}: UltraChatbotAgentMessagesProps) {
  const lastMessageId = messages.at(-1)?.id;

  return (
    <>
      {messages.map((message) => {
        const plan = buildUltraChatbotAgentMessageRenderPlan({
          currentVote: votesByMessageId[message.id],
          editingMessageId,
          isBusy,
          isLastMessage: lastMessageId === message.id,
          message,
          pendingVote,
          showThinking,
          status,
        });

        return (
          <UltraChatbotAgentMessage
            chatId={chatId}
            editingRetainedFileUrls={editingRetainedFileUrls}
            editingText={editingText}
            isBusy={isBusy}
            isSandboxUpdating={isSandboxUpdating}
            key={message.id}
            message={message}
            onArtifactOpen={onArtifactOpen}
            onCancelEdit={onCancelEdit}
            onEditTextChange={onEditTextChange}
            onRemoveEditingFile={onRemoveEditingFile}
            onSandboxApprovalResponse={onSandboxApprovalResponse}
            onSaveEdit={onSaveEdit}
            onStartEdit={onStartEdit}
            onVote={onVote}
            plan={plan}
          />
        );
      })}
      {showResumeThinking ? (
        <Message from="assistant">
          <MessageContent className="w-full min-w-0 max-w-3xl">
            <Shimmer className="text-sm">Thinking...</Shimmer>
          </MessageContent>
        </Message>
      ) : null}
    </>
  );
}

function UltraChatbotAgentMessage({
  chatId,
  editingRetainedFileUrls,
  editingText,
  isBusy,
  isSandboxUpdating,
  message,
  onArtifactOpen,
  onCancelEdit,
  onEditTextChange,
  onRemoveEditingFile,
  onSandboxApprovalResponse,
  onSaveEdit,
  onStartEdit,
  onVote,
  plan,
}: {
  chatId: string;
  editingRetainedFileUrls: string[];
  editingText: string;
  isBusy: boolean;
  isSandboxUpdating: boolean;
  message: UIMessage;
  onArtifactOpen: (documentId: string) => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onRemoveEditingFile: (url: string) => void;
  onSandboxApprovalResponse: UltraChatbotAgentMessagesProps["onSandboxApprovalResponse"];
  onSaveEdit: (message: UIMessage) => void | Promise<void>;
  onStartEdit: UltraChatbotAgentMessagesProps["onStartEdit"];
  onVote: (messageId: string, type: "down" | "up") => void | Promise<void>;
  plan: UltraChatbotAgentMessageRenderPlan;
}) {
  return (
    <Message from={message.role}>
      <MessageContent
        className={cn(
          message.role === "assistant"
            ? "w-full min-w-0 max-w-[min(100%,48rem)]"
            : "min-w-0 max-w-[min(100%,42rem)]"
        )}
      >
        {plan.toolParts.map((part) => (
          <UltraChatbotAgentToolPartView
            chatId={chatId}
            isSandboxUpdating={isSandboxUpdating}
            key={part.toolCallId}
            onArtifactOpen={onArtifactOpen}
            onSandboxApprovalResponse={onSandboxApprovalResponse}
            part={part}
          />
        ))}
        {plan.reasoningText ? (
          <UltraChatbotAgentMessageReasoning
            isLoading={plan.isReasoningStreaming}
            reasoning={plan.reasoningText}
          />
        ) : null}
        <UltraChatbotAgentSources sources={plan.sources} />
        {plan.isEditing ? (
          <UltraChatbotAgentMessageEditForm
            editingRetainedFileUrls={editingRetainedFileUrls}
            editingText={editingText}
            files={plan.files}
            isBusy={isBusy}
            messageId={message.id}
            onCancelEdit={onCancelEdit}
            onEditTextChange={onEditTextChange}
            onRemoveEditingFile={onRemoveEditingFile}
            onSaveEdit={() => onSaveEdit(message)}
          />
        ) : (
          <UltraChatbotAgentMessageBody messageId={message.id} plan={plan} />
        )}
        {plan.showFeedbackButtons ? (
          <UltraChatbotAgentMessageFeedback
            onVote={(type) => onVote(message.id, type)}
            plan={plan}
          />
        ) : null}
      </MessageContent>
      {plan.showEditButton ? (
        <div className="mt-3 flex w-full justify-end">
          <Button
            disabled={isBusy}
            onClick={() =>
              onStartEdit({
                messageId: message.id,
                retainedFileUrls: plan.files.map((part) => part.url),
                text: plan.text,
              })
            }
            size="sm"
            type="button"
            variant="outline"
          >
            Edit
          </Button>
        </div>
      ) : null}
    </Message>
  );
}

function UltraChatbotAgentMessageBody({
  messageId,
  plan,
}: {
  messageId: string;
  plan: UltraChatbotAgentMessageRenderPlan;
}) {
  if (plan.bodyKind === "text") {
    return (
      <div className="space-y-4">
        {plan.files.length > 0 ? (
          <UltraChatbotAgentMessageAttachments
            files={plan.files}
            messageId={messageId}
          />
        ) : null}
        <UltraChatbotAgentMessageResponse>
          {plan.text}
        </UltraChatbotAgentMessageResponse>
      </div>
    );
  }

  if (plan.bodyKind === "files") {
    return (
      <UltraChatbotAgentMessageAttachments
        files={plan.files}
        messageId={messageId}
      />
    );
  }

  if (plan.bodyKind === "thinking") {
    return <Shimmer className="text-sm">Thinking...</Shimmer>;
  }

  if (plan.bodyKind === "tool-only" || plan.bodyKind === "source-only") {
    return null;
  }

  return (
    <p className="text-muted-foreground text-sm">Waiting for visible output.</p>
  );
}

function UltraChatbotAgentMessageEditForm({
  editingRetainedFileUrls,
  editingText,
  files,
  isBusy,
  messageId,
  onCancelEdit,
  onEditTextChange,
  onRemoveEditingFile,
  onSaveEdit,
}: {
  editingRetainedFileUrls: string[];
  editingText: string;
  files: UltraChatbotAgentMessageRenderPlan["files"];
  isBusy: boolean;
  messageId: string;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onRemoveEditingFile: (url: string) => void;
  onSaveEdit: () => void | Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {files.length > 0 ? (
        <UltraChatbotAgentMessageAttachments
          files={files.filter((part) =>
            editingRetainedFileUrls.includes(part.url)
          )}
          messageId={messageId}
          onRemove={onRemoveEditingFile}
        />
      ) : null}
      <Textarea
        onChange={(event) => onEditTextChange(event.target.value)}
        value={editingText}
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          disabled={isBusy}
          onClick={onSaveEdit}
          size="sm"
          type="button"
          variant="outline"
        >
          Save and replay
        </Button>
        <Button onClick={onCancelEdit} size="sm" type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function UltraChatbotAgentMessageAttachments({
  files,
  messageId,
  onRemove,
}: {
  files: UltraChatbotAgentMessageRenderPlan["files"];
  messageId: string;
  onRemove?: (url: string) => void;
}) {
  return (
    <Attachments variant="list">
      {files.map((part) => {
        const attachmentId = `${messageId}-${part.filename ?? "attachment"}-${part.url}`;

        return (
          <UltraChatbotAgentPreviewAttachment
            attachment={{
              ...part,
              id: attachmentId,
            }}
            key={attachmentId}
            onRemove={onRemove ? () => onRemove(part.url) : undefined}
          />
        );
      })}
    </Attachments>
  );
}

function UltraChatbotAgentMessageFeedback({
  onVote,
  plan,
}: {
  onVote: (type: "down" | "up") => void | Promise<void>;
  plan: UltraChatbotAgentMessageRenderPlan;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <Button
        aria-label="Helpful"
        disabled={plan.isVotePending}
        onClick={() => onVote("up")}
        size="sm"
        title="Helpful"
        type="button"
        variant={plan.currentVote === true ? "secondary" : "outline"}
      >
        {getHelpfulButtonIcon(plan)}
        {plan.currentVote === true && !plan.isHelpfulPending ? (
          <span>Helpful</span>
        ) : null}
      </Button>
      <Button
        aria-label="Needs work"
        disabled={plan.isVotePending}
        onClick={() => onVote("down")}
        size="sm"
        title="Needs work"
        type="button"
        variant={plan.currentVote === false ? "secondary" : "outline"}
      >
        {getNeedsWorkButtonIcon(plan)}
        {plan.currentVote === false && !plan.isNeedsWorkPending ? (
          <span>Needs work</span>
        ) : null}
      </Button>
    </div>
  );
}

function getHelpfulButtonIcon(
  plan: UltraChatbotAgentMessageRenderPlan
): ReactNode {
  if (plan.isHelpfulPending) {
    return <Spinner className="size-3.5" />;
  }

  return plan.currentVote === true ? (
    <ThumbsUpIcon className="size-3.5 text-emerald-500" />
  ) : (
    <ThumbsUpIcon className="size-3.5" />
  );
}

function getNeedsWorkButtonIcon(
  plan: UltraChatbotAgentMessageRenderPlan
): ReactNode {
  if (plan.isNeedsWorkPending) {
    return <Spinner className="size-3.5" />;
  }

  return plan.currentVote === false ? (
    <ThumbsDownIcon className="size-3.5 text-rose-500" />
  ) : (
    <ThumbsDownIcon className="size-3.5" />
  );
}

function UltraChatbotAgentToolPartView({
  chatId,
  isSandboxUpdating,
  onArtifactOpen,
  onSandboxApprovalResponse,
  part,
}: {
  chatId: string;
  isSandboxUpdating: boolean;
  onArtifactOpen: (documentId: string) => void;
  onSandboxApprovalResponse: UltraChatbotAgentMessagesProps["onSandboxApprovalResponse"];
  part: UltraChatbotAgentToolPart;
}) {
  const documentResult =
    part.state === "output-available" &&
    isUltraChatbotAgentDocumentResult(part.output)
      ? part.output
      : null;
  const weatherResult =
    part.state === "output-available" &&
    isUltraChatbotAgentWeatherResult(part.output)
      ? part.output
      : null;
  const isDocumentTool = isUltraChatbotAgentDocumentTool(part);
  const researchReportResult =
    part.state === "output-available" &&
    part.type === "tool-createResearchReport" &&
    isUltraChatbotAgentResearchReportResult(part.output)
      ? part.output
      : null;
  const knowledgeBaseResult =
    part.state === "output-available" &&
    part.type === "tool-searchKnowledgeBase" &&
    isUltraChatbotAgentKnowledgeBaseResult(part.output)
      ? part.output
      : null;
  const projectDocsResult = getUltraChatbotAgentProjectDocsMcpResult(part);

  if (hasUltraChatbotAgentDocumentToolError(part, isDocumentTool)) {
    return (
      <div className="w-full rounded-xl border border-destructive/30 px-4 py-3 text-destructive text-sm">
        {String(part.output.error)}
      </div>
    );
  }

  if (documentResult && isDocumentTool) {
    return (
      <UltraChatbotAgentDocumentPreview
        chatId={chatId}
        onOpen={onArtifactOpen}
        result={documentResult}
      />
    );
  }

  if (researchReportResult) {
    return <UltraChatbotAgentResearchReport report={researchReportResult} />;
  }

  if (knowledgeBaseResult) {
    return (
      <UltraChatbotAgentKnowledgeBaseResultCard result={knowledgeBaseResult} />
    );
  }

  if (projectDocsResult) {
    return (
      <UltraChatbotAgentProjectDocsResultCard result={projectDocsResult} />
    );
  }

  return (
    <div className="space-y-3">
      {part.type === "tool-enableSandbox" ? (
        <UltraChatbotAgentSandboxConfirmation
          isPending={isSandboxUpdating}
          onApprovalResponse={onSandboxApprovalResponse}
          part={part}
        />
      ) : null}
      <Tool defaultOpen={false}>
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
          {weatherResult ? null : (
            <ToolOutput errorText={part.errorText} output={part.output} />
          )}
          {weatherResult ? (
            <UltraChatbotAgentWeather weather={weatherResult} />
          ) : null}
        </ToolContent>
      </Tool>
    </div>
  );
}
