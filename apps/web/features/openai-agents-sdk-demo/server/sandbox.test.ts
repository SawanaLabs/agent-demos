import { afterEach, describe, expect, it } from "vitest";

import {
  clearOpenAiAgentsSdkDemoSandboxSessionStateStore,
  getOpenAiAgentsSdkDemoSandboxProfile,
  getOpenAiAgentsSdkDemoSandboxRunConfig,
  getOpenAiAgentsSdkDemoSandboxUsageMetadata,
  recordOpenAiAgentsSdkDemoSandboxSessionState,
} from "./sandbox";

describe("openai agents sdk demo sandbox", () => {
  afterEach(() => {
    clearOpenAiAgentsSdkDemoSandboxSessionStateStore();
  });

  it("returns the configured sandbox profile for the runtime inspector", () => {
    expect(getOpenAiAgentsSdkDemoSandboxProfile()).toEqual({
      agentModel: "openai/gpt-5.4-mini",
      clientBackend: "unix_local",
      defaultCapabilities: ["filesystem()", "shell()", "compaction()"],
      manifestRoot: "/workspace",
      mountedPaths: ["/workspace/docs", "/workspace/feature"],
      sdkPrimitives: [
        "SandboxAgent",
        "Manifest",
        "Capabilities.default()",
        "UnixLocalSandboxClient",
        "RunConfig.sandbox",
      ],
      sessionPersistence: "session-id -> process-local sessionState",
      workspaceSource: "localDir() -> temp workspace",
    });
  });

  it("persists sandbox session state by session id and reuses it in the next run config", () => {
    expect(
      getOpenAiAgentsSdkDemoSandboxRunConfig({
        sessionId: "session_demo_1",
      })
    ).toMatchObject({
      sandbox: {
        client: expect.objectContaining({
          backendId: "unix_local",
        }),
      },
    });

    recordOpenAiAgentsSdkDemoSandboxSessionState({
      sessionId: "session_demo_1",
      state: {
        toJSON: () => ({
          sandbox: {
            sessionState: {
              backendId: "unix_local",
              configuredExposedPorts: [],
              environment: {},
              manifest: {
                entries: {},
                root: "/workspace",
                version: 1,
              },
              version: 1,
              workspaceRootOwned: true,
              workspaceRootPath: "/tmp/openai-agents-sandbox-demo",
            },
          },
        }),
      },
    });

    expect(
      getOpenAiAgentsSdkDemoSandboxRunConfig({
        sessionId: "session_demo_1",
      })
    ).toMatchObject({
      sandbox: {
        client: expect.objectContaining({
          backendId: "unix_local",
        }),
        sessionState: expect.objectContaining({
          backendId: "unix_local",
          version: 1,
          workspaceRootPath: "/tmp/openai-agents-sandbox-demo",
        }),
      },
    });
  });

  it("extracts sandbox usage metadata from serialized RunState", () => {
    expect(
      getOpenAiAgentsSdkDemoSandboxUsageMetadata({
        sessionId: "session_demo_1",
        state: {
          toJSON: () => ({
            sandbox: {
              backendId: "unix_local",
              currentAgentName: "Sandbox Workspace Agent",
              sessionState: {
                manifest: {
                  entries: {
                    docs: {},
                    feature: {},
                  },
                  root: "/workspace",
                },
                workspaceReady: true,
              },
              sessionsByAgent: {
                sandbox_workspace_agent: {},
              },
            },
          }),
        },
      })
    ).toEqual({
      sandboxSummary: {
        backendId: "unix_local",
        currentAgentName: "Sandbox Workspace Agent",
        manifestRoot: "/workspace",
        mountedPaths: ["/workspace/docs", "/workspace/feature"],
        persistedSessionCount: 1,
        sessionId: "session_demo_1",
        workspaceReady: true,
      },
      usedGuideIds: ["sandbox-agents"],
    });
  });

  it("marks sandbox usage when the sandbox specialist ran as a tool without serialized sandbox state", () => {
    expect(
      getOpenAiAgentsSdkDemoSandboxUsageMetadata({
        newItems: [
          {
            rawItem: {
              name: "sandbox_workspace_agent",
            },
          },
        ] as Parameters<
          typeof getOpenAiAgentsSdkDemoSandboxUsageMetadata
        >[0]["newItems"],
        sessionId: "session_demo_2",
      })
    ).toEqual({
      sandboxSummary: {
        backendId: "unix_local",
        currentAgentName: "Sandbox Workspace Agent",
        manifestRoot: "/workspace",
        mountedPaths: ["/workspace/docs", "/workspace/feature"],
        persistedSessionCount: 0,
        sessionId: "session_demo_2",
        workspaceReady: true,
      },
      usedGuideIds: ["sandbox-agents"],
    });
  });
});
