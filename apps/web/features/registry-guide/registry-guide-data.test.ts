import { describe, expect, it } from "vitest";

import registryManifest from "../../../../registry/registry-demos.json" with {
  type: "json",
};
import {
  recommendedAgentSkills,
  registryGuideAutopilotTaskBrief,
  registryGuideConfig,
  registryGuideGuidedTaskBrief,
  supportedRegistryDemoNotes,
} from "./registry-guide-data";

const publicRegistryDemos = registryManifest.demos.filter(
  (demo) => demo.publicRegistry
);
const mainlineRegistryDemo = publicRegistryDemos.find((demo) => demo.mainline);

describe("registry guide data", () => {
  it("exports public registry demos from the shared manifest", () => {
    expect(mainlineRegistryDemo?.slug).toBe("foundation-chat");
    expect(registryGuideConfig.foundationChatCommand).toBe(
      "pnpm dlx shadcn@latest add @agent-demos/foundation-chat"
    );
    expect(registryGuideConfig.namespaceSetupCommand).toBe(
      "pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json"
    );
    expect(registryGuideConfig.sourceLinks.githubRepo).toBe(
      "https://github.com/SawanaLabs/agent-demos"
    );
    expect(registryGuideConfig.sourceLinks.aiSdkProviders).toBe(
      "https://ai-sdk.dev/providers/ai-sdk-providers"
    );
    expect(registryGuideConfig.sourceLinks.vercelCliDeployDocs).toBe(
      "https://vercel.com/docs/cli/deploy"
    );
    expect(supportedRegistryDemoNotes.map((demo) => demo.slug)).toEqual(
      publicRegistryDemos
        .filter((demo) => !demo.mainline)
        .map((demo) => demo.slug)
    );
  });

  it("keeps unpublished work out of the public guide commands", () => {
    const supportedDemoSlugs = supportedRegistryDemoNotes.map(
      (demo) => demo.slug
    );

    for (const omittedReadyDemo of registryManifest.omittedReadyDemos) {
      expect(supportedDemoSlugs).not.toContain(omittedReadyDemo);
    }
    expect(
      supportedRegistryDemoNotes.every((demo) =>
        demo.command.startsWith(
          `pnpm dlx shadcn@latest add ${registryManifest.namespace}/`
        )
      )
    ).toBe(true);
  });

  it("keeps the two copyable task briefs explicit", () => {
    expect(registryGuideAutopilotTaskBrief).toContain("autopilot path");
    expect(registryGuideAutopilotTaskBrief).toContain(
      "recommended starter demo"
    );
    expect(registryGuideAutopilotTaskBrief).not.toContain("smoke");
    expect(registryGuideAutopilotTaskBrief).toContain(
      "A Vercel deployment has been triggered"
    );
    expect(registryGuideAutopilotTaskBrief).toContain(
      `<deployment-url>/demos/${mainlineRegistryDemo?.slug}`
    );

    expect(registryGuideGuidedTaskBrief).toContain("guided checkpoints path");
    expect(registryGuideGuidedTaskBrief).toContain("recommended starter demo");
    expect(registryGuideGuidedTaskBrief).not.toContain("smoke");
    expect(registryGuideGuidedTaskBrief).toContain(
      "Ask the user before each checkpoint"
    );
    expect(registryGuideGuidedTaskBrief).toContain("AI SDK Providers docs");
  });

  it("links recommended skills to their GitHub SKILL.md files", () => {
    expect(recommendedAgentSkills.map((skill) => skill.docsUrl)).toEqual([
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md",
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md",
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md",
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md",
      "https://github.com/multicul-silver-wolf/agent-docs-system-skill/blob/main/skills/project-docs-system/SKILL.md",
    ]);
    expect(
      recommendedAgentSkills.every((skill) =>
        skill.docsUrl.endsWith("/SKILL.md")
      )
    ).toBe(true);
  });
});
