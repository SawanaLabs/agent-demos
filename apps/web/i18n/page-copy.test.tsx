import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageCopyProvider, PageText } from "@/components/page-copy";
import {
  demoCatalogEntries,
  demoPatternLabels,
} from "@/features/demo-catalog/registry";
import { pageCopyKey, resolveLocale } from "./locale";
import en from "./messages/en.json" with { type: "json" };
import zh from "./messages/zh-CN.json" with { type: "json" };
import { SitePageCopy } from "./site-page-copy";

describe("page copy boundary", () => {
  it("keeps standalone registry demos usable in English", () => {
    expect(renderToStaticMarkup(<PageText>Retry</PageText>)).toBe("Retry");
  });

  it("translates explicit page copy without wrapping or touching other content", () => {
    expect(
      renderToStaticMarkup(
        <PageCopyProvider translate={() => "重试"}>
          <PageText>Retry</PageText>
          <p>User and model content</p>
        </PageCopyProvider>
      )
    ).toBe("重试<p>User and model content</p>");
  });

  it("defaults to English and accepts simplified Chinese", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale("zh-CN")).toBe("zh-CN");
  });

  it("keeps dotted source strings in a single next-intl key", () => {
    expect(pageCopyKey(" Next.js is ready. ")).not.toContain(".");
    expect(pageCopyKey("Next.js\n is ready.")).toBe(
      pageCopyKey("Next.js is ready.")
    );
  });

  it.each([
    ["en", en, "Retry", "Create an image"],
    ["zh-CN", zh, "重试", "创作一张图片"],
  ] as const)("renders %s with next-intl while preserving conversation content", (locale, messages, retry, canvas) => {
    expect(
      renderToStaticMarkup(
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="UTC"
        >
          <SitePageCopy>
            <button type="button">
              <PageText>Retry</PageText>
            </button>
            <p>
              <PageText>创作一张图片</PageText>
            </p>
            <p>User / model content</p>
          </SitePageCopy>
        </NextIntlClientProvider>
      )
    ).toBe(
      `<button type="button">${retry}</button><p>${canvas}</p><p>User / model content</p>`
    );
  });

  it("covers the same messages and every homepage catalog entry in both languages", () => {
    expect(Object.keys(en.Page).sort()).toEqual(Object.keys(zh.Page).sort());
    const copy = [
      ...Object.values(demoPatternLabels),
      ...demoCatalogEntries.flatMap((demo) => [
        demo.title,
        demo.summary,
        demo.galleryVisual.label,
      ]),
    ];
    for (const source of copy) {
      const key = pageCopyKey(source);
      expect(en.Page).toHaveProperty(key);
      expect(zh.Page).toHaveProperty(key);
    }
  });
});
