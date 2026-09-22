import { createVisitorOwner } from "@/features/shared/visitor-owner/server/route-owner";

export const feedbackOwner = createVisitorOwner({
  cookieName: "feedback-agent-owner",
  isValidVisitorId: (id) => /^[\da-f-]{36}$/.test(id),
  maxAgeSeconds: 60 * 60 * 24 * 7,
});
