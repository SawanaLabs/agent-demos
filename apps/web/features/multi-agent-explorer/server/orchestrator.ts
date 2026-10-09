import {
  generateObject,
  type LanguageModel,
  stepCountIs,
  streamText,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import { z } from "zod";

import type { ExplorerSnapshot, ResearchPlan } from "../types";
import { createExplorerTools } from "./tools";

const plannerSystemPrompt = [
  "You are the lead agent in a multi-agent research system.",
  "Decompose the user's research question into two to four focused subtopics that can be investigated independently.",
  "Each subtopic gets a short title and an angle that tells an explorer subagent exactly what evidence to gather.",
  "Keep subtopics disjoint: no two explorers should chase the same evidence.",
].join(" ");

const explorerSystemPrompt = [
  "You are an explorer subagent in a multi-agent research system.",
  "You investigate exactly one subtopic and report compact findings.",
  "Always call search_notes first to locate evidence, then read_note for the notes that matter.",
  "Ground every claim in the corpus notes and cite them inline as [note-id].",
  "Finish with three to six concise findings. Do not address the original question beyond your assigned subtopic.",
].join(" ");

const synthesisSystemPrompt = [
  "You are the lead agent in a multi-agent research system.",
  "Explorer subagents have already gathered evidence; your job is synthesis, not more retrieval.",
  "Write a compact report that answers the original question directly first.",
  "Then group evidence by subtopic with explorer attribution, flag contradictions between explorers, and close with open questions.",
  "Preserve the [note-id] citations the explorers produced so claims stay traceable.",
].join(" ");

export const plannedSubtopicsSchema = z.object({
  subtopics: z
    .array(
      z.object({
        angle: z
          .string()
          .min(1)
          .describe(
            "The specific angle or evidence the explorer should chase."
          ),
        title: z.string().min(1).describe("A short name for the subtopic."),
      })
    )
    .min(2)
    .max(4),
});

export interface ExplorerRunResult {
  angle: string;
  error?: string;
  explorerId: string;
  findings?: string;
  status: "done" | "error";
  subtopic: string;
}

export interface ExplorerRunState {
  error?: string;
  findings: string;
  snapshot: ExplorerSnapshot;
}

export interface PlanResearchTopicsInput {
  abortSignal?: AbortSignal;
  model: LanguageModel;
  question: string;
}

export interface RunExplorerSubagentInput {
  abortSignal?: AbortSignal;
  angle: string;
  emit: (snapshot: ExplorerSnapshot) => void;
  explorerId: string;
  model: LanguageModel;
  subtopic: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown explorer failure.";
}

export async function planResearchTopics({
  abortSignal,
  model,
  question,
}: PlanResearchTopicsInput): Promise<ResearchPlan> {
  const { object } = await generateObject({
    abortSignal,
    experimental_telemetry: {
      functionId: "multi-agent-explorer.plan",
      isEnabled: true,
      metadata: { demo: "multi-agent-explorer" },
    },
    maxOutputTokens: 800,
    model,
    prompt: `Research question: ${question}\n\nDecompose this into focused explorer subtopics.`,
    schema: plannedSubtopicsSchema,
    schemaDescription:
      "A fan-out research plan: independent subtopics for explorer subagents.",
    schemaName: "research_plan",
    system: plannerSystemPrompt,
  });

  return { question, subtopics: object.subtopics };
}

export function createExplorerRunState(input: {
  angle: string;
  explorerId: string;
  subtopic: string;
}): ExplorerRunState {
  return {
    findings: "",
    snapshot: {
      activities: [],
      angle: input.angle,
      explorerId: input.explorerId,
      status: "running",
      subtopic: input.subtopic,
    },
  };
}

/**
 * Folds one explorer stream part into the run state.
 * Returns true when the snapshot changed enough to re-emit to the client.
 */
export function applyExplorerStreamPart<TOOLS extends ToolSet>(
  state: ExplorerRunState,
  part: TextStreamPart<TOOLS>
): boolean {
  switch (part.type) {
    case "error": {
      state.error = getErrorMessage(part.error);
      state.snapshot.error = state.error;
      return true;
    }
    case "text-delta": {
      state.findings += part.text;
      return false;
    }
    case "tool-call": {
      state.snapshot.activities.push({
        input: part.input,
        status: "running",
        toolCallId: part.toolCallId,
        toolName: part.toolName,
      });
      return true;
    }
    case "tool-error":
    case "tool-output-denied": {
      const activity = state.snapshot.activities.find(
        (entry) => entry.toolCallId === part.toolCallId
      );

      if (activity) {
        activity.status = "error";
        return true;
      }

      return false;
    }
    case "tool-result": {
      const activity = state.snapshot.activities.find(
        (entry) => entry.toolCallId === part.toolCallId
      );

      if (activity) {
        activity.output = part.output;
        activity.status = "done";
        return true;
      }

      return false;
    }
    default: {
      return false;
    }
  }
}

function cloneSnapshot(snapshot: ExplorerSnapshot): ExplorerSnapshot {
  return structuredClone(snapshot);
}

export async function runExplorerSubagent({
  abortSignal,
  angle,
  emit,
  explorerId,
  model,
  subtopic,
}: RunExplorerSubagentInput): Promise<ExplorerRunResult> {
  const state = createExplorerRunState({ angle, explorerId, subtopic });
  emit(cloneSnapshot(state.snapshot));

  const result = streamText({
    abortSignal,
    experimental_telemetry: {
      functionId: "multi-agent-explorer.explore",
      isEnabled: true,
      metadata: {
        demo: "multi-agent-explorer",
        explorerId,
        subtopic,
      },
    },
    maxOutputTokens: 800,
    messages: [
      {
        content: `Subtopic: ${subtopic}\nInvestigation angle: ${angle}\n\nGather evidence with the corpus tools, then report findings.`,
        role: "user",
      },
    ],
    model,
    stopWhen: stepCountIs(4),
    system: explorerSystemPrompt,
    tools: createExplorerTools(),
  });

  try {
    for await (const part of result.fullStream) {
      if (applyExplorerStreamPart(state, part)) {
        emit(cloneSnapshot(state.snapshot));
      }
    }
  } catch (error) {
    state.error = getErrorMessage(error);
    state.snapshot.error = state.error;
  }

  state.snapshot.status = state.error ? "error" : "done";
  state.snapshot.findings =
    state.findings.trim() ||
    (state.error
      ? "Explorer stopped before producing findings."
      : "Explorer produced no findings.");
  emit(cloneSnapshot(state.snapshot));

  return {
    angle,
    error: state.error,
    explorerId,
    findings: state.snapshot.findings,
    status: state.error ? "error" : "done",
    subtopic,
  };
}

export function buildSynthesisPrompt(input: {
  question: string;
  runs: ExplorerRunResult[];
}) {
  const sections = input.runs.map((run) => {
    const outcome = run.error
      ? `Explorer failed: ${run.error}`
      : (run.findings ?? "Explorer produced no findings.");

    return `### Explorer ${run.explorerId} — ${run.subtopic}\nAngle: ${run.angle}\n${outcome}`;
  });

  return [
    `Original research question: ${input.question}`,
    "",
    "Explorer findings:",
    "",
    ...sections,
    "",
    "Synthesize these findings into the final report now.",
  ].join("\n");
}

export function getLeadSynthesisSystemPrompt() {
  return synthesisSystemPrompt;
}
