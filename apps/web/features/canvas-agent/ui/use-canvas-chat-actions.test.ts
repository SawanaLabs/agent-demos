import { expect, it } from "vitest";
import { canvasRetryMessage } from "./use-canvas-chat-actions";

it("resumes the explanation without rerunning failed tools after a chat interruption", () => {
  expect(
    canvasRetryMessage({
      id: "reply",
      role: "assistant",
      parts: [
        {
          type: "tool-runWorkflow",
          toolCallId: "run",
          state: "output-available",
          input: { target: "image" },
          output: { error: "额度不足" },
        },
      ],
    })
  ).toContain("不要重新运行节点");
});

it("can resume unfinished work when there is no failed tool result", () => {
  expect(
    canvasRetryMessage({
      id: "reply",
      role: "assistant",
      parts: [
        {
          type: "tool-runWorkflow",
          toolCallId: "run",
          state: "input-available",
          input: { target: "image" },
        },
      ],
    })
  ).toContain("只执行尚未完成的部分");
});
