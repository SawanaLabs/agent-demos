import { handleSkillsAgentRequest } from "@/features/skills-agent/server/runtime";

export function POST(request: Request) {
  return handleSkillsAgentRequest(request);
}
