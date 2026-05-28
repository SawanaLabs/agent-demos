import { type ToolSet, tool } from "ai";
import { createBashTool } from "bash-tool";
import { z } from "zod";

import type { SandboxAgentSession } from "./session";
import { SANDBOX_AGENT_PREVIEW_PORT, SANDBOX_PROJECT_ROOT } from "./session";

const SANDBOX_AGENT_TOOL_PROMPT = [
  "Use bash to scaffold and edit a small static prototype inside the sandbox workspace.",
  "Use readFile and writeFile for direct file access.",
  "After writing a previewable HTML, CSS, and JavaScript prototype, call startPreview to expose it through the sandbox preview URL.",
].join(" ");

export interface SandboxAgentToolset {
  tools: ToolSet;
}

function createSessionBackedSandbox(session: SandboxAgentSession) {
  return {
    executeCommand: async (command: string) => {
      const result = await session.runCommand(command);

      return {
        exitCode: result.exitCode,
        stderr: result.stderr,
        stdout: result.stdout,
      };
    },
    readFile: (targetPath: string) => session.readFile(targetPath),
    writeFiles: async (files: { content: string | Buffer; path: string }[]) => {
      for (const file of files) {
        await session.writeFile(
          file.path,
          typeof file.content === "string"
            ? file.content
            : file.content.toString("utf-8")
        );
      }
    },
  };
}

export async function createSandboxAgentToolset({
  projectRoot = SANDBOX_PROJECT_ROOT,
  session,
}: {
  projectRoot?: string;
  session: SandboxAgentSession;
}): Promise<SandboxAgentToolset> {
  const bashToolkit = await createBashTool({
    destination: projectRoot,
    promptOptions: {
      toolPrompt: SANDBOX_AGENT_TOOL_PROMPT,
    },
    sandbox: createSessionBackedSandbox(session),
  });

  return {
    tools: {
      ...bashToolkit.tools,
      startPreview: tool({
        description:
          "Expose a static HTML, CSS, and JavaScript prototype through the sandbox preview URL.",
        execute: ({ directory, entryPath, port }) =>
          session.startPreview({
            directory,
            entryPath,
            port,
          }),
        inputSchema: z.object({
          directory: z
            .string()
            .default(".")
            .describe(
              "Directory to serve, relative to the sandbox project root."
            ),
          entryPath: z
            .string()
            .default("/index.html")
            .describe("Preview path to open after the server starts."),
          port: z
            .number()
            .int()
            .min(SANDBOX_AGENT_PREVIEW_PORT)
            .max(SANDBOX_AGENT_PREVIEW_PORT)
            .default(SANDBOX_AGENT_PREVIEW_PORT)
            .describe("Sandbox preview port. Use the default preview port."),
        }),
      }),
    },
  };
}
