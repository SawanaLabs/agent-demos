export type SupportTriageAction = "escalate" | "monitor" | "reply";

export type SupportTriageExecution = "parallel" | "sequential";

export type SupportTriagePriority = "high" | "low" | "medium";

export interface SupportTriageCustomer {
  id: string;
  name: string;
  plan: string;
}

export interface SupportTriageRecommendation {
  action: SupportTriageAction;
  priority: SupportTriagePriority;
  rationale: string[];
}

export interface SupportTriageResult {
  caseId: string;
  customer: SupportTriageCustomer;
  recommendation: SupportTriageRecommendation;
  risk: SupportTriageRisk;
  ticket: SupportTriageTicket;
  toolBatches: SupportTriageToolBatch[];
}

export interface SupportTriageRisk {
  level: SupportTriagePriority;
  minutesRemaining: number;
  reason: string;
}

export interface SupportTriageTicket {
  id: string;
  severity: "normal" | "urgent";
  title: string;
}

export interface SupportTriageToolBatch {
  execution: SupportTriageExecution;
  label: string;
  tools: string[];
}

export function runSupportTriageLoop(): SupportTriageResult {
  return {
    caseId: "CASE-1842",
    customer: {
      id: "cus_northstar",
      name: "Northstar Analytics",
      plan: "Enterprise",
    },
    recommendation: {
      action: "escalate",
      priority: "high",
      rationale: [
        "Enterprise customer has an active entitlement.",
        "The active ticket is close to the response SLA.",
      ],
    },
    risk: {
      level: "high",
      minutesRemaining: 18,
      reason: "Urgent enterprise ticket is inside the 30 minute SLA window.",
    },
    ticket: {
      id: "TIC-7789",
      severity: "urgent",
      title: "Production dashboard exports are timing out",
    },
    toolBatches: [
      {
        execution: "parallel",
        label: "Independent account context",
        tools: ["getCustomerProfile", "listRecentTickets", "checkEntitlement"],
      },
      {
        execution: "sequential",
        label: "Dependent SLA decision",
        tools: ["calculateSlaRisk"],
      },
    ],
  };
}
