import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoVoiceAgentBundle,
  getOpenAiAgentsSdkDemoVoiceLaneProfile,
} from "./voice-lane";

describe("openai agents sdk demo voice lane", () => {
  it("keeps the realtime voice lane on official tools, approvals, and handoffs", () => {
    const bundle = createOpenAiAgentsSdkDemoVoiceAgentBundle();

    expect(bundle.primaryAgent.name).toBe("Voice Analyst");
    expect(bundle.primaryAgent.tools.map((tool) => tool.name)).toEqual([
      "build_research_brief",
      "publish_research_summary",
    ]);
    expect(
      bundle.primaryAgent.handoffs.map((handoff) =>
        "name" in handoff ? handoff.name : handoff.agentName
      )
    ).toEqual(["Voice Risk Reviewer"]);
    expect(bundle.handoffAgents.map((agent) => agent.name)).toEqual([
      "Voice Risk Reviewer",
    ]);
  });

  it("records the visible realtime capability surface for docs and runtime inspector", () => {
    expect(getOpenAiAgentsSdkDemoVoiceLaneProfile()).toEqual({
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
    });
  });
});
