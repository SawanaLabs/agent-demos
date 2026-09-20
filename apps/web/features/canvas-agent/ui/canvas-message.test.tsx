import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";
import type { UIMessage } from "ai";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CanvasMessage } from "./canvas-message";
import { CanvasTool } from "./canvas-tool";

const completed: ToolPart = {
  type: "dynamic-tool",
  toolName: "addNode",
  toolCallId: "call-1",
  state: "output-available",
  input: {},
  output: { summary: "已添加提示词" },
};

describe("Canvas conversation tools", () => {
  it("keeps text and tools in SDK part order", () => {
    const message: UIMessage = {
      id: "message-1",
      role: "assistant",
      parts: [
        { type: "text", text: "准备添加提示词。" },
        completed,
        { type: "text", text: "提示词已就绪。" },
      ],
    };
    const html = renderToStaticMarkup(
      <CanvasMessage message={message} streaming={false} />
    );
    expect(html.indexOf("准备添加提示词")).toBeLessThan(
      html.indexOf("添加并连接节点")
    );
    expect(html.indexOf("添加并连接节点")).toBeLessThan(
      html.indexOf("提示词已就绪")
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("已完成");
  });

  it("shows workflow errors without opening tool details", () => {
    const html = renderToStaticMarkup(
      <CanvasTool
        part={{ ...completed, output: { error: "图片生成失败" } }}
        streaming={false}
      />
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("图片生成失败");
    expect(html).not.toContain("已完成");
  });

  it("distinguishes running tools from interrupted tools", () => {
    const part: ToolPart = {
      type: "dynamic-tool",
      toolName: "runWorkflow",
      toolCallId: "call-2",
      state: "input-available",
      input: {},
    };
    expect(
      renderToStaticMarkup(<CanvasTool part={part} streaming />)
    ).toContain("执行中");
    const stopped = renderToStaticMarkup(
      <CanvasTool part={part} streaming={false} />
    );
    expect(stopped).toContain("操作已中断，可以继续完成");
    expect(stopped).not.toContain("animate-spin");
  });

  it("shows SDK execution errors inline", () => {
    const part: ToolPart = {
      type: "dynamic-tool",
      toolName: "runWorkflow",
      toolCallId: "call-3",
      state: "output-error",
      input: {},
      errorText: "连接超时",
    };
    expect(
      renderToStaticMarkup(<CanvasTool part={part} streaming={false} />)
    ).toContain("连接超时");
  });
});
