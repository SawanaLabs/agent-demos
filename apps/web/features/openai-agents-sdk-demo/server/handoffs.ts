import { Agent, handoff, type RunItem } from "@openai/agents";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import {
  promptWithHandoffInstructions,
  removeAllTools,
} from "./handoff-extensions";
import type { OpenAiAgentsSdkDemoModelProfile } from "./models";

export type OpenAiAgentsSdkDemoHandoffAvailability =
  | "configured"
  | "setup-required";

export type OpenAiAgentsSdkDemoHandoffKind = "agent" | "handoff";

export interface OpenAiAgentsSdkDemoHandoffCatalogEntry {
  availability: OpenAiAgentsSdkDemoHandoffAvailability;
  kind: OpenAiAgentsSdkDemoHandoffKind;
  name: string;
  notes: string;
  sdkPrimitive: string;
}

interface OpenAiAgentsSdkDemoHandoffCatalogOptions {
  isChatAvailable: boolean;
}

interface OpenAiAgentsSdkDemoHandoffOptions {
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}

const researchLeadHandoffInput = z.object({
  reason: z.string().min(1),
});

function createMarketContextAgent({
  modelProfile,
}: OpenAiAgentsSdkDemoHandoffOptions) {
  return new Agent({
    handoffDescription:
      "Use this specialist when the user needs direct market context, company history, or competitive framing.",
    instructions: promptWithHandoffInstructions(
      "You take over the conversation when the user needs market context, business history, or competitor framing for a public-company research task. Keep the answer concise, evidence-first, and scoped to the live request."
    ),
    model: modelProfile.model,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    name: "Market Context Agent",
  });
}

function createResearchLeadAgent({
  modelProfile,
}: OpenAiAgentsSdkDemoHandoffOptions) {
  return new Agent({
    instructions: promptWithHandoffInstructions(
      "You take over the conversation when the user wants a direct long-form research synthesis or a next-step research plan. Keep the answer structured, cite live evidence where needed, and close with the most decision-relevant open questions."
    ),
    model: modelProfile.model,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    name: "Research Lead Agent",
  });
}

export function createOpenAiAgentsSdkDemoHandoffs({
  modelProfile,
}: OpenAiAgentsSdkDemoHandoffOptions) {
  const marketContextAgent = createMarketContextAgent({
    modelProfile,
  });
  const researchLeadAgent = createResearchLeadAgent({
    modelProfile,
  });

  return [
    marketContextAgent,
    handoff(researchLeadAgent, {
      inputFilter: removeAllTools,
      inputType: researchLeadHandoffInput,
      onHandoff(_context, input) {
        void input;
      },
      toolDescriptionOverride:
        "Transfer to the research lead when the specialist should answer directly with a research synthesis or next-step plan.",
      toolNameOverride: "transfer_to_research_lead",
    }),
  ];
}

export function getOpenAiAgentsSdkDemoHandoffCatalog({
  isChatAvailable,
}: OpenAiAgentsSdkDemoHandoffCatalogOptions): OpenAiAgentsSdkDemoHandoffCatalogEntry[] {
  const availability: OpenAiAgentsSdkDemoHandoffAvailability = isChatAvailable
    ? "configured"
    : "setup-required";

  return [
    {
      availability,
      kind: "agent",
      name: "Market Context Agent",
      notes:
        "Direct specialist agent passed in the handoffs array, using the agent.handoffDescription path from the official guide.",
      sdkPrimitive: "handoffs: [agent]",
    },
    {
      availability,
      kind: "handoff",
      name: "Research Lead handoff",
      notes:
        "Explicit handoff() object with inputType, onHandoff, and removeAllTools inputFilter, following the official guide examples.",
      sdkPrimitive: "handoff()",
    },
  ];
}

function getHandoffTargetName(rawItem: {
  agent?: { name?: string };
  type?: string;
}) {
  if (rawItem.type !== "handoff_call_item") {
    return null;
  }

  return rawItem.agent?.name ?? null;
}

function getHandoffTransition(rawItem: {
  sourceAgent?: { name?: string };
  targetAgent?: { name?: string };
  type?: string;
}) {
  if (rawItem.type !== "handoff_output_item") {
    return null;
  }

  if (!rawItem.sourceAgent?.name || !rawItem.targetAgent?.name) {
    return null;
  }

  return `${rawItem.sourceAgent.name} -> ${rawItem.targetAgent.name}`;
}

export function getOpenAiAgentsSdkDemoHandoffUsageMetadata({
  activeAgentName,
  newItems,
}: {
  activeAgentName?: string;
  newItems: RunItem[];
}): OpenAiAgentsSdkDemoMessageMetadata | undefined {
  const handoffTargetNames = Array.from(
    new Set(
      newItems
        .map((item) =>
          getHandoffTargetName((item.rawItem ?? {}) as { agent?: { name?: string }; type?: string })
        )
        .filter((value): value is string => Boolean(value))
    )
  );
  const handoffTransitions = Array.from(
    new Set(
      newItems
        .map((item) =>
          getHandoffTransition(
            (item.rawItem ?? {}) as {
              sourceAgent?: { name?: string };
              targetAgent?: { name?: string };
              type?: string;
            }
          )
        )
        .filter((value): value is string => Boolean(value))
    )
  );

  if (handoffTargetNames.length === 0 && handoffTransitions.length === 0) {
    return undefined;
  }

  return {
    handoffSummary: {
      ...(activeAgentName ? { activeAgentName } : {}),
      handoffTargetNames,
      handoffTransitions,
    },
    usedGuideIds: ["handoffs"],
  };
}
