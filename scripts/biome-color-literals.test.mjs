import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const biomeBinary = resolve(repositoryRoot, "node_modules/.bin/biome");
const biomeConfig = resolve(repositoryRoot, "biome.jsonc");

function lintPath(fixturePath) {
  const result = spawnSync(
    biomeBinary,
    ["lint", "--reporter=json", `--config-path=${biomeConfig}`, fixturePath],
    { cwd: repositoryRoot, encoding: "utf8" }
  );
  const output = JSON.parse(result.stdout);
  const expectedStatus = output.diagnostics.some(
    ({ severity }) => severity === "error"
  )
    ? 1
    : 0;

  assert.equal(
    result.status,
    expectedStatus,
    `Biome lint returned an unexpected status.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );

  return output.diagnostics.filter(({ category }) =>
    category.endsWith("plugin")
  );
}

function lintSource({ extension, source }) {
  const fixtureDirectory = mkdtempSync(
    join(repositoryRoot, "apps/web/biome-colors-")
  );
  const fixturePath = join(fixtureDirectory, `fixture.${extension}`);

  try {
    writeFileSync(fixturePath, source);
    return lintPath(fixturePath);
  } finally {
    rmSync(fixtureDirectory, { force: true, recursive: true });
  }
}

test("rejects hardcoded Tailwind palette colors", () => {
  const diagnostics = lintSource({
    extension: "tsx",
    source: `
export function Example() {
  return <div className="bg-white/90 dark:bg-zinc-950" />;
}
`,
  });

  assert.equal(diagnostics.length, 1, JSON.stringify(diagnostics, null, 2));
  assert.ok(diagnostics.every(({ severity }) => severity === "error"));
  assert.ok(
    diagnostics.every(({ message }) => message.includes("semantic color token"))
  );
});

test("rejects colors behind variants and Tailwind 4.3 palettes", () => {
  const diagnostics = lintSource({
    extension: "tsx",
    source: `
export function Example() {
  return <div className="hover:shadow-black/[0.25] data-[state=open]:border-x-slate-400 bg-mauve-50 text-olive-950 border-mist-100 ring-taupe-900" />;
}
`,
  });

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.severity, "error");
});

test("rejects arbitrary Tailwind and inline style color literals", () => {
  const tailwindDiagnostics = lintSource({
    extension: "tsx",
    source: `
export function Example() {
  return <div className="bg-[#17150f] text-[oklch(0.9_0.2_120)]" />;
}
`,
  });
  const inlineStyleDiagnostics = lintSource({
    extension: "tsx",
    source: `
export function Example() {
  return <div style={{ backgroundColor: "rgb(23 21 15)", color: "#fff" }} />;
}
`,
  });

  assert.equal(tailwindDiagnostics.length, 1);
  assert.equal(inlineStyleDiagnostics.length, 2);
});

test("allows semantic utilities and similarly named non-colors", () => {
  const diagnostics = lintSource({
    extension: "tsx",
    source: `
export function Example() {
  return <a className="border-border bg-background text-foreground" href="/tools/semantic-preview">Example</a>;
}
`,
  });

  assert.deepEqual(diagnostics, []);
});

for (const [name, value] of [
  ["hex", "#17150f"],
  ["rgb", "rgb(23 21 15)"],
  ["hsl", "hsl(30 16% 7%)"],
  ["oklch", "oklch(0.9 0.2 120)"],
]) {
  test(`rejects ${name} CSS color literals outside the shared token source`, () => {
    const diagnostics = lintSource({
      extension: "css",
      source: `.example { color: ${value}; }`,
    });

    assert.equal(diagnostics.length, 1);
    assert.ok(diagnostics.every(({ severity }) => severity === "error"));
  });
}

test("allows CSS token composition", () => {
  const diagnostics = lintSource({
    extension: "css",
    source: ".example { background: var(--primary); color: currentColor; }",
  });

  assert.deepEqual(diagnostics, []);
});

test("allows literals in the shared token source", () => {
  const diagnostics = lintPath(
    resolve(repositoryRoot, "packages/ui/src/styles/globals.css")
  );

  assert.deepEqual(diagnostics, []);
});
