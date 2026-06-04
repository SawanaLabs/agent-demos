import { createVisitorOwner } from "./route-owner";

export const ultraChatbotAgentVisitorCookieName = "ua_visitor_id";
const ultraChatbotAgentVisitorOwner = createVisitorOwner({
  cookieName: ultraChatbotAgentVisitorCookieName,
  maxAgeSeconds: 60 * 60 * 24 * 30,
});

export const handleUltraChatbotAgentVisitorRequest =
  ultraChatbotAgentVisitorOwner.handleOwnedRequest;
