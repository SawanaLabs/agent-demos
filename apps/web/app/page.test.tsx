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

describe("homepage demo gallery", () => {
  it("disables viewport prefetching for ready demo card links", async () => {
    const { default: Page } = await import("./page");
    const markup = renderToStaticMarkup(<Page />);
    const ultraCardLink = markup.match(
      /<a[^>]+href="\/demos\/ultra-chatbot-agent"[^>]*>/
    )?.[0];

    expect(ultraCardLink).toContain('data-prefetch="false"');
  });
});
