const promptTemplates = [
  "Triage {caseId} and explain the tool sequence.",
  "Triage {caseId} and show which lookups ran in parallel before the SLA decision.",
  "Triage {caseId}, request human approval before escalation, then finalize.",
];

export function getLoopAgentSamplePrompts(
  caseId: string,
  translate: (source: string) => string
) {
  return promptTemplates.map((template) => ({
    prompt: template.replace("{caseId}", caseId),
    label: translate(template).replace("{caseId}", caseId),
  }));
}
