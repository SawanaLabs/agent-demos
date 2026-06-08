"use client";

import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@workspace/ui/components/ai-elements/attachments";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@workspace/ui/components/ai-elements/confirmation";
import {
  Message,
  MessageContent,
} from "@workspace/ui/components/ai-elements/message";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@workspace/ui/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { Button } from "@workspace/ui/components/button";
import type { ChatAddToolApproveResponseFunction } from "ai";

import {
  getOpenAiAgentsSdkDemoApprovalInputFields,
  type getOpenAiAgentsSdkDemoFileParts,
  type getOpenAiAgentsSdkDemoSourceParts,
  getOpenAiAgentsSdkDemoToolDisplayState,
  getOpenAiAgentsSdkDemoToolName,
} from "./openai-agents-sdk-demo-session";
import type { OpenAiAgentsSdkDemoChatError } from "./openai-agents-sdk-demo-workspace-types";

export function OpenAiAgentsSdkDemoToolParts({
  isMessageStreaming,
  onApprovalResponse,
  toolParts,
}: {
  isMessageStreaming: boolean;
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  toolParts: ToolPart[];
}) {
  return toolParts.map((part) =>
    part.state === "approval-requested" ||
    part.state === "approval-responded" ? (
      <OpenAiAgentsSdkDemoToolApproval
        key={part.toolCallId}
        onApprovalResponse={onApprovalResponse}
        part={part}
      />
    ) : (
      <OpenAiAgentsSdkDemoToolTrace
        isMessageStreaming={isMessageStreaming}
        key={part.toolCallId}
        part={part}
      />
    )
  );
}

export function OpenAiAgentsSdkDemoAttachments({
  fileParts,
  messageId,
}: {
  fileParts: ReturnType<typeof getOpenAiAgentsSdkDemoFileParts>;
  messageId: string;
}) {
  if (fileParts.length === 0) {
    return null;
  }

  return (
    <Attachments variant="list">
      {fileParts.map((part) => {
        const attachmentId = `${messageId}-${part.filename ?? "attachment"}-${part.url}`;

        return (
          <Attachment
            data={{
              ...part,
              id: attachmentId,
            }}
            key={attachmentId}
          >
            <AttachmentPreview />
            <AttachmentInfo showMediaType />
          </Attachment>
        );
      })}
    </Attachments>
  );
}

export function ThinkingState() {
  return <Shimmer className="text-sm">Thinking...</Shimmer>;
}

function getApprovalInputPreview(part: ToolPart) {
  if (typeof part.input === "string") {
    return part.input;
  }

  try {
    return JSON.stringify(part.input, null, 2);
  } catch {
    return String(part.input);
  }
}

function OpenAiAgentsSdkDemoToolApproval({
  onApprovalResponse,
  part,
}: {
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  part: ToolPart;
}) {
  if (!("approval" in part && part.approval)) {
    return null;
  }

  const approval = part.approval;
  const fields = getOpenAiAgentsSdkDemoApprovalInputFields(part);
  const preview = getApprovalInputPreview(part);

  return (
    <Confirmation
      approval={approval}
      className="border-amber-500/30 bg-amber-500/5"
      state={part.state}
    >
      <ConfirmationTitle>Human approval checkpoint</ConfirmationTitle>
      <ConfirmationRequest>
        <div className="space-y-2 text-sm">
          <p>
            Approve {getOpenAiAgentsSdkDemoToolName(part)} before the agent
            continues?
          </p>
          {fields.length > 0 ? (
            <div className="grid gap-2">
              {fields.map((field) => (
                <div
                  className="grid gap-1 rounded border border-foreground/10 px-3 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]"
                  key={field.label}
                >
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                    {field.label}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground text-xs">
              {preview}
            </pre>
          )}
        </div>
      </ConfirmationRequest>
      <ConfirmationAccepted>
        <CheckCircleIcon className="size-4" />
        <span>Approved. The agent can continue this run.</span>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <XCircleIcon className="size-4" />
        <span>Rejected. The agent will continue with the denial result.</span>
      </ConfirmationRejected>
      <ConfirmationActions>
        <ConfirmationAction
          onClick={() =>
            onApprovalResponse({
              approved: false,
              id: approval.id,
              reason: "Reviewer rejected the approval request.",
            })
          }
          variant="outline"
        >
          <XCircleIcon className="size-3.5" />
          Reject
        </ConfirmationAction>
        <ConfirmationAction
          onClick={() =>
            onApprovalResponse({
              approved: true,
              id: approval.id,
              reason: "Reviewer approved the request.",
            })
          }
        >
          <CheckCircleIcon className="size-3.5" />
          Approve
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}

function OpenAiAgentsSdkDemoToolTrace({
  isMessageStreaming,
  part,
}: {
  isMessageStreaming: boolean;
  part: ToolPart;
}) {
  const toolName = getOpenAiAgentsSdkDemoToolName(part);
  const displayState = getOpenAiAgentsSdkDemoToolDisplayState(part, {
    isMessageStreaming,
  });
  const hasRenderableOutput = Boolean(part.output || part.errorText);
  const isSettledInputOnly =
    displayState === "output-available" &&
    (part.state === "input-available" || part.state === "input-streaming") &&
    !hasRenderableOutput;

  return (
    <Tool>
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          state={displayState}
          title={toolName}
          toolName={toolName}
          type={part.type}
        />
      ) : (
        <ToolHeader state={displayState} title={toolName} type={part.type} />
      )}
      <ToolContent>
        {part.input ? <ToolInput input={part.input} /> : null}
        {isSettledInputOnly ? (
          <p className="text-muted-foreground text-sm">
            Hosted tool completed without a renderable output payload.
          </p>
        ) : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}

export function OpenAiAgentsSdkDemoSources({
  sources,
}: {
  sources: ReturnType<typeof getOpenAiAgentsSdkDemoSourceParts>;
}) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source
            href={source.url}
            key={source.sourceId}
            title={source.title}
          />
        ))}
      </SourcesContent>
    </Sources>
  );
}

export function OpenAiAgentsSdkDemoErrorMessage({
  error,
  onRetry,
}: {
  error: OpenAiAgentsSdkDemoChatError;
  onRetry: (text: string) => void;
}) {
  return (
    <Message from="assistant">
      <MessageContent className="max-w-3xl">
        <div
          className="space-y-3 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          role="alert"
        >
          <div className="flex items-start gap-2 text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 space-y-1">
              <p className="font-medium">Agent turn failed</p>
              <p className="whitespace-pre-wrap break-words text-destructive/90">
                {error.message}
              </p>
            </div>
          </div>
          {error.retryText ? (
            <Button
              onClick={() => onRetry(error.retryText ?? "")}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowClockwiseIcon className="size-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      </MessageContent>
    </Message>
  );
}
