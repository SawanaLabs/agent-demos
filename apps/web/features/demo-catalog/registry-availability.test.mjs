import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { customerMemoryAgentDemoMeta } from "../customer-memory-agent/demo-meta.ts";
import { foundationChatDemoMeta } from "../foundation-chat/demo-meta.ts";
import { langGraphAgentDemoMeta } from "../langgraph-agent/demo-meta.ts";
import { loopAgentDemoMeta } from "../loop-agent/demo-meta.ts";
import { mcpAgentDemoMeta } from "../mcp-agent/demo-meta.ts";
import { multimodalChatbotDemoMeta } from "../multimodal-chatbot/demo-meta.ts";
import { objectGenerationDemoMeta } from "../object-generation/demo-meta.ts";
import { openAiAgentsSdkDemoMeta } from "../openai-agents-sdk-demo/demo-meta.ts";
import { persistentAgentDemoMeta } from "../persistent-agent/demo-meta.ts";
import { ragChatbotDemoMeta } from "../rag-chatbot/demo-meta.ts";
import { sandboxAgentDemoMeta } from "../sandbox-agent/demo-meta.ts";
import { skillsAgentDemoMeta } from "../skills-agent/demo-meta.ts";
import { streamingChatShellDemoMeta } from "../streaming-chat-shell/demo-meta.ts";
import { traceEvalAgentDemoMeta } from "../trace-eval-agent/demo-meta.ts";
import { ultraChatbotAgentDemoMeta } from "../ultra-chatbot-agent/demo-meta.ts";
import { buildRegistryAvailability } from "./registry-availability.ts";

const missingReadyClassificationPattern =
  /Ready demo missing registry availability classification: missing-demo/;

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);
const currentRegistryManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "registry/registry-demos.json"), "utf8")
);
const currentDemoCatalogEntries = [
  foundationChatDemoMeta,
  ragChatbotDemoMeta,
  multimodalChatbotDemoMeta,
  objectGenerationDemoMeta,
  customerMemoryAgentDemoMeta,
  persistentAgentDemoMeta,
  streamingChatShellDemoMeta,
  loopAgentDemoMeta,
  langGraphAgentDemoMeta,
  skillsAgentDemoMeta,
  sandboxAgentDemoMeta,
  mcpAgentDemoMeta,
  openAiAgentsSdkDemoMeta,
  traceEvalAgentDemoMeta,
  ultraChatbotAgentDemoMeta,
];

test("current registry manifest classifies every ready catalog demo", () => {
  const availability = buildRegistryAvailability({
    demoCatalogEntries: currentDemoCatalogEntries,
    registryManifest: currentRegistryManifest,
  });

  assert.equal(availability.mainlineRegistryDemo.slug, "foundation-chat");
  assert.equal(availability.publicRegistryDemos.length, 15);
  assert.deepEqual(availability.privateRegistryDemos, []);
  assert.deepEqual(
    availability.omittedReadyDemos.map((demo) => demo.slug).sort(),
    []
  );
});

test("classifies every ready demo against the registry export contract", () => {
  const availability = buildRegistryAvailability({
    demoCatalogEntries: [
      {
        href: "/demos/foundation-chat",
        slug: "foundation-chat",
        status: "ready",
        title: "Foundation Chat",
      },
      {
        href: "/demos/skills-agent",
        slug: "skills-agent",
        status: "ready",
        title: "Skills Agent",
      },
      {
        href: "/demos/langgraph-agent",
        slug: "langgraph-agent",
        status: "ready",
        title: "LangGraph Agent",
      },
    ],
    registryManifest: {
      demos: [
        {
          mainline: true,
          publicRegistry: true,
          registryPath: "registry/foundation-chat/registry.json",
          setup: "AI Gateway only.",
          slug: "foundation-chat",
          title: "Foundation Chat",
        },
        {
          publicRegistry: false,
          registryPath: "registry/skills-agent/registry.json",
          setup: "Under construction.",
          slug: "skills-agent",
          title: "Skills Agent",
        },
      ],
      omittedReadyDemos: [
        {
          reason: "Requires a separate runtime service before registry export.",
          slug: "langgraph-agent",
        },
      ],
    },
  });

  assert.equal(availability.mainlineRegistryDemo.slug, "foundation-chat");
  assert.equal(availability.publicRegistryDemos.length, 1);
  assert.deepEqual(
    availability.privateRegistryDemos.map((demo) => demo.slug),
    ["skills-agent"]
  );
  assert.deepEqual(
    availability.omittedReadyDemos.map((demo) => demo.slug).sort(),
    ["langgraph-agent"]
  );
});

test("fails when a ready demo is neither exported nor explicitly omitted", () => {
  assert.throws(
    () =>
      buildRegistryAvailability({
        demoCatalogEntries: [
          {
            href: "/demos/foundation-chat",
            slug: "foundation-chat",
            status: "ready",
            title: "Foundation Chat",
          },
          {
            href: "/demos/missing-demo",
            slug: "missing-demo",
            status: "ready",
            title: "Missing Demo",
          },
        ],
        registryManifest: {
          demos: [
            {
              mainline: true,
              publicRegistry: true,
              registryPath: "registry/foundation-chat/registry.json",
              setup: "AI Gateway only.",
              slug: "foundation-chat",
              title: "Foundation Chat",
            },
          ],
          omittedReadyDemos: [],
        },
      }),
    missingReadyClassificationPattern
  );
});
