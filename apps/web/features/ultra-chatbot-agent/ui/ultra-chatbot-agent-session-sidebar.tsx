"use client";

import { ArrowClockwiseIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import Link from "next/link";

import { ultraChatbotAgentKnowledgeSource } from "../knowledge-source";
import type { UltraChatbotAgentChatSession } from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import { UltraChatbotAgentArtifact } from "./ultra-chatbot-agent-artifact";
import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

const nodeVersionPrefixPattern = /^v/;

function formatDateTime(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

interface UltraChatbotAgentSessionSidebarProps {
  artifactMode: UltraChatbotAgentArtifactMode;
  artifactRefreshToken: number;
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  disabled: boolean;
  hasMessages: boolean;
  initialSession: UltraChatbotAgentChatSession | null;
  isSandboxUpdating: boolean;
  nodeVersion: string;
  onArtifactClose: () => void;
  onArtifactModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onArtifactOpen: (documentId: string) => void;
  onArtifactRefresh: () => void;
  onResumeStream: () => void;
  onSandboxCapabilityChange: (sandboxEnabled: boolean) => void;
  sandboxError: string | null;
  selectedDocumentId: string | null;
  selectedModel: UltraChatbotAgentModel | undefined;
}

export function UltraChatbotAgentSessionSidebar({
  artifactMode,
  artifactRefreshToken,
  chatMeta,
  disabled,
  hasMessages,
  initialSession,
  isSandboxUpdating,
  nodeVersion,
  onArtifactClose,
  onArtifactModeChange,
  onArtifactOpen,
  onArtifactRefresh,
  onResumeStream,
  onSandboxCapabilityChange,
  sandboxError,
  selectedDocumentId,
  selectedModel,
}: UltraChatbotAgentSessionSidebarProps) {
  return (
    <aside className="min-w-0 border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
      <div className="min-w-0 space-y-5">
        <UltraChatbotAgentSessionHeader initialSession={initialSession} />
        <UltraChatbotAgentRouteMeta chatMeta={chatMeta} />
        <UltraChatbotAgentModelMeta selectedModel={selectedModel} />
        <UltraChatbotAgentCapabilityBadges chatMeta={chatMeta} />
        <UltraChatbotAgentSandboxPanel
          chatMeta={chatMeta}
          hasMessages={hasMessages}
          isSandboxUpdating={isSandboxUpdating}
          onSandboxCapabilityChange={onSandboxCapabilityChange}
          sandboxError={sandboxError}
        />
        <UltraChatbotAgentKnowledgePanel />
        <UltraChatbotAgentPortContractPanel />
        <UltraChatbotAgentRuntimePanel nodeVersion={nodeVersion} />
        <UltraChatbotAgentArtifact
          chatId={chatMeta.id}
          disabled={disabled}
          mode={artifactMode}
          onClose={onArtifactClose}
          onModeChange={onArtifactModeChange}
          onOpen={onArtifactOpen}
          onRefresh={onArtifactRefresh}
          refreshToken={artifactRefreshToken}
          selectedDocumentId={selectedDocumentId}
        />
        {initialSession?.chat.activeStreamId ? (
          <Button
            onClick={onResumeStream}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowClockwiseIcon className="size-3.5" />
            Retry resume
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function UltraChatbotAgentSessionHeader({
  initialSession,
}: {
  initialSession: UltraChatbotAgentChatSession | null;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          Session
        </p>
        <p className="mt-1 font-medium text-sm">
          {initialSession ? "Restored route" : "New route promotion"}
        </p>
      </div>
      <Link
        className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
        href="/demos/ultra-chatbot-agent"
      >
        New chat
      </Link>
    </div>
  );
}

function UltraChatbotAgentRouteMeta({
  chatMeta,
}: {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
}) {
  return (
    <>
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          Chat ID
        </p>
        <p className="mt-1 break-all font-mono text-xs">{chatMeta.id}</p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Created
          </p>
          <p className="mt-1 text-sm">{formatDateTime(chatMeta.createdAt)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Updated
          </p>
          <p className="mt-1 text-sm">{formatDateTime(chatMeta.updatedAt)}</p>
        </div>
      </div>
    </>
  );
}

function UltraChatbotAgentModelMeta({
  selectedModel,
}: {
  selectedModel: UltraChatbotAgentModel | undefined;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Current model
      </p>
      <p className="mt-1 text-sm">{selectedModel?.name}</p>
      <p className="mt-1 text-muted-foreground text-xs/relaxed">
        {selectedModel?.description}
      </p>
    </div>
  );
}

function UltraChatbotAgentCapabilityBadges({
  chatMeta,
}: {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Capabilities
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge
          variant={
            chatMeta.capabilities.sandboxEnabled ? "secondary" : "outline"
          }
        >
          {chatMeta.capabilities.sandboxEnabled
            ? "Sandbox enabled"
            : "Sandbox locked"}
        </Badge>
        <Badge variant="outline">Preindexed RAG</Badge>
        <Badge variant="outline">Project Docs MCP</Badge>
      </div>
    </div>
  );
}

function UltraChatbotAgentSandboxPanel({
  chatMeta,
  hasMessages,
  isSandboxUpdating,
  onSandboxCapabilityChange,
  sandboxError,
}: {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  hasMessages: boolean;
  isSandboxUpdating: boolean;
  onSandboxCapabilityChange: (sandboxEnabled: boolean) => void;
  sandboxError: string | null;
}) {
  return (
    <div className="border border-foreground/10 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Sandbox
          </p>
          <p className="mt-1 text-sm">
            {chatMeta.capabilities.sandboxEnabled
              ? "Enabled for this chat"
              : "Approval required"}
          </p>
        </div>
        {chatMeta.capabilities.sandboxEnabled ? (
          <CheckCircleIcon className="mt-0.5 size-4 text-emerald-500" />
        ) : null}
      </div>
      <p className="mt-2 text-muted-foreground text-xs/relaxed">
        Sandbox unlocks repo-local reads, shell execution, and skill-backed
        tools for this route. HITL approvals and this switch share the same
        per-chat capability state.
      </p>
      {sandboxError ? (
        <p className="mt-2 text-destructive text-xs/relaxed">{sandboxError}</p>
      ) : null}
      <Button
        className="mt-3"
        disabled={isSandboxUpdating || !hasMessages}
        onClick={() =>
          onSandboxCapabilityChange(!chatMeta.capabilities.sandboxEnabled)
        }
        size="sm"
        type="button"
        variant="outline"
      >
        {getSandboxCapabilityButtonContent({
          isSandboxUpdating,
          sandboxEnabled: chatMeta.capabilities.sandboxEnabled,
        })}
      </Button>
    </div>
  );
}

function getSandboxCapabilityButtonContent(input: {
  isSandboxUpdating: boolean;
  sandboxEnabled: boolean;
}) {
  if (input.isSandboxUpdating) {
    return <Spinner className="size-3.5" />;
  }

  return input.sandboxEnabled ? "Lock sandbox" : "Enable sandbox";
}

function UltraChatbotAgentKnowledgePanel() {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Knowledge source
      </p>
      <p className="mt-1 text-sm">{ultraChatbotAgentKnowledgeSource.title}</p>
      <p className="mt-1 text-muted-foreground text-xs/relaxed">
        {ultraChatbotAgentKnowledgeSource.description}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
          href={ultraChatbotAgentKnowledgeSource.documentUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open PDF
        </Link>
        <Link
          className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
          href={ultraChatbotAgentKnowledgeSource.sourcePageUrl}
          rel="noreferrer"
          target="_blank"
        >
          Source page
        </Link>
      </div>
    </div>
  );
}

function UltraChatbotAgentPortContractPanel() {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Port contract
      </p>
      <p className="mt-1 text-sm">
        This slice keeps the route identity, visitor isolation, resumable
        streaming, model selection, and the first document companion surface.
      </p>
    </div>
  );
}

function UltraChatbotAgentRuntimePanel({
  nodeVersion,
}: {
  nodeVersion: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Runtime
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant="outline">
          Node {nodeVersion.replace(nodeVersionPrefixPattern, "")}
        </Badge>
        <Badge variant="outline">HTTP-only cookie</Badge>
        <Badge variant="outline">Redis resume</Badge>
      </div>
    </div>
  );
}
