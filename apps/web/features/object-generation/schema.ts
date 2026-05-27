import { z } from "zod";

export const objectGenerationDecisionSchema = z.enum([
  "approved",
  "needs_review",
  "blocked",
]);

export const objectGenerationSeveritySchema = z.enum(["low", "medium", "high"]);

export const objectGenerationAcceptedMediaTypes = [
  "application/pdf",
  "image/*",
] as const;

export const objectGenerationAttachmentSchema = z.object({
  filename: z.string().min(1),
  mediaType: z.string().min(1),
  url: z.string().min(1),
});

export const objectGenerationRequestSchema = z.object({
  attachments: z.array(objectGenerationAttachmentSchema).default([]),
  prompt: z.string().default(""),
});

export const objectGenerationResultSchema = z.object({
  decision: objectGenerationDecisionSchema,
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  categories: z.array(
    z.object({
      label: z.string(),
      rationale: z.string(),
      severity: objectGenerationSeveritySchema,
    })
  ),
  findings: z.array(
    z.object({
      details: z.string(),
      policyLabel: z.string(),
      severity: objectGenerationSeveritySchema,
      title: z.string(),
    })
  ),
  evidence: z.array(
    z.object({
      filename: z.string(),
      rationale: z.string(),
      sourceType: z.enum(["text", "image", "pdf"]),
      quote: z.string(),
    })
  ),
  recommendedAction: z.string(),
  openQuestions: z.array(z.string()),
});

export type ObjectGenerationAttachment = z.infer<
  typeof objectGenerationAttachmentSchema
>;
export type ObjectGenerationRequest = z.infer<typeof objectGenerationRequestSchema>;
export type ObjectGenerationResult = z.infer<typeof objectGenerationResultSchema>;
