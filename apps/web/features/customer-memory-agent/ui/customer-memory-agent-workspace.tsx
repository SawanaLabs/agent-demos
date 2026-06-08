"use client";

import { useMemo } from "react";

import type { CustomerMemoryProfile } from "../customer-profiles";
import { CustomerMemoryChatPanel } from "./customer-memory-chat-panel";
import { CustomerMemoryInsightsSidebar } from "./customer-memory-insights-sidebar";
import { CustomerMemoryNavigationSidebar } from "./customer-memory-navigation-sidebar";
import { getCustomerMemorySamplePrompts } from "./customer-memory-session";
import { useCustomerMemorySession } from "./use-customer-memory-session";

interface CustomerMemoryAgentWorkspaceProps {
  chatModel: string;
  compactionThreshold: number;
  customers: CustomerMemoryProfile[];
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function CustomerMemoryAgentWorkspace({
  chatModel,
  compactionThreshold,
  customers,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: CustomerMemoryAgentWorkspaceProps) {
  const controller = useCustomerMemorySession(isChatAvailable);
  const samplePrompts = useMemo(
    () => getCustomerMemorySamplePrompts(controller.customerId),
    [controller.customerId]
  );

  return (
    <div className="grid min-h-[74svh] gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[16rem_minmax(0,1fr)_22rem]">
      <CustomerMemoryNavigationSidebar
        activeThreadId={controller.activeThreadId}
        customerId={controller.customerId}
        customers={customers}
        isBusy={controller.isBusy}
        isReadonlyAccount={controller.isReadonlyAccount}
        isReady={controller.isReady}
        isSessionLoading={controller.isSessionLoading}
        onCreateThread={controller.createThread}
        onSelectCustomer={controller.selectCustomer}
        onSelectThread={controller.selectThread}
        session={controller.session}
      />
      <CustomerMemoryChatPanel
        chatErrorMessage={controller.chatErrorMessage}
        chatModel={chatModel}
        compactionThreshold={compactionThreshold}
        isBusy={controller.isBusy}
        isChatAvailable={isChatAvailable}
        isReadonlyAccount={controller.isReadonlyAccount}
        isReady={controller.isReady}
        isSessionLoading={controller.isSessionLoading}
        messages={controller.messages}
        onRegenerateLastTurn={controller.regenerateLastTurn}
        onSendPrompt={controller.sendPrompt}
        onStopChat={controller.stopChat}
        samplePrompts={samplePrompts}
        session={controller.session}
        sessionErrorMessage={controller.sessionErrorMessage}
        setupMessage={setupMessage}
        status={controller.status}
      />
      <CustomerMemoryInsightsSidebar
        compactionThreshold={compactionThreshold}
        isChatAvailable={isChatAvailable}
        isSessionLoading={controller.isSessionLoading}
        latestPrompt={controller.latestPrompt}
        nodeVersion={nodeVersion}
        onRefreshSession={controller.refreshSession}
        session={controller.session}
        viewState={controller.viewState}
      />
    </div>
  );
}
