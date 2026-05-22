import { describe, expect, it } from "vitest";

import { runSupportTriageLoop } from "./support-triage";

describe("support triage loop", () => {
  it("builds a two-step triage plan for the default support ticket", () => {
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
});
