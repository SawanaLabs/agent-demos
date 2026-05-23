import { describe, expect, it } from "vitest";

import {
  getSkillsAgentRuntimeState,
  handleSkillsAgentRequest,
} from "./runtime";
import type { SkillMetadata } from "./skill-catalog";

const missingSetupErrorPattern = /AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN/i;

const sampleSkills: SkillMetadata[] = [
  {
    description:
      "Challenge an idea until the project context is precise and durable.",
    name: "grill-with-docs",
    path: "/workspace/.agents/skills/grill-with-docs",
  },
  {
    description:
      "Create or update a reusable skill package from aligned context.",
    name: "skill-creator",
    path: "/workspace/.agents/skills/skill-creator",
  },
];

describe("skills agent runtime", () => {
  it("surfaces the primary skills and default model when setup is ready", async () => {
    const runtimeState = await getSkillsAgentRuntimeState(
      {
        AI_GATEWAY_API_KEY: "test-key",
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      },
      {
        discoverSkills: async () => sampleSkills,
      }
    );

    expect(runtimeState.chatModel).toBe("openai/gpt-5-mini");
    expect(runtimeState.availableSkills).toEqual([
      {
        description:
          "Challenge an idea until the project context is precise and durable.",
        name: "grill-with-docs",
      },
      {
        description:
          "Create or update a reusable skill package from aligned context.",
        name: "skill-creator",
      },
    ]);
    expect(runtimeState.statusLabel).toBe("Ready");
  });

  it("returns a setup error before attempting skills-agent work", async () => {
    const response = await handleSkillsAgentRequest(
      new Request("http://localhost/api/demos/skills-agent", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      {
        discoverSkills: async () => sampleSkills,
      }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingSetupErrorPattern),
    });
  });

  it("rejects invalid request bodies before streaming starts", async () => {
    const response = await handleSkillsAgentRequest(
      new Request("http://localhost/api/demos/skills-agent", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      },
      {
        discoverSkills: async () => sampleSkills,
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with an "id" string and a "messages" array.',
    });
  });

  it("passes valid requests and the discovered skills into the feature streamer", async () => {
    const response = await handleSkillsAgentRequest(
      new Request("http://localhost/api/demos/skills-agent", {
        body: JSON.stringify({
          id: "chat-123",
          messages: [
            {
              id: "m1",
              parts: [
                {
                  text: "Pressure test this idea and draft a context file.",
                  type: "text",
                },
              ],
              role: "user",
            },
          ],
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      },
      {
        discoverSkills: async () => sampleSkills,
        streamSkillsAgent: async (messages, options) =>
          Response.json({
            messageCount: messages.length,
            sessionId: options.sessionId,
            skillNames: options.skills.map((skill) => skill.name),
          }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messageCount: 1,
      sessionId: "chat-123",
      skillNames: ["grill-with-docs", "skill-creator"],
    });
  });

  it("rejects requests that omit the AI SDK chat id", async () => {
    const response = await handleSkillsAgentRequest(
      new Request("http://localhost/api/demos/skills-agent", {
        body: JSON.stringify({
          messages: [],
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      },
      {
        discoverSkills: async () => sampleSkills,
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with an "id" string and a "messages" array.',
    });
  });
});
