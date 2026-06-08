import { Badge } from "@workspace/ui/components/badge";

import type { OpenAiAgentsSdkDemoHandoffCatalogEntry } from "../server/handoffs";
import type {
  OpenAiAgentsSdkDemoMcpCatalogEntry,
  OpenAiAgentsSdkDemoMcpProfile,
} from "../server/mcp";
import type { OpenAiAgentsSdkDemoModelProfile } from "../server/models";
import type { OpenAiAgentsSdkDemoSandboxProfile } from "../server/sandbox";
import type { OpenAiAgentsSdkDemoTraceProfile } from "../server/tracing";
import {
  InspectorBadge,
  InspectorRow,
} from "./openai-agents-sdk-demo-inspector-common";
import type { OpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-inspector-types";

export function OpenAiAgentsSdkDemoAgentInspectorPanels({
  handoffCatalog,
  mcpCatalog,
  mcpProfile,
  modelProfile,
  runtimeInspector,
  sandboxProfile,
  traceProfile,
}: {
  handoffCatalog: OpenAiAgentsSdkDemoHandoffCatalogEntry[];
  mcpCatalog: OpenAiAgentsSdkDemoMcpCatalogEntry[];
  mcpProfile: OpenAiAgentsSdkDemoMcpProfile;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  runtimeInspector: OpenAiAgentsSdkDemoRuntimeInspector;
  sandboxProfile: OpenAiAgentsSdkDemoSandboxProfile;
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
}) {
  return (
    <>
      <OpenAiAgentsSdkDemoHandoffsPanel
        handoffCatalog={handoffCatalog}
        lastHandoffSummary={runtimeInspector.lastHandoffSummary}
      />
      <OpenAiAgentsSdkDemoMcpPanel
        lastMcpSummary={runtimeInspector.lastMcpSummary}
        mcpCatalog={mcpCatalog}
        mcpProfile={mcpProfile}
      />
      <OpenAiAgentsSdkDemoSandboxPanel
        lastSandboxSummary={runtimeInspector.lastSandboxSummary}
        sandboxProfile={sandboxProfile}
      />
      <OpenAiAgentsSdkDemoTracingPanel
        runtimeInspector={runtimeInspector}
        traceProfile={traceProfile}
      />
      <OpenAiAgentsSdkDemoModelPanel modelProfile={modelProfile} />
    </>
  );
}

function OpenAiAgentsSdkDemoHandoffsPanel({
  handoffCatalog,
  lastHandoffSummary,
}: {
  handoffCatalog: OpenAiAgentsSdkDemoHandoffCatalogEntry[];
  lastHandoffSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastHandoffSummary"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Handoffs
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Configured" value={handoffCatalog.length} />
        <InspectorRow
          label="Active agent"
          value={lastHandoffSummary?.activeAgentName ?? "No handoff yet"}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="Configured handoffs"
            values={handoffCatalog.map((item) => item.name)}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Targets"
            values={getFallbackListValues(
              lastHandoffSummary?.handoffTargetNames,
              "No handoff metadata yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Transitions"
            values={getFallbackListValues(
              lastHandoffSummary?.handoffTransitions,
              "No handoff metadata yet"
            )}
          />
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoMcpPanel({
  lastMcpSummary,
  mcpCatalog,
  mcpProfile,
}: {
  lastMcpSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastMcpSummary"];
  mcpCatalog: OpenAiAgentsSdkDemoMcpCatalogEntry[];
  mcpProfile: OpenAiAgentsSdkDemoMcpProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        MCP
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Transport" value={mcpProfile.transport} />
        <InspectorRow label="Lifecycle" value={mcpProfile.lifecycle} />
        <InspectorRow label="Route" value={mcpProfile.routePath} />
        <InspectorRow
          label="Strict schemas"
          value={mcpProfile.convertSchemasToStrict ? "enabled" : "disabled"}
        />
        <InspectorRow
          label="Active servers"
          value={lastMcpSummary?.activeServerNames.length ?? 0}
        />
        <InspectorRow
          label="Failed servers"
          value={lastMcpSummary?.failedServerNames.length ?? 0}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="SDK primitives"
            values={mcpProfile.sdkPrimitives}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Configured tools"
            values={mcpCatalog.flatMap((server) => server.toolNames)}
            wide
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Used this run"
            values={getFallbackListValues(
              lastMcpSummary?.usedToolNames,
              "No MCP tool usage yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Failed server errors"
            values={getFallbackListValues(
              lastMcpSummary?.failedServerErrors,
              "No MCP connection errors"
            )}
          />
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoSandboxPanel({
  lastSandboxSummary,
  sandboxProfile,
}: {
  lastSandboxSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastSandboxSummary"];
  sandboxProfile: OpenAiAgentsSdkDemoSandboxProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Sandbox
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Client" value={sandboxProfile.clientBackend} />
        <InspectorRow label="Agent model" value={sandboxProfile.agentModel} />
        <InspectorRow
          label="Manifest root"
          value={
            lastSandboxSummary?.manifestRoot ?? sandboxProfile.manifestRoot
          }
        />
        <InspectorRow
          label="Workspace"
          value={sandboxProfile.workspaceSource}
        />
        <InspectorRow
          label="Persistence"
          value={sandboxProfile.sessionPersistence}
        />
        <InspectorRow
          label="Active agent"
          value={lastSandboxSummary?.currentAgentName ?? "No sandbox run yet"}
        />
        <InspectorRow
          label="Workspace ready"
          value={getWorkspaceReadyLabel(lastSandboxSummary)}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="Mounted paths"
            values={
              lastSandboxSummary?.mountedPaths.length
                ? lastSandboxSummary.mountedPaths
                : sandboxProfile.mountedPaths
            }
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Default capabilities"
            values={sandboxProfile.defaultCapabilities}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="SDK primitives"
            values={sandboxProfile.sdkPrimitives}
          />
          <div>
            <p className="text-muted-foreground text-xs">Persisted sessions</p>
            <p className="mt-1 text-xs/relaxed">
              {lastSandboxSummary?.persistedSessionCount ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoTracingPanel({
  runtimeInspector,
  traceProfile,
}: {
  runtimeInspector: OpenAiAgentsSdkDemoRuntimeInspector;
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Tracing
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow
          label="Runtime default"
          value={traceProfile.defaultServerRuntimeTracing}
        />
        <InspectorRow
          label="Workflow source"
          value={traceProfile.workflowNameSource}
        />
        <InspectorRow
          label="Group strategy"
          value={traceProfile.groupingStrategy}
        />
        <InspectorRow
          label="Tracing"
          value={
            runtimeInspector.lastTraceSummary?.tracingDisabled
              ? "disabled"
              : "enabled"
          }
        />
        <InspectorRow
          label="Sensitive data"
          value={
            runtimeInspector.traceIncludesSensitiveData
              ? "included"
              : "redacted"
          }
        />
        <InspectorRow
          label="Export key"
          value={
            runtimeInspector.lastTraceSummary?.exportApiKeySource ??
            traceProfile.exportApiKeySource
          }
        />
        <InspectorRow
          label="Trace id"
          value={runtimeInspector.lastTraceSummary?.traceId ?? "No trace yet"}
        />
        <InspectorRow
          label="Group id"
          value={runtimeInspector.lastTraceSummary?.groupId ?? "No group yet"}
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="SDK primitives"
            values={traceProfile.sdkPrimitives}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Trace metadata keys"
            values={getFallbackListValues(
              runtimeInspector.lastTraceSummary?.metadataKeys,
              "No trace metadata yet"
            )}
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Disable switch"
            values={[traceProfile.disableEnvVar]}
          />
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoModelPanel({
  modelProfile,
}: {
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Model
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow label="Model" value={modelProfile.model} />
        <InspectorRow label="API" value={modelProfile.api} />
        <InspectorRow
          label="Transport"
          value={modelProfile.responsesTransport}
        />
        <InspectorRow label="Reasoning" value={modelProfile.reasoningEffort} />
        <InspectorRow label="Verbosity" value={modelProfile.textVerbosity} />
        <InspectorRow label="Provider" value={modelProfile.provider} />
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoBadgeList({
  label,
  values,
  wide = false,
}: {
  label: string;
  values: readonly string[];
  wide?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div
        className={wide ? "mt-1 grid gap-1.5" : "mt-1 flex flex-wrap gap-1.5"}
      >
        {values.map((value) =>
          wide ? (
            <InspectorBadge className="w-full justify-start" key={value}>
              {value}
            </InspectorBadge>
          ) : (
            <Badge key={value} variant="outline">
              {value}
            </Badge>
          )
        )}
      </div>
    </div>
  );
}

function getFallbackListValues(
  values: readonly string[] | undefined,
  fallback: string
) {
  return values?.length ? values : [fallback];
}

function getWorkspaceReadyLabel(
  summary: OpenAiAgentsSdkDemoRuntimeInspector["lastSandboxSummary"]
) {
  if (!summary) {
    return "unknown";
  }

  return summary.workspaceReady ? "yes" : "no";
}
