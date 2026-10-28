import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DemoConversation } from "./demo-conversation";
import { DemoWorkspaceShell } from "./demo-workspace-shell";

describe("demo conversation controls", () => {
  it("keeps session reset inside the conversation, ahead of scrollable messages", () => {
    const markup = renderToStaticMarkup(
      <DemoWorkspaceShell summary="Demo description" title="Demo title">
        <DemoConversation>Conversation messages</DemoConversation>
      </DemoWorkspaceShell>
    );

    const header = markup.slice(0, markup.indexOf("</header>"));
    const conversation = markup.slice(markup.indexOf("data-demo-conversation"));
    expect(header).not.toContain("Clear session");
    expect(conversation).toContain("Clear session");
    expect(conversation.indexOf("Clear session")).toBeLessThan(
      conversation.indexOf('role="log"')
    );
  });
});
