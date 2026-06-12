import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const demoSlugs = readdirSync(currentDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => existsSync(path.join(currentDirectory, slug, "page.tsx")))
  .sort();

describe("demo page rendering", () => {
  it.each(
    demoSlugs
  )("%s renders dynamically so setup state matches runtime configuration", (slug) => {
    const pageSource = readFileSync(
      path.join(currentDirectory, slug, "page.tsx"),
      "utf-8"
    );

    expect(pageSource).toMatch(/export const dynamic = "force-dynamic";/);
  });
});
