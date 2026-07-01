import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

function collectPageRouteDirectories(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const nestedDirectories = entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      collectPageRouteDirectories(path.join(directory, entry.name))
    );

  if (entries.some((entry) => entry.isFile() && entry.name === "page.tsx")) {
    return [directory, ...nestedDirectories];
  }

  return nestedDirectories;
}

const pageRoutes = collectPageRouteDirectories(appDirectory)
  .map((directory) => {
    const relativeRoute = path.relative(appDirectory, directory);

    return {
      directory,
      route: relativeRoute ? `/${relativeRoute}` : "/",
    };
  })
  .sort((left, right) => left.route.localeCompare(right.route));

describe("App Router loading UI", () => {
  it.each(pageRoutes)("$route has loading UI colocated with its page", ({
    directory,
  }) => {
    expect(existsSync(path.join(directory, "loading.tsx"))).toBe(true);
  });
});
