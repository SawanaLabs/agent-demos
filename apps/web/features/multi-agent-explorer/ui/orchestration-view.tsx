"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@workspace/ui/components/ai-elements/chain-of-thought";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@workspace/ui/components/ai-elements/plan";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@workspace/ui/components/ai-elements/task";
import { Badge } from "@workspace/ui/components/badge";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotDashedIcon,
  CompassIcon,
  FileTextIcon,
  ListChecksIcon,
  WaypointsIcon,
  XCircleIcon,
} from "lucide-react";

import type {
  ExplorerSnapshot,
  ExplorerStatus,
  ExplorerToolActivity,
  OrchestrationPhase,
  ResearchPlan,
} from "../types";

const phaseOrder: OrchestrationPhase[] = [
  "planning",
  "exploring",
  "synthesizing",
];

function phaseStepStatus(
  phase: OrchestrationPhase | undefined,
  step: OrchestrationPhase
) {
  if (!phase) {
    return "pending" as const;
  }
  if (phase === "done") {
    return "complete" as const;
  }

  const phaseIndex = phaseOrder.indexOf(phase);
  const stepIndex = phaseOrder.indexOf(step);

  if (stepIndex < phaseIndex) {
    return "complete" as const;
  }
  if (stepIndex === phaseIndex) {
    return "active" as const;
  }

  return "pending" as const;
}

export function OrchestrationPhaseSteps({
  detail,
  explorerCount,
  phase,
}: {
  detail?: string;
  explorerCount: number;
  phase?: OrchestrationPhase;
}) {
  return (
    <ChainOfThought defaultOpen>
      <ChainOfThoughtHeader>Multi-agent orchestration</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          icon={ListChecksIcon}
          label="Lead plans subtopics"
          status={phaseStepStatus(phase, "planning")}
        />
        <ChainOfThoughtStep
          description={
            explorerCount > 0
              ? `${explorerCount} explorer subagents run concurrently`
              : undefined
          }
          icon={WaypointsIcon}
          label="Fan out to explorer subagents"
          status={phaseStepStatus(phase, "exploring")}
        />
        <ChainOfThoughtStep
          icon={FileTextIcon}
          label="Lead synthesizes the report"
          status={phaseStepStatus(phase, "synthesizing")}
        />
        {detail && phase !== "done" ? (
          <p className="text-muted-foreground text-xs">{detail}</p>
        ) : null}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

export function ResearchPlanCard({ plan }: { plan: ResearchPlan }) {
  return (
    <Plan defaultOpen>
      <PlanHeader>
        <div>
          <PlanTitle>Research plan</PlanTitle>
          <PlanDescription>{plan.question}</PlanDescription>
        </div>
        <PlanAction>
          <PlanTrigger />
        </PlanAction>
      </PlanHeader>
      <PlanContent>
        <ol className="space-y-2">
          {plan.subtopics.map((subtopic, index) => (
            <li className="flex gap-2 text-sm" key={subtopic.title}>
              <span className="shrink-0 font-medium text-muted-foreground">
                {index + 1}.
              </span>
              <span>
                <span className="font-medium">{subtopic.title}</span>
                <span className="text-muted-foreground">
                  {" — "}
                  {subtopic.angle}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </PlanContent>
    </Plan>
  );
}

function ExplorerStatusBadge({ status }: { status: ExplorerStatus }) {
  if (status === "done") {
    return (
      <Badge className="gap-1" variant="outline">
        <CheckCircle2Icon className="size-3 text-primary" />
        Done
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge className="gap-1" variant="outline">
        <XCircleIcon className="size-3 text-destructive" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="outline">
      <CircleDotDashedIcon className="size-3 animate-spin text-muted-foreground" />
      Exploring
    </Badge>
  );
}

function readField(input: unknown, key: string) {
  if (typeof input !== "object" || input === null) {
    return;
  }

  const value = (input as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function describeActivityInput(activity: ExplorerToolActivity) {
  if (activity.toolName === "search_notes") {
    return `query: ${readField(activity.input, "query") ?? "…"}`;
  }
  if (activity.toolName === "read_note") {
    return `note: ${readField(activity.input, "noteId") ?? "…"}`;
  }

  return JSON.stringify(activity.input ?? {});
}

function describeActivityOutput(activity: ExplorerToolActivity) {
  if (activity.output === undefined) {
    return null;
  }
  if (activity.toolName === "search_notes") {
    const results = (activity.output as { results?: unknown[] } | undefined)
      ?.results;
    return `${Array.isArray(results) ? results.length : 0} matching notes`;
  }
  if (activity.toolName === "read_note") {
    const output = activity.output as { error?: string; title?: string };
    return output.error ?? output.title ?? "note loaded";
  }

  return "result received";
}

function ExplorerActivityItem({
  activity,
}: {
  activity: ExplorerToolActivity;
}) {
  return (
    <TaskItem>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge className="font-mono" variant="secondary">
          {activity.toolName}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {describeActivityInput(activity)}
        </span>
        {activity.status === "running" ? (
          <CircleDotDashedIcon className="size-3.5 animate-spin" />
        ) : null}
        {activity.status === "done" ? (
          <CheckCircle2Icon className="size-3.5 text-primary" />
        ) : null}
        {activity.status === "error" ? (
          <XCircleIcon className="size-3.5 text-destructive" />
        ) : null}
      </div>
      {describeActivityOutput(activity) ? (
        <p className="mt-1 text-muted-foreground text-xs">
          {describeActivityOutput(activity)}
        </p>
      ) : null}
    </TaskItem>
  );
}

export function ExplorerTaskCard({ explorer }: { explorer: ExplorerSnapshot }) {
  return (
    <Task defaultOpen={explorer.status === "running"}>
      <TaskTrigger title={explorer.subtopic}>
        <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
          <CompassIcon className="size-4 shrink-0" />
          <p className="min-w-0 flex-1 truncate text-left text-sm">
            <span className="font-medium text-foreground">
              {explorer.explorerId}
            </span>
            {" · "}
            {explorer.subtopic}
          </p>
          <ExplorerStatusBadge status={explorer.status} />
          <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </TaskTrigger>
      <TaskContent>
        <TaskItem>
          <span className="font-medium">Angle:</span> {explorer.angle}
        </TaskItem>
        {explorer.activities.map((activity) => (
          <ExplorerActivityItem activity={activity} key={activity.toolCallId} />
        ))}
        {explorer.error ? (
          <TaskItem className="text-destructive">
            Explorer failed: {explorer.error}
          </TaskItem>
        ) : null}
        {explorer.findings ? (
          <TaskItem>
            <p className="font-medium">Findings</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs/relaxed">
              {explorer.findings}
            </p>
          </TaskItem>
        ) : null}
      </TaskContent>
    </Task>
  );
}
