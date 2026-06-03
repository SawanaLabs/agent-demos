import { type ToolSet, tool } from "ai";
import { z } from "zod";

import type { SandboxAgentSession } from "./session";
import { SANDBOX_AGENT_PREVIEW_PORT, SANDBOX_PROJECT_ROOT } from "./session";

export interface SandboxAgentToolset {
  tools: ToolSet;
}

export async function createSandboxAgentToolset({
  projectRoot = SANDBOX_PROJECT_ROOT,
  session,
}: {
  projectRoot?: string;
  session: SandboxAgentSession;
}): Promise<SandboxAgentToolset> {
  return {
    tools: {
      bash: tool({
        description: `Run a shell command inside the sandbox workspace at ${projectRoot}.`,
        execute: ({ command }) => session.runCommand(command),
        inputSchema: z.object({
          command: z
            .string()
            .min(1)
            .describe("Shell command to run from the sandbox project root."),
        }),
      }),
      readFile: tool({
        description: "Read a UTF-8 file from the sandbox workspace.",
        execute: async ({ path }) => ({
          content: await session.readFile(path),
          path,
        }),
        inputSchema: z.object({
          path: z
            .string()
            .min(1)
            .describe(
              "File path to read, relative to the sandbox project root unless absolute."
            ),
        }),
      }),
      writeFile: tool({
        description: "Write a UTF-8 file into the sandbox workspace.",
        execute: ({ content, path }) => session.writeFile(path, content),
        inputSchema: z.object({
          content: z.string().describe("UTF-8 file content to write."),
          path: z
            .string()
            .min(1)
            .describe(
              "File path to write, relative to the sandbox project root unless absolute."
            ),
        }),
      }),
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
