import { describe, expect, it } from "vitest";

import {
  buildSupportEscalationApprovalRequest,
  recordSupportEscalationApproval,
  runSupportTriageLoop,
} from "./support-triage";

describe("support triage loop", () => {
  it("builds a triage plan with a human approval checkpoint", () => {
    expect(runSupportTriageLoop()).toMatchObject({
      caseId: "CASE-1842",
      customer: {
        name: "Northstar Analytics",
        plan: "Enterprise",
      },
      recommendation: {
        action: "escalate",
        priority: "high",
      },
      toolBatches: [
        {
          execution: "parallel",
          tools: [
            "getCustomerProfile",
            "listRecentTickets",
            "checkEntitlement",
          ],
        },
        {
          execution: "sequential",
          tools: ["calculateSlaRisk"],
        },
        {
          execution: "sequential",
          tools: ["requestHumanApproval"],
        },
      ],
    });
  });

  it("summarizes the customer risk signals behind the recommendation", () => {
    expect(runSupportTriageLoop()).toMatchObject({
      risk: {
        level: "high",
        minutesRemaining: 18,
      },
      ticket: {
        severity: "urgent",
        title: "Production dashboard exports are timing out",
      },
    });
  });

  it("builds a reviewer-facing escalation approval request", () => {
    expect(buildSupportEscalationApprovalRequest()).toMatchObject({
      action: "escalate",
      caseId: "CASE-1842",
      customerName: "Northstar Analytics",
      priority: "high",
      customerUpdate:
        "We are escalating your export timeout incident to priority support because the SLA window is at risk.",
      internalHandoff:
        "Route TIC-7789 to priority support with 18 minutes remaining in the response SLA.",
      rationale: [
        "Enterprise customer has an active entitlement.",
        "The active ticket is close to the response SLA.",
      ],
    });
  });

  it("records the approved escalation handoff", () => {
    const approvalRequest = buildSupportEscalationApprovalRequest();

    expect(recordSupportEscalationApproval(approvalRequest)).toMatchObject({
      action: "escalate",
      approvalStatus: "approved",
      caseId: "CASE-1842",
      handoffChannel: "priority escalation",
      nextStep:
        "Open the priority escalation, send the customer update, and attach the SLA risk summary.",
    });
  });
});
