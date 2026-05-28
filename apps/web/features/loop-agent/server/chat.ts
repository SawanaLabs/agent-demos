import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  createLoopAgentGateway,
  getLoopAgentEnv,
  type LoopAgentEnv,
} from "./env";
import {
  LOOP_AGENT_PROVIDER_OPTIONS,
  resolveLoopAgentChatModel,
} from "./model";
import {
  buildSupportEscalationApprovalRequest,
  recordSupportEscalationApproval,
  runSupportTriageLoop,
} from "./support-triage";

const loopAgentInstructions = [
  "You are the loop-agent demo for a support operations team.",
  "Triage support tickets by using tools before making a recommendation.",
  "For questions about the default case, tool sequence, parallel lookups, SLA decision, approval flow, or next support action, use the tools before answering.",
  "Do not answer those workflow questions from the instructions alone.",
  "Start by gathering independent account context, recent tickets, and entitlement information.",
  "Then calculate SLA risk before giving the final action, priority, and rationale.",
  "If the SLA recommendation is a high-priority escalation, call requestHumanApproval with the approvalRequest returned by calculateSlaRisk before the final answer.",
  "If approval is denied, do not retry the approval tool; explain that the escalation was not performed.",
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
          approvalRequest: buildSupportEscalationApprovalRequest(triage),
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
    requestHumanApproval: tool({
      description:
        "Request human approval before performing the recommended high-priority support escalation.",
      inputSchema: z.object({
        action: z.literal("escalate").describe("The approved action to take."),
        caseId: z.string().describe("The support case identifier."),
        customerName: z.string().describe("The customer name."),
        customerUpdate: z
          .string()
          .describe("The message the support team will send to the customer."),
        internalHandoff: z
          .string()
          .describe("The internal escalation handoff note."),
        priority: z.literal("high").describe("The escalation priority."),
        rationale: z
          .array(z.string())
          .min(1)
          .describe("The reasons the escalation needs human approval."),
      }),
      needsApproval: true,
      execute: (approvalRequest) =>
        recordSupportEscalationApproval(approvalRequest),
    }),
  };
}

export function streamLoopAgent(
  messages: UIMessage[],
  env: LoopAgentEnv = getLoopAgentEnv()
) {
  const gateway = createLoopAgentGateway(env);
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
