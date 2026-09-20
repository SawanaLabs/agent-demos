"use client";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { getToolName, isToolUIPart, type UIMessage } from "ai";

const labels: Record<string, string> = {
  addNode: "添加并连接节点",
  removeNodes: "删除节点",
  updateNode: "修改节点",
  connectNodes: "连接节点",
  disconnectNodes: "断开连接",
  runWorkflow: "执行工作流",
  readWorkflow: "读取工作流",
  arrangeCanvas: "整理画布",
};

export function CanvasMessage({
  message,
  streaming,
}: {
  message: UIMessage;
  streaming: boolean;
}) {
  return (
    <Message from={message.role}>
      <MessageContent className="w-full min-w-0">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === "text") {
            return <MessageResponse key={key}>{part.text}</MessageResponse>;
          }
          if (part.type === "reasoning") {
            if (!part.text.trim()) {
              return null;
            }
            return (
              <Reasoning
                isStreaming={streaming && part.state === "streaming"}
                key={key}
              >
                <ReasoningTrigger>思考过程</ReasoningTrigger>
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }
          if (!isToolUIPart(part)) {
            return null;
          }
          return <CanvasTool key={key} part={part} streaming={streaming} />;
        })}
      </MessageContent>
    </Message>
  );
}

function CanvasTool({
  part,
  streaming,
}: {
  part: ToolPart;
  streaming: boolean;
}) {
  const output =
    "output" in part && part.output && typeof part.output === "object"
      ? (part.output as Record<string, unknown>)
      : undefined;
  const interrupted =
    !streaming && ["input-streaming", "input-available"].includes(part.state);
  let error: string | undefined;
  if (interrupted) {
    error = "操作已中断，可以继续完成。";
  }
  if (typeof output?.error === "string") {
    error = output.error;
  }
  if (part.state === "output-error") {
    error = part.errorText;
  }

  const summary =
    typeof output?.summary === "string"
      ? output.summary
      : "操作已完成，画布已同步。";
  return (
    <Tool defaultOpen={Boolean(error)}>
      <ToolHeader
        state={error ? "output-error" : part.state}
        title={labels[getToolName(part)] ?? "操作工作流"}
        toolName={getToolName(part)}
        type="dynamic-tool"
      />
      <ToolContent>
        <p
          className={
            error ? "text-destructive text-sm" : "text-muted-foreground text-sm"
          }
        >
          {error ??
            (part.state === "output-available" ? summary : "正在处理，请稍候…")}
        </p>
      </ToolContent>
    </Tool>
  );
}
