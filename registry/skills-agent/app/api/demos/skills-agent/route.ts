import { handleSkillsAgentRequest } from "@/lib/skills-agent/server/request";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleSkillsAgentRequest(request);
}
