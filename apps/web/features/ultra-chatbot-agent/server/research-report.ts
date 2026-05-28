import { generateObject, tool } from "ai";
import { z } from "zod";

const researchReportInputSchema = z.object({
  audience: z.string().trim().min(1).optional(),
  evidence: z.string().trim().min(1).optional(),
  topic: z.string().trim().min(1),
});

const researchReportSourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
});

const researchReportSchema = z.object({
  executiveSummary: z.string().trim().min(1),
  keyFindings: z.array(z.string().trim().min(1)).min(1).max(6),
  recommendations: z.array(z.string().trim().min(1)).min(1).max(5),
  risks: z.array(z.string().trim().min(1)).max(5),
  sources: z.array(researchReportSourceSchema).max(8),
  title: z.string().trim().min(1),
  topic: z.string().trim().min(1),
});

function buildResearchReportPrompt(input: z.infer<typeof researchReportInputSchema>) {
  return [
    `Topic: ${input.topic}`,
    input.audience ? `Audience: ${input.audience}` : null,
    input.evidence ? `Evidence:\n${input.evidence}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function createUltraChatbotAgentResearchReportTool(input: {
  model: Parameters<typeof generateObject>[0]["model"];
}) {
  return tool({
    description:
      "Create a structured research report object from a topic and available evidence. Use this when the user asks for a research brief, comparison report, market scan, or decision memo that should render as a structured component.",
    inputSchema: researchReportInputSchema,
    execute: async (toolInput) => {
      const response = await generateObject({
        model: input.model,
        prompt: buildResearchReportPrompt(toolInput),
        schema: researchReportSchema,
        system: [
          "You create a structured research report for the Ultra Chatbot Agent.",
          "Keep findings concrete, decision-oriented, and grounded in the provided evidence.",
          "If the evidence includes URLs, preserve the most relevant sources in the sources array.",
          "If the topic requires current facts, the main agent should call web_search before this tool and pass the evidence here.",
        ].join(" "),
      });

      return {
        ...response.object,
        kind: "research-report" as const,
      };
    },
  });
}
