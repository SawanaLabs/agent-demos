import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";

import {
  LOOP_AGENT_PROVIDER_OPTIONS,
  resolveLoopAgentChatModel,
} from "./model";
import { runSupportTriageLoop } from "./support-triage";

type DemoEnv = Record<string, string | undefined>;

const loopAgentInstructions = [
  "You are the loop-agent demo for a support operations team.",
  "Triage support tickets by using tools before making a recommendation.",
  "Start by gathering independent account context, recent tickets, and entitlement information.",
  "Then calculate SLA risk before giving the final action, priority, and rationale.",
  "Keep the final answer concise and make the tool sequence easy for an engineer to inspect.",
].join(" ");

function createSupportTriageTools() {
  return {
    calculateSlaRisk: tool({
      description:
        "Calculate the SLA risk and recommendation for the active support case after account context is known.",
      inputSchema: z.object({
        caseId: z.string().describe("The support case identifier to triage."),
      }),
      execute: () => {
        const triage = runSupportTriageLoop();

        return {
          recommendation: triage.recommendation,
          risk: triage.risk,
        };
      },
    }),
    checkEntitlement: tool({
      description:
        "Check whether the customer is entitled to priority support and escalation.",
      inputSchema: z.object({
        customerId: z
          .string()
          .describe("The customer identifier from the support ticket."),
      }),
      execute: () => {
        const triage = runSupportTriageLoop();

        return {
          plan: triage.customer.plan,
          prioritySupport: triage.customer.plan === "Enterprise",
          supportChannels: ["chat", "email", "priority escalation"],
        };
      },
    }),
    getCustomerProfile: tool({
      description:
        "Fetch the customer profile, plan, and account context for a support ticket.",
      inputSchema: z.object({
        customerId: z
          .string()
          .describe("The customer identifier from the support ticket."),
      }),
      execute: () => {
        const triage = runSupportTriageLoop();

        return triage.customer;
      },
    }),
    listRecentTickets: tool({
      description:
        "List recent support tickets so the agent can detect repeated incidents.",
      inputSchema: z.object({
        customerId: z
          .string()
          .describe("The customer identifier from the support ticket."),
      }),
      execute: () => {
        const triage = runSupportTriageLoop();

        return {
          activeTicket: triage.ticket,
          recentTickets: [
            {
              id: "TIC-7712",
              status: "resolved",
              title: "Scheduled export job exceeded retry budget",
            },
          ],
        };
      },
    }),
  };
}

export function streamLoopAgent(
  messages: UIMessage[],
  env: DemoEnv = process.env
) {
  const gateway = createAiGateway(env);
  const chatModel = resolveLoopAgentChatModel(env);
  const agent = new ToolLoopAgent({
    instructions: loopAgentInstructions,
    model: gateway(chatModel),
    providerOptions: LOOP_AGENT_PROVIDER_OPTIONS,
    stopWhen: stepCountIs(6),
    tools: createSupportTriageTools(),
  });

  return createAgentUIStreamResponse({
    agent,
    sendReasoning: true,
    uiMessages: messages,
  });
}
