import { z } from "zod";

export const comparisonRatingSchema = z.enum([
  "weak",
  "mixed",
  "strong",
  "best",
]);

export const featureComparisonInputSchema = z.object({
  criteria: z
    .array(
      z.object({
        label: z.string().min(1).describe("Criterion name."),
        scores: z
          .array(
            z.object({
              option: z
                .string()
                .min(1)
                .describe("The option name this score refers to."),
              rating: comparisonRatingSchema.describe(
                "The relative score for this option on the criterion."
              ),
              summary: z
                .string()
                .min(1)
                .describe("Short, user-facing reason for the rating."),
            })
          )
          .min(1)
          .describe("Scores for the compared options."),
      })
    )
    .min(2)
    .max(6)
    .describe("Criteria used for the comparison matrix."),
  options: z
    .array(
      z.object({
        name: z.string().min(1).describe("Compared option name."),
        summary: z.string().min(1).describe("Short description of the option."),
      })
    )
    .min(2)
    .max(5)
    .describe("Options to compare."),
  subject: z.string().min(1).describe("What is being compared."),
  summary: z.string().min(1).describe("One-sentence comparison takeaway."),
});

export const featureComparisonOutputSchema =
  featureComparisonInputSchema.extend({
    kind: z.literal("feature-comparison"),
  });

export const planRecommendationInputSchema = z.object({
  alternatives: z
    .array(
      z.object({
        name: z.string().min(1).describe("Alternative option name."),
        tradeoff: z
          .string()
          .min(1)
          .describe("Main tradeoff versus the recommendation."),
      })
    )
    .min(1)
    .max(5)
    .describe("Credible alternatives considered."),
  decision: z
    .string()
    .min(1)
    .describe("The decision or choice the recommendation answers."),
  nextSteps: z
    .array(z.string().min(1))
    .min(1)
    .max(5)
    .describe("Concrete next actions for the user."),
  rationale: z
    .array(
      z.object({
        detail: z.string().min(1).describe("Reasoning detail."),
        label: z.string().min(1).describe("Reason label."),
      })
    )
    .min(1)
    .max(5)
    .describe("Reasons supporting the recommended option."),
  recommendedOption: z.object({
    name: z.string().min(1).describe("Recommended option name."),
    summary: z.string().min(1).describe("Why this option is recommended."),
  }),
  risks: z
    .array(
      z.object({
        mitigation: z
          .string()
          .min(1)
          .optional()
          .describe("How to reduce this risk."),
        risk: z.string().min(1).describe("Risk to watch."),
      })
    )
    .max(5)
    .describe("Risks or caveats for the recommendation."),
});

export const planRecommendationOutputSchema =
  planRecommendationInputSchema.extend({
    kind: z.literal("plan-recommendation"),
  });

export type FeatureComparisonInput = z.infer<
  typeof featureComparisonInputSchema
>;
export type FeatureComparisonOutput = z.infer<
  typeof featureComparisonOutputSchema
>;
export type PlanRecommendationInput = z.infer<
  typeof planRecommendationInputSchema
>;
export type PlanRecommendationOutput = z.infer<
  typeof planRecommendationOutputSchema
>;

export function createFeatureComparison(
  input: FeatureComparisonInput
): FeatureComparisonOutput {
  const parsedInput = featureComparisonInputSchema.parse(input);

  return {
    ...parsedInput,
    kind: "feature-comparison",
  };
}

export function createPlanRecommendation(
  input: PlanRecommendationInput
): PlanRecommendationOutput {
  const parsedInput = planRecommendationInputSchema.parse(input);

  return {
    ...parsedInput,
    kind: "plan-recommendation",
  };
}
