import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDirectory, "../../../../../../");
const runnerPath = path.join(repoRoot, "scripts/test/run-web-integration.sh");

async function readJsonFile(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf-8")) as {
    scripts: Record<string, string>;
  };
}

describe("vercel sandbox integration test command", () => {
  it("keeps real sandbox tests behind an explicit package script", async () => {
    const [rootPackage, webPackage] = await Promise.all([
      readJsonFile(path.join(repoRoot, "package.json")),
      readJsonFile(path.join(repoRoot, "apps/web/package.json")),
    ]);

    expect(rootPackage.scripts["test:integration"]).toBe(
      "pnpm --dir apps/web test:integration"
    );
    expect(rootPackage.scripts["test:integration:sandbox"]).toBe(
      "pnpm --dir apps/web test:integration:sandbox"
    );
    expect(webPackage.scripts["test:integration"]).toBe(
      "../../scripts/test/run-web-integration.sh"
    );
    expect(webPackage.scripts["test:integration:sandbox"]).toBe(
      "../../scripts/test/run-web-integration.sh --sandbox"
    );
  });

  it("forces the sandbox gate after local env files are loaded", async () => {
    const runner = await readFile(runnerPath, "utf-8");
    const envLoadIndex = runner.indexOf("for env_file in");
    const gateIndex = runner.indexOf("export VERCEL_SANDBOX_INTEGRATION=1");
    const argSeparatorIndex = runner.indexOf(
      ['if [[ "$', '{1:-}" == "--" ]]'].join("")
    );

    expect(argSeparatorIndex).toBeGreaterThan(-1);
    expect(envLoadIndex).toBeGreaterThan(-1);
    expect(gateIndex).toBeGreaterThan(envLoadIndex);
    await expect(
      execFileAsync("bash", ["-n", runnerPath])
    ).resolves.toBeTruthy();
  });
});
