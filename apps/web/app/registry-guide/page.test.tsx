import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentProps<"a"> & {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function getOpeningTagBeforeText({
  classFragment,
  markup,
  tagName,
  text,
}: {
  classFragment?: string;
  markup: string;
  tagName: string;
  text: string;
}) {
  const textIndex = markup.indexOf(text);
  expect(textIndex).toBeGreaterThanOrEqual(0);

  let searchIndex = textIndex;

  while (searchIndex >= 0) {
    const tagStart = markup.lastIndexOf(`<${tagName}`, searchIndex);
    const tagEnd = markup.indexOf(">", tagStart);

    expect(tagStart).toBeGreaterThanOrEqual(0);
    expect(tagEnd).toBeGreaterThanOrEqual(0);

    const openingTag = markup.slice(tagStart, tagEnd);

    if (!(classFragment && !openingTag.includes(classFragment))) {
      return openingTag;
    }

    searchIndex = tagStart - 1;
  }

  throw new Error(
    `Could not find <${tagName}> before ${text} with class ${classFragment}.`
  );
}

describe("registry guide mobile layout", () => {
  it("lets command panel titles and actions wrap instead of widening the viewport", async () => {
    const { default: RegistryGuidePage } = await import("./page");
    const markup = renderToStaticMarkup(<RegistryGuidePage />);
    const headerTag = getOpeningTagBeforeText({
      classFragment: "border-b",
      markup,
      tagName: "div",
      text: "autopilot task brief",
    });
    const actionsTag = getOpeningTagBeforeText({
      classFragment: "gap-1",
      markup,
      tagName: "div",
      text: "Open in chat",
    });

    expect(headerTag).toContain("min-w-0");
    expect(headerTag).toContain("flex-col");
    expect(headerTag).toContain("sm:flex-row");
    expect(actionsTag).toContain("min-w-0");
    expect(actionsTag).toContain("flex-wrap");
  });
});
