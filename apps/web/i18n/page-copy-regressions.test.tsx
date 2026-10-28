import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RouteErrorPage from "@/app/error";
import { LinkPendingLabel } from "@/components/link-pending-label";
import { PageText, usePageCopy } from "@/components/page-copy";
import { getCustomerMemorySamplePrompts } from "@/features/customer-memory-agent/ui/customer-memory-session";
import { getLoopAgentSamplePrompts } from "@/features/loop-agent/ui/loop-agent-sample-prompts";
import en from "./messages/en.json" with { type: "json" };
import zh from "./messages/zh-CN.json" with { type: "json" };
import { SitePageCopy } from "./site-page-copy";

function LoopPromptLabels() {
  const pageCopy = usePageCopy();
  return getLoopAgentSamplePrompts("CASE-9999", pageCopy).map(
    ({ prompt, label }) => (
      <button data-prompt={prompt} key={prompt} type="button">
        {label}
      </button>
    )
  );
}

describe("localized page regressions", () => {
  it.each([
    ["en", en],
    ["zh-CN", zh],
  ] as const)("renders variable case IDs in %s while retaining original submitted prompts", (locale, messages) => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="UTC"
      >
        <SitePageCopy>
          <LoopPromptLabels />
          <LinkPendingLabel pendingLabel="Opening..." readyLabel="Open demo" />
        </SitePageCopy>
      </NextIntlClientProvider>
    );
    expect(html).toContain(
      'data-prompt="Triage CASE-9999 and explain the tool sequence."'
    );
    expect(html).toContain(
      locale === "zh-CN" ? "分诊 CASE-9999" : "Triage CASE-9999"
    );
    expect(html).not.toContain("{caseId}");
    expect(html).toContain(locale === "zh-CN" ? "打开 Demo" : "Open demo");
  });
  it("renders the Chinese route recovery controls without translating twice", () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="zh-CN" messages={zh} timeZone="UTC">
        <SitePageCopy>
          <RouteErrorPage
            error={new Error("Original runtime error")}
            reset={() => undefined}
          />
        </SitePageCopy>
      </NextIntlClientProvider>
    );
    expect(html).toContain("出了点问题");
    expect(html).toContain("重试");
  });

  it.each([
    ["en", en],
    ["zh-CN", zh],
  ] as const)("renders every customer sample prompt in %s", (locale, messages) => {
    const prompts = [
      "demo-sandbox",
      "northstar-logistics",
      "helio-dev",
      "acme-co",
    ].flatMap(getCustomerMemorySamplePrompts);
    expect(() =>
      renderToStaticMarkup(
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="UTC"
        >
          <SitePageCopy>
            {prompts.map((prompt) => (
              <p key={prompt}>
                <PageText>{prompt}</PageText>
              </p>
            ))}
          </SitePageCopy>
        </NextIntlClientProvider>
      )
    ).not.toThrow();
  });
});
