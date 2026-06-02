import { describe, expect, it } from "vitest";
import {
  assertVercelSandboxIntegrationTestReady,
  createVercelSandboxIntegrationOptions,
  createVercelSandboxIntegrationSessionId,
} from "@/features/shared/vercel-sandbox/server/integration-test";
import { getSkillsAgentEnv } from "@/features/skills-agent/server/env";
import {
  createSkillsAgentSandbox,
  createSkillsAgentSessionRegistry,
  type SkillsAgentSandboxHandle,
} from "@/features/skills-agent/server/sandbox";
import {
  createUltraChatbotAgentSandboxToolbox,
  getUltraChatbotAgentSandboxSessionId,
} from "./sandbox-tools";

interface BashCommandResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

interface UltraSandboxBashTool {
  execute(input: { command: string }): Promise<BashCommandResult>;
}

function getExecutableBashTool(tools: Record<string, unknown>) {
  const bashTool = tools.bash as Partial<UltraSandboxBashTool> | undefined;

  if (!bashTool || typeof bashTool.execute !== "function") {
    throw new Error(
      "Ultra sandbox toolbox did not expose an executable bash tool."
    );
  }

  return bashTool as UltraSandboxBashTool;
}

function expectBashCommandToPass(result: BashCommandResult, command: string) {
  expect(
    result.exitCode,
    [result.stderr.trim(), result.stdout.trim(), command]
      .filter(Boolean)
      .join("\n")
  ).toBe(0);
}

describe("ultra chatbot agent Vercel Sandbox toolbox integration", () => {
  it("executes bash through the Ultra sandbox toolbox with uv-backed Python", async () => {
    const env = getSkillsAgentEnv();
    assertVercelSandboxIntegrationTestReady(env);

    const chatId = createVercelSandboxIntegrationSessionId("ultra-bash");
    const sessionId = getUltraChatbotAgentSandboxSessionId(chatId);
    const createdSandboxes: SkillsAgentSandboxHandle[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: async (sandboxSessionId) => {
        const sandbox = await createSkillsAgentSandbox(
          sandboxSessionId,
          env,
          createVercelSandboxIntegrationOptions({
            feature: "ultra-chatbot-agent",
            scenario: "bash-readiness",
          })
        );
        createdSandboxes.push(sandbox);
        return sandbox;
      },
    });

    try {
      const toolbox = await createUltraChatbotAgentSandboxToolbox(
        {
          chatId,
          env,
          visitorId: "integration-test-visitor",
        },
        {
          getSessionRegistry: () => registry,
        }
      );
      const bashTool = getExecutableBashTool(toolbox.tools);
      const command = [
        "uv run python -c",
        "'import pathlib, sys;",
        'print("ultra-sandbox-bash-ready");',
        'print(f"python={sys.version_info.major}.{sys.version_info.minor}");',
        'print(f"venv={pathlib.Path(sys.prefix).name}")',
        "'",
      ].join(" ");
      const result = await bashTool.execute({ command });

      expectBashCommandToPass(result, command);
      expect(result.stdout).toContain("ultra-sandbox-bash-ready");
      expect(result.stdout).toContain("python=3.13");
      expect(result.stdout).toContain("venv=.venv");
    } finally {
      await registry.stopSession(sessionId);
      await Promise.allSettled(
        createdSandboxes.map((sandbox) => sandbox.delete?.())
      );
    }
  });
});
