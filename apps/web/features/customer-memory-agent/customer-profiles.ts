export interface CustomerMemoryProfile {
  accessMode: "shared_readonly" | "visitor_private";
  accountSummary: string;
  id: string;
  industry: string;
  name: string;
  operatingNotes: string[];
}

export const customerMemoryProfiles: CustomerMemoryProfile[] = [
  {
    accessMode: "visitor_private",
    accountSummary:
      "Growth-stage healthcare SaaS account with sensitive rollout language, recurring launch coordination, and room for hands-on support rehearsal.",
    id: "demo-sandbox",
    industry: "Healthcare SaaS (free to chat)",
    name: "Brightfield Health",
    operatingNotes: [
      "Use this account to test memory writes, thread persistence, and compaction end to end.",
      "Every browser keeps its own private threads and saved memories here.",
    ],
  },
  {
    accessMode: "shared_readonly",
    accountSummary:
      "Enterprise retail account with a strict brand-review process and a low tolerance for accidental over-promising.",
    id: "acme-co",
    industry: "Retail SaaS",
    name: "Acme Co",
    operatingNotes: [
      "Support needs status updates that executives can forward directly.",
      "Marketing claims usually need legal review before publication.",
    ],
  },
  {
    accessMode: "shared_readonly",
    accountSummary:
      "Developer tooling customer that values concise technical answers and durable action tracking.",
    id: "helio-dev",
    industry: "Developer Tools",
    name: "Helio Dev",
    operatingNotes: [
      "They prefer root-cause detail over polished status language.",
      "Follow-up promises should always include a concrete date.",
    ],
  },
  {
    accessMode: "shared_readonly",
    accountSummary:
      "Logistics platform account with complex escalation paths across operations and finance teams.",
    id: "northstar-logistics",
    industry: "Logistics",
    name: "Northstar Logistics",
    operatingNotes: [
      "Incident updates need a clear owner and next checkpoint.",
      "Downtime language should be conservative until root cause is confirmed.",
    ],
  },
];

export function getCustomerMemoryProfile(customerId: string) {
  return customerMemoryProfiles.find((profile) => profile.id === customerId) ?? null;
}

export function getVisitorPrivateCustomerMemoryProfileIds() {
  return customerMemoryProfiles
    .filter((profile) => profile.accessMode === "visitor_private")
    .map((profile) => profile.id);
}
