import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: ComponentProps<"a"> & {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a data-prefetch={String(prefetch)} href={href} {...props}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("homepage demo gallery", () => {
  it("renders the random demo action before the GitHub link", async () => {
    const { default: Page } = await import("./page");
    const markup = renderToStaticMarkup(<Page />);
    const randomButtonIndex = markup.indexOf(
      'aria-label="Open a random ready Agent Demo"'
    );
    const githubLinkIndex = markup.indexOf(
      'aria-label="Open Agent Demos GitHub repository"'
    );

    expect(randomButtonIndex).toBeGreaterThanOrEqual(0);
    expect(githubLinkIndex).toBeGreaterThanOrEqual(0);
    expect(randomButtonIndex).toBeLessThan(githubLinkIndex);
  });

  it("renders the GitHub repository link in the hero actions", async () => {
    const { default: Page } = await import("./page");
    const markup = renderToStaticMarkup(<Page />);
    const githubLink = markup.match(
      /<a[^>]+href="https:\/\/github.com\/SawanaLabs\/agent-demos"[^>]*>/
    )?.[0];

    expect(githubLink).toContain(
      'aria-label="Open Agent Demos GitHub repository"'
    );
    expect(githubLink).toContain('rel="noreferrer"');
    expect(githubLink).toContain('target="_blank"');
  });

  it("disables viewport prefetching for ready demo card links", async () => {
    const { default: Page } = await import("./page");
    const markup = renderToStaticMarkup(<Page />);
    const ultraCardLink = markup.match(
      /<a[^>]+href="\/demos\/ultra-chatbot-agent"[^>]*>/
    )?.[0];

    expect(ultraCardLink).toContain('data-prefetch="false"');
  });
});
