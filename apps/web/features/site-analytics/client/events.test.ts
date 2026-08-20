import { describe, expect, it, vi } from "vitest";

import {
  type DemoActionEvent,
  demoActionCatalog,
  dispatchDemoAction,
} from "./events";

describe("site analytics event contract", () => {
  it("keeps the first demo action vocabulary finite and low-cardinality", () => {
    expect(demoActionCatalog).toEqual({
      "image-workflow-agent": [
        "modify_workflow",
        "run_workflow",
        "send_message",
      ],
    });
  });

  it("dispatches one bounded demo_action payload", () => {
    const provider = vi.fn();
    const event: DemoActionEvent = {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: true,
      source: "manual",
    };

    dispatchDemoAction(provider, event);

    expect(provider).toHaveBeenCalledOnce();
    expect(provider).toHaveBeenCalledWith("demo_action", event);
  });

  it("keeps source optional for every demo action", () => {
    const provider = vi.fn();

    dispatchDemoAction(provider, {
      action: "modify_workflow",
      demo_slug: "image-workflow-agent",
    });
    dispatchDemoAction(provider, {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: false,
    });

    expect(provider).toHaveBeenNthCalledWith(1, "demo_action", {
      action: "modify_workflow",
      demo_slug: "image-workflow-agent",
    });
    expect(provider).toHaveBeenNthCalledWith(2, "demo_action", {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: false,
    });
  });

  it("strips unknown runtime fields before provider dispatch", () => {
    const provider = vi.fn();

    dispatchDemoAction(provider, {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: true,
      prompt: "private launch plan",
      source: "manual",
      workflow_id: "visitor-workflow-123",
    } as never);

    expect(provider).toHaveBeenCalledOnce();
    expect(provider).toHaveBeenCalledWith("demo_action", {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: true,
      source: "manual",
    });
  });

  it("drops runtime values outside the finite catalog", () => {
    const provider = vi.fn();

    dispatchDemoAction(provider, {
      action: "clicked_anything",
      demo_slug: "private-demo",
      source: "visitor-123",
    } as never);

    expect(provider).not.toHaveBeenCalled();
  });

  it("does not let an analytics provider failure own the product workflow", () => {
    expect(() =>
      dispatchDemoAction(
        () => {
          throw new Error("provider unavailable");
        },
        {
          action: "send_message",
          demo_slug: "image-workflow-agent",
          source: "manual",
        }
      )
    ).not.toThrow();
  });
});
