import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  getNextToolbarActionIndex,
  ImageWorkflowAgentCanvasControls,
} from "./image-workflow-agent-canvas-controls";

describe("ImageWorkflowAgentCanvasControls", () => {
  it("keeps workflow state visible and exposes one accessible action toolbar", () => {
    const markup = renderToStaticMarkup(
      <ImageWorkflowAgentCanvasControls
        canAddReference={true}
        canReset={true}
        canRun={true}
        hasReference={false}
        isRunning={false}
        onAddReference={vi.fn()}
        onReset={vi.fn()}
        onRun={vi.fn()}
        resultStatus="idle"
        revision={4}
      />
    );

    expect(markup).toContain("Revision 4");
    expect(markup).toContain("Prompt only");
    expect(markup).toContain("idle");
    expect(markup).toContain('role="toolbar"');
    expect(markup).toContain('aria-label="Workflow actions"');
    expect(markup).toContain('aria-orientation="horizontal"');
    expect(markup).toContain('aria-label="Add reference"');
    expect(markup).toContain('aria-label="Reset workflow"');
    expect(markup).toContain('aria-label="Run workflow"');
  });

  it("moves focus circularly while skipping disabled actions", () => {
    const enabledActions = [false, true, true];

    expect(getNextToolbarActionIndex(enabledActions, 1, "ArrowRight")).toBe(2);
    expect(getNextToolbarActionIndex(enabledActions, 2, "ArrowRight")).toBe(1);
    expect(getNextToolbarActionIndex(enabledActions, 1, "ArrowLeft")).toBe(2);
    expect(getNextToolbarActionIndex(enabledActions, 2, "Home")).toBe(1);
    expect(getNextToolbarActionIndex(enabledActions, 1, "End")).toBe(2);
  });
});
