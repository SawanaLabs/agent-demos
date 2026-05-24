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

export interface SupportTriageApprovalRequest {
  action: "escalate";
  caseId: string;
  customerName: string;
  customerUpdate: string;
  internalHandoff: string;
  priority: "high";
  rationale: string[];
}

export interface SupportTriageApprovalResult
  extends SupportTriageApprovalRequest {
  approvalStatus: "approved";
  handoffChannel: "priority escalation";
  nextStep: string;
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
      {
        execution: "sequential",
        label: "Human approval checkpoint",
        tools: ["requestHumanApproval"],
      },
    ],
  };
}

export function buildSupportEscalationApprovalRequest(
  triage: SupportTriageResult = runSupportTriageLoop()
): SupportTriageApprovalRequest {
  if (
    triage.recommendation.action !== "escalate" ||
    triage.recommendation.priority !== "high"
  ) {
    throw new Error("Support escalation approval requires a high escalation.");
  }

  return {
    action: "escalate",
    caseId: triage.caseId,
    customerName: triage.customer.name,
    customerUpdate:
      "We are escalating your export timeout incident to priority support because the SLA window is at risk.",
    internalHandoff: `Route ${triage.ticket.id} to priority support with ${triage.risk.minutesRemaining} minutes remaining in the response SLA.`,
    priority: "high",
    rationale: triage.recommendation.rationale,
  };
}

export function recordSupportEscalationApproval(
  approvalRequest: SupportTriageApprovalRequest
): SupportTriageApprovalResult {
  return {
    ...approvalRequest,
    approvalStatus: "approved",
    handoffChannel: "priority escalation",
    nextStep:
      "Open the priority escalation, send the customer update, and attach the SLA risk summary.",
  };
}
