import { tool } from "ai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { SANDBOX_AGENT_PREVIEW_PORT } from "./session";
import {
  createSandboxAgentWorkspace,
  formatSuggestedUseCases,
} from "./workspace";

describe("sandbox-agent workspace", () => {
  it("formats the suggested use cases for prompt injection", () => {
    expect(
      formatSuggestedUseCases([
        "Build a pricing landing page with an interactive calculator.",
        "Start a live preview after writing the files.",
      ])
    ).toContain(
      "- Build a pricing landing page with an interactive calculator."
    );
  });

  it("keeps the preview contract on the sandbox session seam", async () => {
    const startPreview = vi.fn().mockResolvedValue({
      directory: ".",
      entryPath: "/index.html",
      port: SANDBOX_AGENT_PREVIEW_PORT,
      url: "https://preview.example.dev/index.html",
    });
    const readFile = vi.fn();
    const session = {
      artifactsRoot: "/vercel/sandbox/project/artifacts",
      pathExists: vi.fn().mockResolvedValue(true),
      projectRoot: "/vercel/sandbox/project",
      readFile,
      runCommand: vi.fn(),
      sessionId: "chat-123",
      startPreview,
      stop: vi.fn(),
      writeFile: vi.fn(),
    };

    const workspace = await createSandboxAgentWorkspace(
      {
        sessionId: "chat-123",
      },
      {
        createToolset: async () => ({
          tools: {
            bash: tool({
              execute: vi.fn(),
              inputSchema: z.object({}),
            }),
          },
        }),
        getSession: () => session as never,
      }
    );

    const preview = await workspace.session.startPreview({
      directory: ".",
      entryPath: "/index.html",
      port: SANDBOX_AGENT_PREVIEW_PORT,
    });

    expect(workspace.session).toBe(session);
    expect(startPreview).toHaveBeenCalledWith({
      directory: ".",
      entryPath: "/index.html",
      port: SANDBOX_AGENT_PREVIEW_PORT,
    });
    expect(preview).toEqual({
      directory: ".",
      entryPath: "/index.html",
      port: SANDBOX_AGENT_PREVIEW_PORT,
      url: "https://preview.example.dev/index.html",
    });
  });
});
