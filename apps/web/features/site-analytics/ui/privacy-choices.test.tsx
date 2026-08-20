import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PrivacyChoices } from "./privacy-choices";

describe("site analytics privacy choices", () => {
  it("offers an explicit grant and a denied choice", () => {
    const markup = renderToStaticMarkup(<PrivacyChoices onChoose={vi.fn()} />);

    expect(markup).toContain("Privacy &amp; analytics");
    expect(markup).toContain("Allow analytics");
    expect(markup).toContain("Keep denied");
    expect(markup).toContain("cookieless measurement pings");
  });
});
