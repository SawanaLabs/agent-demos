import { describe, expect, it } from "vitest";

interface PageModule {
  dynamic?: string;
}

interface TestImportMeta extends ImportMeta {
  glob<TModule>(pattern: string): Record<string, () => Promise<TModule>>;
}

const pageModules = (import.meta as TestImportMeta).glob<PageModule>(
  "./*/page.tsx"
);
const demoSlugs = Object.keys(pageModules)
  .map((path) => path.match(/^\.\/(?<slug>[^/]+)\/page\.tsx$/)?.groups?.slug)
  .filter((slug): slug is string => Boolean(slug))
  .sort();

describe("demo page rendering", () => {
  it.each(
    demoSlugs
  )("%s renders dynamically so setup state matches runtime configuration", async (slug) => {
    const loadPageModule = pageModules[`./${slug}/page.tsx`];

    if (!loadPageModule) {
      throw new Error(`Missing page module for demo slug "${slug}".`);
    }

    const pageModule = await loadPageModule();

    expect(pageModule.dynamic).toBe("force-dynamic");
  });
});
