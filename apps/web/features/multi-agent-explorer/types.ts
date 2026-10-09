import type { UIMessage } from "ai";
import { z } from "zod";

/**
 * Shared orchestration contract between the server stream and the client UI.
 *
 * The lead agent's lifecycle is carried by three custom data parts:
 * - `data-orchestration-phase`: which orchestration stage is active.
 * - `data-research-plan`: the subtopics the lead decomposed the question into.
 * - `data-explorer`: one updating snapshot per explorer subagent (keyed by id).
 */
export const orchestrationPhaseSchema = z.enum([
  "done",
  "exploring",
  "planning",
  "synthesizing",
]);

export const orchestrationStatusSchema = z.object({
  detail: z.string(),
  phase: orchestrationPhaseSchema,
});

export const researchPlanSubtopicSchema = z.object({
  angle: z.string(),
  title: z.string(),
});

export const researchPlanSchema = z.object({
  question: z.string(),
  subtopics: z.array(researchPlanSubtopicSchema).min(2).max(4),
});

export const explorerToolActivitySchema = z.object({
  input: z.unknown(),
  output: z.unknown().optional(),
  status: z.enum(["done", "error", "running"]),
  toolCallId: z.string(),
  toolName: z.string(),
});

export const explorerSnapshotSchema = z.object({
  activities: z.array(explorerToolActivitySchema),
  angle: z.string(),
  error: z.string().optional(),
  explorerId: z.string(),
  findings: z.string().optional(),
  status: z.enum(["done", "error", "running"]),
  subtopic: z.string(),
});

export type ExplorerSnapshot = z.infer<typeof explorerSnapshotSchema>;
export type ExplorerStatus = ExplorerSnapshot["status"];
export type ExplorerToolActivity = z.infer<typeof explorerToolActivitySchema>;
export type OrchestrationPhase = z.infer<typeof orchestrationPhaseSchema>;
export type OrchestrationStatus = z.infer<typeof orchestrationStatusSchema>;
export type ResearchPlan = z.infer<typeof researchPlanSchema>;
export type ResearchPlanSubtopic = z.infer<typeof researchPlanSubtopicSchema>;

export interface MultiAgentExplorerMessageMetadata {
  explorerCount?: number;
  finishedAt?: number;
  finishReason?: string;
  model?: string;
  runId?: string;
  startedAt?: number;
  totalUsage?: unknown;
}

export type MultiAgentExplorerUIMessage = UIMessage<
  MultiAgentExplorerMessageMetadata,
  {
    explorer: ExplorerSnapshot;
    "orchestration-phase": OrchestrationStatus;
    "research-plan": ResearchPlan;
  }
>;
