import { describe, expect, it } from "vitest";

import registryManifest from "../../../../registry/registry-demos.json" with {
  type: "json",
};
import {
  registryGuideConfig,
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
      "pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat"
    );
    expect(registryGuideConfig.namespaceSetupCommand).toBe(
      "pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://agent-demos.hsawana9.com/r/{name}.json"
    );
    expect(registryGuideConfig.sourceLinks.githubRepo).toBe(
      "https://github.com/SawanaLabs/agent-demos"
    );
    expect(supportedRegistryDemoNotes.map((demo) => demo.slug)).toEqual(
      publicRegistryDemos
        .filter((demo) => !demo.mainline)
        .map((demo) => demo.slug)
    );
  });

  it("keeps unpublished work out of the public guide commands", () => {
    expect(supportedRegistryDemoNotes.map((demo) => demo.slug)).not.toContain(
      "skills-agent"
    );
    expect(
      supportedRegistryDemoNotes.every((demo) =>
        demo.command.startsWith(
          `pnpm dlx shadcn@latest add ${registryManifest.namespace}/`
        )
      )
    ).toBe(true);
  });
});
