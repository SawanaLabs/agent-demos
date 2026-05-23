import { describe, expect, it, vi } from "vitest";

import { launchDetachedSandboxPreview, waitForSandboxPreview } from "./session";

const previewFailurePattern =
  /HTTP 502 Bad Gateway.*Preview log: Error: listen EADDRINUSE/;

describe("waitForSandboxPreview", () => {
  it("returns once the preview URL becomes reachable", async () => {
    const runCommand = vi.fn();
    const fetchPreview = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("warming", {
          status: 502,
          statusText: "Bad Gateway",
        })
      )
      .mockResolvedValueOnce(
        new Response("<html>ok</html>", {
          status: 200,
          statusText: "OK",
        })
      );

    await waitForSandboxPreview({
      entryPath: "/index.html",
      fetchPreview,
      retries: 2,
      retryDelayMs: 0,
      session: {
        runCommand,
      },
      url: "https://preview.example.dev/index.html",
    });

    expect(fetchPreview).toHaveBeenCalledTimes(2);
    expect(runCommand).not.toHaveBeenCalled();
  });

  it("surfaces the last probe error and sandbox log when preview never starts", async () => {
    const fetchPreview = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("SANDBOX_NOT_LISTENING", {
        status: 502,
        statusText: "Bad Gateway",
      })
    );
    const runCommand = vi.fn().mockResolvedValue({
      command: "cat /tmp/sandbox-agent-preview.log 2>/dev/null || true",
      exitCode: 0,
      stderr: "",
      stdout: "Error: listen EADDRINUSE: address already in use 0.0.0.0:3000",
    });

    await expect(
      waitForSandboxPreview({
        entryPath: "/index.html",
        fetchPreview,
        retries: 2,
        retryDelayMs: 0,
        session: {
          runCommand,
        },
        url: "https://preview.example.dev/index.html",
      })
    ).rejects.toThrow(previewFailurePattern);

    expect(runCommand).toHaveBeenCalledTimes(1);
  });
});

describe("launchDetachedSandboxPreview", () => {
  it("uses a detached sandbox command for the preview server", async () => {
    const sandbox = {
      runCommand: vi.fn().mockResolvedValue({}),
    };
    const session = {
      runCommand: vi.fn().mockResolvedValue({
        command: "pkill -f .sandbox-agent-preview-server.mjs",
        exitCode: 0,
        stderr: "",
        stdout: "",
      }),
    };

    await launchDetachedSandboxPreview({
      directory: ".",
      port: 3000,
      sandbox,
      session,
    });

    expect(session.runCommand).toHaveBeenCalledWith(
      expect.stringContaining("pkill -f")
    );
    expect(sandbox.runCommand).toHaveBeenCalledWith({
      args: [
        "-lc",
        expect.stringContaining(
          "exec node '.sandbox-agent-preview-server.mjs' --root '.' --port 3000 >/tmp/sandbox-agent-preview.log 2>&1"
        ),
      ],
      cmd: "bash",
      cwd: "/vercel/sandbox/project",
      detached: true,
    });
  });
});
