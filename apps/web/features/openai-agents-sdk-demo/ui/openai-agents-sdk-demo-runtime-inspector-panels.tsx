import { Badge } from "@workspace/ui/components/badge";

import type { OpenAiAgentsSdkDemoContextProfile } from "../server/context";
import type { OpenAiAgentsSdkDemoAiSdkExtensionProfile } from "../server/extensions";
import type { OpenAiAgentsSdkDemoRunProfile } from "../server/running";
import type { OpenAiAgentsSdkDemoSessionProfile } from "../server/sessions";
import {
  InspectorBadge,
  InspectorRow,
} from "./openai-agents-sdk-demo-inspector-common";
import type { OpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-inspector-types";

export function OpenAiAgentsSdkDemoRuntimeInspectorPanels({
  aiSdkExtensionProfile,
  contextProfile,
  nodeVersion,
  runProfile,
  runtimeInspector,
  sessionProfile,
}: {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  contextProfile: OpenAiAgentsSdkDemoContextProfile;
  nodeVersion: string;
  runProfile: OpenAiAgentsSdkDemoRunProfile;
  runtimeInspector: OpenAiAgentsSdkDemoRuntimeInspector;
  sessionProfile: OpenAiAgentsSdkDemoSessionProfile;
}) {
  return (
    <>
      <OpenAiAgentsSdkDemoRuntimePanel nodeVersion={nodeVersion} />
      <OpenAiAgentsSdkDemoContractPanel />
      <OpenAiAgentsSdkDemoRunningPanel
        lastResponseId={runtimeInspector.lastResponseId ?? null}
        runProfile={runProfile}
      />
      <OpenAiAgentsSdkDemoContextPanel
        contextProfile={contextProfile}
        lastContextSummary={runtimeInspector.lastContextSummary}
      />
      <OpenAiAgentsSdkDemoSessionsPanel
        lastSessionSummary={runtimeInspector.lastSessionSummary}
        sessionProfile={sessionProfile}
      />
      <OpenAiAgentsSdkDemoStreamingPanel
        lastStreamSummary={runtimeInspector.lastStreamSummary}
      />
      <OpenAiAgentsSdkDemoAiSdkExtensionPanel
        aiSdkExtensionProfile={aiSdkExtensionProfile}
        aiSdkModelAdapterStatus={runtimeInspector.aiSdkModelAdapterStatus}
        aiSdkUiBridgeStatus={runtimeInspector.aiSdkUiBridgeStatus}
      />
    </>
  );
}

function OpenAiAgentsSdkDemoRuntimePanel({
  nodeVersion,
}: {
  nodeVersion: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Runtime
      </p>
      <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
    </div>
  );
}

function OpenAiAgentsSdkDemoContractPanel() {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Contract
      </p>
      <p className="mt-1 text-sm">
        This slot keeps the agent backend on the official OpenAI run path and
        lets the existing AI SDK UI frontend consume the result without a custom
        stream protocol.
      </p>
    </div>
  );
}

function OpenAiAgentsSdkDemoRunningPanel({
  lastResponseId,
  runProfile,
}: {
  lastResponseId: string | null;
  runProfile: OpenAiAgentsSdkDemoRunProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Running
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Workflow" value={runProfile.workflowName} />
        <InspectorRow
          label="Continuation"
          value={runProfile.continuationStrategy}
        />
        <InspectorRow label="Max turns" value={runProfile.maxTurns} />
        <InspectorRow
          label="Abort"
          value={runProfile.usesRequestSignal ? "request.signal" : "none"}
        />
        <InspectorRow
          label="Last response"
          value={lastResponseId ?? "Not available yet"}
        />
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoContextPanel({
  contextProfile,
  lastContextSummary,
}: {
  contextProfile: OpenAiAgentsSdkDemoContextProfile;
  lastContextSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastContextSummary"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Context
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow
          label="Primitive"
          value={contextProfile.localContextPrimitive}
        />
        <InspectorRow
          label="Session binding"
          value={contextProfile.sessionBinding}
        />
        <InspectorRow
          label="Run mode"
          value={lastContextSummary?.researchMode ?? "No run yet"}
        />
        <InspectorRow
          label="Default target"
          value={contextProfile.suggestedDefaultTarget}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="Channels"
            values={contextProfile.passesContextInto}
          />
          <div>
            <p className="text-muted-foreground text-xs">Latest user prompt</p>
            <p className="mt-1 text-xs/relaxed">
              {lastContextSummary?.latestUserPromptPreview ||
                "No context metadata yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoSessionsPanel({
  lastSessionSummary,
  sessionProfile,
}: {
  lastSessionSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastSessionSummary"];
  sessionProfile: OpenAiAgentsSdkDemoSessionProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Sessions
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Primitive" value={sessionProfile.sdkPrimitive} />
        <InspectorRow label="Storage" value={sessionProfile.historyStorage} />
        <InspectorRow
          label="Transport"
          value={sessionProfile.sessionTransport}
        />
        <InspectorRow
          label="Session id"
          value={lastSessionSummary?.sessionId ?? "Not created yet"}
        />
        <InspectorRow
          label="History items"
          value={lastSessionSummary?.historyItemCount ?? 0}
        />
        <InspectorRow
          label="CRUD helpers"
          value={
            sessionProfile.supportsCrudHelpers ? "get/add/pop/clear" : "none"
          }
        />
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoStreamingPanel({
  lastStreamSummary,
}: {
  lastStreamSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastStreamSummary"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Streaming
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Bridge" value="createAiSdkUiMessageStream()" />
        <InspectorRow
          label="Raw model events"
          value={lastStreamSummary?.rawModelEventCount ?? 0}
        />
        <InspectorRow
          label="Run item events"
          value={lastStreamSummary?.runItemEventCount ?? 0}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="Agents"
            values={getInspectorListValues(
              lastStreamSummary?.agentNames,
              "No stream metadata yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Raw event types"
            values={getInspectorListValues(
              lastStreamSummary?.rawModelEventTypes,
              "No stream metadata yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Run item names"
            values={getInspectorListValues(
              lastStreamSummary?.runItemEventNames,
              "No stream metadata yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Sources"
            values={getInspectorListValues(
              lastStreamSummary?.rawModelSources,
              "No stream metadata yet"
            )}
          />
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoAiSdkExtensionPanel({
  aiSdkExtensionProfile,
  aiSdkModelAdapterStatus,
  aiSdkUiBridgeStatus,
}: {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  aiSdkModelAdapterStatus: string;
  aiSdkUiBridgeStatus: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        AI SDK Extension
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow
          label="UI bridge"
          value={aiSdkExtensionProfile.uiBridge.sdkPrimitive}
        />
        <InspectorRow
          label="Response helper"
          value={aiSdkExtensionProfile.uiBridge.responseHelper}
        />
        <InspectorRow
          label="Bridge status"
          value={<InspectorBadge>{aiSdkUiBridgeStatus}</InspectorBadge>}
        />
        <InspectorRow
          label="Model adapter"
          value={aiSdkExtensionProfile.modelAdapter.sdkPrimitive}
        />
        <InspectorRow
          label="Adapter status"
          value={<InspectorBadge>{aiSdkModelAdapterStatus}</InspectorBadge>}
        />
        <p className="pt-1 text-muted-foreground text-xs/relaxed">
          {aiSdkExtensionProfile.modelAdapter.notes}
        </p>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoBadgeList({
  label,
  values,
}: {
  label: string;
  values: readonly string[];
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Badge key={value} variant="outline">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function getInspectorListValues(
  values: readonly string[] | undefined,
  fallback: string
) {
  return values?.length ? values : [fallback];
}
