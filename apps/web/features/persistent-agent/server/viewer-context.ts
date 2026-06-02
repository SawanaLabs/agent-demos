import { createVisitorOwner } from "@/features/shared/visitor-owner/server/route-owner";

export const persistentAgentVisitorCookieName = "pa_visitor_id";
const persistentAgentVisitorOwner = createVisitorOwner({
  cookieName: persistentAgentVisitorCookieName,
  maxAgeSeconds: 60 * 60 * 24 * 30,
});

export const handlePersistentAgentVisitorRequest =
  persistentAgentVisitorOwner.handleOwnedRequest;
