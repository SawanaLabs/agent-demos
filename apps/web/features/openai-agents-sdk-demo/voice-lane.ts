import { RealtimeAgent, tool } from "@openai/agents/realtime";
import { z } from "zod";

export interface OpenAiAgentsSdkDemoVoiceLaneProfile {
  approvalToolNames: string[];
  emittedSessionEvents: string[];
  handoffAgentNames: string[];
  recommendedSmokePrompts: string[];
  toolNames: string[];
  transportEscapeHatch: "session.transport.sendEvent()";
}

const buildResearchBriefInput = z.object({
  company: z.string().min(1),
  focus: z.string().min(1).optional(),
});

const publishResearchSummaryInput = z.object({
  audience: z.string().min(1),
  company: z.string().min(1),
  summary: z.string().min(1),
});

const openAiAgentsSdkDemoVoiceLaneProfile: OpenAiAgentsSdkDemoVoiceLaneProfile =
  {
    approvalToolNames: ["publish_research_summary"],
    emittedSessionEvents: [
      "history_updated",
      "transport_event",
      "agent_start",
      "agent_end",
      "agent_handoff",
      "agent_tool_start",
      "agent_tool_end",
      "tool_approval_requested",
      "guardrail_tripped",
      "mcp_tools_changed",
      "audio_start",
      "audio_stopped",
      "audio_interrupted",
      "error",
    ],
    handoffAgentNames: ["Voice Risk Reviewer"],
    recommendedSmokePrompts: [
      "为特斯拉生成一个简短的投研 brief。",
      "请挑战一下特斯拉多头观点，把任务交给风险 reviewer。",
      "给我一段准备对外发布的特斯拉研究摘要，并准备发布。",
    ],
    toolNames: ["build_research_brief", "publish_research_summary"],
    transportEscapeHatch: "session.transport.sendEvent()",
  };

function createBuildResearchBriefTool() {
  return tool({
    description:
      "Create a compact public-company research brief before deeper analysis.",
    execute: ({ company, focus }) => {
      const researchFocus = focus?.trim() || "overall business quality";

      return [
        `Company: ${company}`,
        `Focus: ${researchFocus}`,
        "Research brief:",
        "- Confirm the latest facts before citing them.",
        "- Separate business quality, financial performance, capital allocation, and key risks.",
        "- Call out what still needs deeper validation before a publishable conclusion.",
      ].join("\n");
    },
    name: "build_research_brief",
    parameters: buildResearchBriefInput,
  });
}

function createPublishResearchSummaryTool() {
  return tool({
    description:
      "Publish a finished research takeaway to an external audience after a human approval checkpoint.",
    execute: ({ audience, company, summary }) =>
      [
        `Audience: ${audience}`,
        `Company: ${company}`,
        "Status: approved and ready to share.",
        `Summary: ${summary}`,
      ].join("\n"),
    name: "publish_research_summary",
    needsApproval: true,
    parameters: publishResearchSummaryInput,
  });
}

export function getOpenAiAgentsSdkDemoVoiceLaneProfile() {
  return openAiAgentsSdkDemoVoiceLaneProfile;
}

export function createOpenAiAgentsSdkDemoVoiceAgentBundle() {
  const voiceRiskReviewer = new RealtimeAgent({
    instructions:
      "You are the bearish risk reviewer for this realtime research lane. Stress-test the thesis, surface weak evidence, and keep the answer concise.",
    name: "Voice Risk Reviewer",
  });

  const primaryAgent = new RealtimeAgent({
    handoffs: [voiceRiskReviewer],
    instructions:
      "You are the realtime voice lane for the OpenAI Agents SDK demo. Keep spoken responses concise, useful, and natural. Use build_research_brief for a compact public-company kickoff. When the user asks to publish or share a finished summary externally, call publish_research_summary so the human approval step is exercised. When the user explicitly asks for a skeptical review or risk challenge, hand off to Voice Risk Reviewer.",
    name: "Voice Analyst",
    tools: [createBuildResearchBriefTool(), createPublishResearchSummaryTool()],
  });

  return {
    handoffAgents: [voiceRiskReviewer],
    primaryAgent,
  };
}
