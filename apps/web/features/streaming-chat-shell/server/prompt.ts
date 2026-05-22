import type { StreamingAudience } from "./contract";

export function buildAudienceSystemPrompt(audience: StreamingAudience) {
  switch (audience) {
    case "buyers":
      return "You are a concise product explainer for technical buyers. Keep the answer business-legible and concrete.";
    case "support":
      return "You are a support-oriented assistant. Focus on action steps, constraints, and what to try next.";
    case "engineers":
    default:
      return "You are a concise engineering assistant. Keep answers direct, implementation-aware, and explicit about assumptions.";
  }
}
