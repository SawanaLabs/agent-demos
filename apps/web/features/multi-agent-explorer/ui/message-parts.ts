import {
  type ExplorerSnapshot,
  explorerSnapshotSchema,
  type MultiAgentExplorerUIMessage,
  type OrchestrationStatus,
  orchestrationStatusSchema,
  type ResearchPlan,
  researchPlanSchema,
} from "../types";

export interface ProjectedMultiAgentExplorerMessage {
  explorerParts: ExplorerSnapshot[];
  hasReasoningSignal: boolean;
  orchestration?: OrchestrationStatus;
  plan?: ResearchPlan;
  reasoningText: string;
  text: string;
}

type MessagePart = MultiAgentExplorerUIMessage["parts"][number];

function getText(part: MessagePart) {
  return part.type === "text" && part.text.trim().length > 0
    ? part.text.trim()
    : null;
}

function getReasoningText(part: MessagePart) {
  return part.type === "reasoning" ? part.text.trim() : null;
}

function projectExplorerPart(part: MessagePart): ExplorerSnapshot | null {
  if (part.type !== "data-explorer") {
    return null;
  }

  const parsed = explorerSnapshotSchema.safeParse(part.data);

  return parsed.success ? parsed.data : null;
}

function projectOrchestrationPart(
  part: MessagePart
): OrchestrationStatus | null {
  if (part.type !== "data-orchestration-phase") {
    return null;
  }

  const parsed = orchestrationStatusSchema.safeParse(part.data);

  return parsed.success ? parsed.data : null;
}

function projectPlanPart(part: MessagePart): ResearchPlan | null {
  if (part.type !== "data-research-plan") {
    return null;
  }

  const parsed = researchPlanSchema.safeParse(part.data);

  return parsed.success ? parsed.data : null;
}

export function projectMultiAgentExplorerMessage(
  message: MultiAgentExplorerUIMessage
): ProjectedMultiAgentExplorerMessage {
  const textParts = message.parts.map(getText).filter((text) => text !== null);
  const reasoningParts = message.parts
    .map(getReasoningText)
    .filter((text) => text !== null);
  const explorerParts = message.parts
    .map(projectExplorerPart)
    .filter((part) => part !== null);
  const orchestrationPart = message.parts
    .map(projectOrchestrationPart)
    .filter((part) => part !== null)
    .at(-1);
  const planPart = message.parts
    .map(projectPlanPart)
    .find((part) => part !== null);

  return {
    explorerParts,
    hasReasoningSignal: reasoningParts.length > 0,
    orchestration: orchestrationPart,
    plan: planPart,
    reasoningText: reasoningParts.join("\n\n"),
    text: textParts.join("\n\n"),
  };
}
