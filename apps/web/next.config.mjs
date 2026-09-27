import path from "node:path";
import { fileURLToPath } from "node:url";

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDirectory, "../..");
const workspaceSkillTraceIncludes = [
  "../../.agents/skills/grill-with-docs/**/*",
  "../../.agents/skills/skill-creator/SKILL.md",
  "../../.agents/skills/skill-creator/agents/**/*",
  "../../.agents/skills/skill-creator/assets/**/*",
  "../../.agents/skills/skill-creator/license.txt",
  "../../.agents/skills/skill-creator/references/**/*",
  "../../.agents/skills/skill-creator/scripts/*.py",
];
const sandboxWorkspaceRouteGlobs = [
  "/api/demos/skills-agent",
  "/api/demos/ultra-chatbot-agent",
  "/demos/skills-agent",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: Object.fromEntries(
    sandboxWorkspaceRouteGlobs.map((routeGlob) => [
      routeGlob,
      workspaceSkillTraceIncludes,
    ])
  ),
  outputFileTracingRoot: repoRoot,
  serverExternalPackages: ["bash-tool"],
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
