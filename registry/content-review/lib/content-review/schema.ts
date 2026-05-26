import { z } from "zod";

export const contentReviewDecisionSchema = z.enum([
  "approved",
  "needs_review",
  "blocked",
]);

export const contentReviewSeveritySchema = z.enum(["low", "medium", "high"]);

export const contentReviewAcceptedMediaTypes = [
  "application/pdf",
  "image/*",
] as const;

export const contentReviewAttachmentSchema = z.object({
  filename: z.string().min(1),
  mediaType: z.string().min(1),
  url: z.string().min(1),
});

export const contentReviewRequestSchema = z.object({
  attachments: z.array(contentReviewAttachmentSchema).default([]),
  prompt: z.string().default(""),
});

export const contentReviewResultSchema = z.object({
  decision: contentReviewDecisionSchema,
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  categories: z.array(
    z.object({
      label: z.string(),
      rationale: z.string(),
      severity: contentReviewSeveritySchema,
    })
  ),
  findings: z.array(
    z.object({
      details: z.string(),
      policyLabel: z.string(),
      severity: contentReviewSeveritySchema,
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

export type ContentReviewAttachment = z.infer<
  typeof contentReviewAttachmentSchema
>;
export type ContentReviewRequest = z.infer<typeof contentReviewRequestSchema>;
export type ContentReviewResult = z.infer<typeof contentReviewResultSchema>;
