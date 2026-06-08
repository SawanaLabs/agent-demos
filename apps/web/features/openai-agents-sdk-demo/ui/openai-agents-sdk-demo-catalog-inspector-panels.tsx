import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import type { OpenAiAgentsSdkDemoGuardrailCatalogEntry } from "../server/guardrails";
import type { OpenAiAgentsSdkDemoToolCatalogEntry } from "../server/tools";
import {
  getImplementationLabel,
  getRunStatusLabel,
  getStatusClassName,
  getToolAvailabilityClassName,
  InspectorRow,
} from "./openai-agents-sdk-demo-inspector-common";
import type { OpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-inspector-types";

export function OpenAiAgentsSdkDemoCatalogInspectorPanels({
  guardrailCatalog,
  runtimeInspector,
  toolCatalog,
}: {
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  runtimeInspector: OpenAiAgentsSdkDemoRuntimeInspector;
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
}) {
  return (
    <>
      <OpenAiAgentsSdkDemoGuardrailsPanel
        guardrailCatalog={guardrailCatalog}
        usedGuardrailNames={runtimeInspector.usedGuardrailNames}
      />
      <OpenAiAgentsSdkDemoApprovalsPanel
        lastApprovalSummary={runtimeInspector.lastApprovalSummary}
      />
      <OpenAiAgentsSdkDemoResultsPanel
        lastResultSummary={runtimeInspector.lastResultSummary}
      />
      <OpenAiAgentsSdkDemoToolsPanel
        toolCatalog={toolCatalog}
        usedToolNames={runtimeInspector.usedToolNames}
      />
      <OpenAiAgentsSdkDemoGuideCoveragePanel
        guideCoverageWithCurrentRun={
          runtimeInspector.guideCoverageWithCurrentRun
        }
      />
    </>
  );
}

function OpenAiAgentsSdkDemoGuardrailsPanel({
  guardrailCatalog,
  usedGuardrailNames,
}: {
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  usedGuardrailNames: Set<string>;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Guardrails
      </p>
      <div className="mt-2 space-y-2">
        {guardrailCatalog.map((item) => (
          <OpenAiAgentsSdkDemoCatalogCard
            availability={item.availability}
            key={item.name}
            name={item.name}
            notes={item.notes}
            sdkPrimitive={item.sdkPrimitive}
          >
            {usedGuardrailNames.has(item.name) ? (
              <Badge
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                variant="outline"
              >
                Evaluated this run
              </Badge>
            ) : null}
          </OpenAiAgentsSdkDemoCatalogCard>
        ))}
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoApprovalsPanel({
  lastApprovalSummary,
}: {
  lastApprovalSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastApprovalSummary"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Approvals
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow
          label="Pending"
          value={lastApprovalSummary?.pendingApprovals.length ?? 0}
        />
        <InspectorRow
          label="Decisions"
          value={lastApprovalSummary?.decisions.length ?? 0}
        />
        <InspectorRow
          label="Paused state"
          value={
            lastApprovalSummary?.serializedRunState ? "serialized" : "none"
          }
        />
        <div className="space-y-2 pt-1">
          <OpenAiAgentsSdkDemoBadgeList
            label="Pending approvals"
            values={
              lastApprovalSummary?.pendingApprovals.length
                ? lastApprovalSummary.pendingApprovals.map(
                    (item) => item.toolName
                  )
                : ["No pending approval metadata yet"]
            }
          />
          <OpenAiAgentsSdkDemoBadgeList
            label="Decisions"
            values={
              lastApprovalSummary?.decisions.length
                ? lastApprovalSummary.decisions.map((item) =>
                    item.approved ? "approved" : "rejected"
                  )
                : ["No approval decisions yet"]
            }
          />
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoResultsPanel({
  lastResultSummary,
}: {
  lastResultSummary: OpenAiAgentsSdkDemoRuntimeInspector["lastResultSummary"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Results
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <InspectorRow
          label="Active agent"
          value={lastResultSummary?.activeAgentName ?? "No settled result yet"}
        />
        <InspectorRow
          label="Last agent"
          value={lastResultSummary?.lastAgentName ?? "No settled result yet"}
        />
        <InspectorRow
          label="History"
          value={lastResultSummary?.historyLength ?? 0}
        />
        <InspectorRow
          label="Output items"
          value={lastResultSummary?.outputCount ?? 0}
        />
        <InspectorRow
          label="New items"
          value={lastResultSummary?.newItemsCount ?? 0}
        />
        <InspectorRow
          label="Raw responses"
          value={lastResultSummary?.rawResponseCount ?? 0}
        />
        <InspectorRow
          label="Interruptions"
          value={lastResultSummary?.interruptionCount ?? 0}
        />
        <InspectorRow
          label="Requests"
          value={lastResultSummary?.requestCount ?? 0}
        />
        <InspectorRow
          label="Tokens"
          value={lastResultSummary?.totalTokens ?? 0}
        />
        <InspectorRow
          label="Run state"
          value={
            lastResultSummary?.hasResumableState ? "available" : "not captured"
          }
        />
        <div className="space-y-2 pt-1">
          <div>
            <p className="text-muted-foreground text-xs">Final output</p>
            <p className="mt-1 text-xs/relaxed">
              {lastResultSummary?.finalOutputPreview ??
                "No settled result preview yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoToolsPanel({
  toolCatalog,
  usedToolNames,
}: {
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
  usedToolNames: Set<string>;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Tools
      </p>
      <div className="mt-2 space-y-2">
        {toolCatalog.map((item) => (
          <OpenAiAgentsSdkDemoCatalogCard
            availability={item.availability}
            key={item.name}
            name={item.name}
            notes={item.notes}
            sdkPrimitive={item.sdkPrimitive}
          >
            {usedToolNames.has(item.name) ? (
              <Badge
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                variant="outline"
              >
                Used this run
              </Badge>
            ) : null}
          </OpenAiAgentsSdkDemoCatalogCard>
        ))}
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoGuideCoveragePanel({
  guideCoverageWithCurrentRun,
}: {
  guideCoverageWithCurrentRun: OpenAiAgentsSdkDemoRuntimeInspector["guideCoverageWithCurrentRun"];
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Guide Coverage
      </p>
      <div className="mt-2 space-y-2">
        {guideCoverageWithCurrentRun.map((item) => (
          <div
            className="space-y-2 border border-foreground/10 px-3 py-2"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-all font-medium text-sm">{item.label}</p>
                <p className="break-words text-muted-foreground text-xs">
                  {item.sdkPrimitive}
                </p>
              </div>
              <Badge
                className={cn(
                  "shrink-0",
                  getStatusClassName(item.implementationStatus)
                )}
                variant="outline"
              >
                {getImplementationLabel(item.implementationStatus)}
              </Badge>
            </div>
            <div className="space-y-1 text-muted-foreground text-xs">
              <p>{item.observable}</p>
              <a
                className="block break-all text-foreground underline-offset-4 hover:underline"
                href={item.sourceGuide}
                rel="noreferrer"
                target="_blank"
              >
                {item.sourceGuide}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(getStatusClassName(item.currentRunStatus))}
                variant="outline"
              >
                Run: {getRunStatusLabel(item.currentRunStatus)}
              </Badge>
              <Badge variant="outline">
                Provider: {item.providerCapabilityStatus}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoCatalogCard({
  availability,
  children,
  name,
  notes,
  sdkPrimitive,
}: {
  availability: OpenAiAgentsSdkDemoToolCatalogEntry["availability"];
  children: ReactNode;
  name: string;
  notes: string;
  sdkPrimitive: string;
}) {
  return (
    <div className="space-y-2 border border-foreground/10 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all font-medium text-sm">{name}</p>
          <p className="break-words text-muted-foreground text-xs">
            {sdkPrimitive}
          </p>
        </div>
        <Badge
          className={cn(getToolAvailabilityClassName(availability))}
          variant="outline"
        >
          {availability}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">{notes}</p>
      {children}
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
        {values.map((value, index) => (
          <Badge key={`${value}-${index}`} variant="outline">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}
