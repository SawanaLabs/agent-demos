import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DemoWorkspaceShell } from "./demo-workspace-shell";

describe("DemoWorkspaceShell", () => {
  it("renders the shared demo chrome around feature-owned workspace content", () => {
    const markup = renderToStaticMarkup(
      <DemoWorkspaceShell
        badges={["Ready", "gpt-5-mini"]}
        summary="Keeps feature workspace logic outside the shared screen shell."
        title="Shared Demo Shell"
      >
        <section data-testid="workspace-slot">Feature workspace</section>
      </DemoWorkspaceShell>
    );

    expect(markup).toContain('class="min-h-svh bg-background text-foreground"');
    expect(markup).toContain("max-w-7xl");
    expect(markup).toContain("Shared Demo Shell");
    expect(markup).toContain(
      "Keeps feature workspace logic outside the shared screen shell."
    );
    expect(markup).toContain("Ready");
    expect(markup).toContain("gpt-5-mini");
    expect(markup).toContain("lg:h-svh");
    expect(markup).toContain('data-testid="workspace-slot"');
  });
});
