import {
  type InputGuardrail,
  type InputGuardrailResult,
  InputGuardrailTripwireTriggered,
  type OutputGuardrail,
  type OutputGuardrailResult,
  OutputGuardrailTripwireTriggered,
  type RunContext,
} from "@openai/agents";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import type { OpenAiAgentsSdkDemoContext } from "./context";

export type OpenAiAgentsSdkDemoGuardrailAvailability =
  | "configured"
  | "setup-required";

export type OpenAiAgentsSdkDemoGuardrailKind = "input" | "output";

export interface OpenAiAgentsSdkDemoGuardrailCatalogEntry {
  availability: OpenAiAgentsSdkDemoGuardrailAvailability;
  kind: OpenAiAgentsSdkDemoGuardrailKind;
  name: string;
  notes: string;
  sdkPrimitive: string;
}

interface OpenAiAgentsSdkDemoGuardrailCatalogOptions {
  isChatAvailable: boolean;
}

const promptScopeGuardrail: InputGuardrail = {
  execute: async ({ input, context }) => {
    const normalizedInput =
      typeof input === "string" ? input : JSON.stringify(input);
    const shouldBlock =
      /(ignore\s+previous\s+instructions|reveal\s+.*system\s+prompt|bypass\s+guardrail)/i.test(
        normalizedInput
      );
    const demoContext = (context as RunContext<OpenAiAgentsSdkDemoContext>)
      .context;

    return {
      outputInfo: {
        matchedPolicy: shouldBlock ? "prompt-injection-or-system-prompt" : null,
        researchMode: demoContext?.researchMode,
        sessionId: demoContext?.sessionId,
      },
      tripwireTriggered: shouldBlock,
    };
  },
  name: "prompt_scope_guardrail",
  runInParallel: false,
};

const investmentAdviceGuardrail: OutputGuardrail = {
  execute: async ({ agentOutput, context }) => {
    const normalizedOutput =
      typeof agentOutput === "string"
        ? agentOutput
        : JSON.stringify(agentOutput);
    const shouldBlock =
      /(buy recommendation|sell recommendation|strong buy|strong sell|强烈买入|强烈卖出|买入建议|卖出建议|推荐买入|推荐卖出)/i.test(
        normalizedOutput
      );
    const demoContext = (context as RunContext<OpenAiAgentsSdkDemoContext>)
      .context;

    return {
      outputInfo: {
        matchedPolicy: shouldBlock ? "direct-investment-recommendation" : null,
        researchMode: demoContext?.researchMode,
        sessionId: demoContext?.sessionId,
      },
      tripwireTriggered: shouldBlock,
    };
  },
  name: "investment_advice_guardrail",
};

function isInputGuardrailTripwire(
  error: unknown
): error is InputGuardrailTripwireTriggered {
  return (
    error instanceof InputGuardrailTripwireTriggered ||
    (typeof error === "object" &&
      error !== null &&
      "result" in error &&
      "constructor" in error &&
      (error as { constructor?: { name?: string } }).constructor?.name ===
        "InputGuardrailTripwireTriggered")
  );
}

function isOutputGuardrailTripwire(
  error: unknown
): error is OutputGuardrailTripwireTriggered<any, any> {
  return (
    error instanceof OutputGuardrailTripwireTriggered ||
    (typeof error === "object" &&
      error !== null &&
      "result" in error &&
      "constructor" in error &&
      (error as { constructor?: { name?: string } }).constructor?.name ===
        "OutputGuardrailTripwireTriggered")
  );
}

export function getOpenAiAgentsSdkDemoGuardrails() {
  return {
    inputGuardrails: [promptScopeGuardrail],
    outputGuardrails: [investmentAdviceGuardrail],
  };
}

export function getOpenAiAgentsSdkDemoGuardrailCatalog({
  isChatAvailable,
}: OpenAiAgentsSdkDemoGuardrailCatalogOptions): OpenAiAgentsSdkDemoGuardrailCatalogEntry[] {
  const availability: OpenAiAgentsSdkDemoGuardrailAvailability = isChatAvailable
    ? "configured"
    : "setup-required";

  return [
    {
      availability,
      kind: "input",
      name: "prompt_scope_guardrail",
      notes:
        "Blocks direct prompt-injection or system-prompt extraction requests before the run proceeds.",
      sdkPrimitive: "defineInputGuardrail()",
    },
    {
      availability,
      kind: "output",
      name: "investment_advice_guardrail",
      notes:
        "Blocks direct buy or sell recommendation phrasing in the final agent output.",
      sdkPrimitive: "defineOutputGuardrail()",
    },
  ];
}

export function getOpenAiAgentsSdkDemoGuardrailUsageMetadata({
  inputGuardrailResults,
  outputGuardrailResults,
}: {
  inputGuardrailResults: InputGuardrailResult[];
  outputGuardrailResults: OutputGuardrailResult[];
}): OpenAiAgentsSdkDemoMessageMetadata | undefined {
  const usedGuardrailNames = Array.from(
    new Set([
      ...inputGuardrailResults.map((result) => result.guardrail.name),
      ...outputGuardrailResults.map((result) => result.guardrail.name),
    ])
  );

  if (usedGuardrailNames.length === 0) {
    return;
  }

  return {
    usedGuardrailNames,
    usedGuideIds: ["guardrails"],
  };
}

export function getOpenAiAgentsSdkDemoGuardrailErrorMessage(error: unknown) {
  if (isInputGuardrailTripwire(error)) {
    return `Input guardrail "${error.result.guardrail.name}" blocked the request. This demo rejects prompt-injection and system-prompt extraction attempts.`;
  }

  if (isOutputGuardrailTripwire(error)) {
    return `Output guardrail "${error.result.guardrail.name}" blocked the response. This demo can analyze evidence but will not emit direct buy or sell recommendations.`;
  }

  return null;
}
