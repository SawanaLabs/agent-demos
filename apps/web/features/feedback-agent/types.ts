export const feedbackStatuses = [
  "received",
  "in_progress",
  "resolved",
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export interface FeedbackEvidence {
  context: Record<string, unknown>;
  description: string;
  recording?: string;
  screenshot?: string;
}

export interface Feedback extends FeedbackEvidence {
  analysis?: string;
  createdAt: string;
  id: string;
  status: FeedbackStatus;
}

export type FeedbackSummary = Pick<
  Feedback,
  "id" | "description" | "createdAt" | "status"
>;
