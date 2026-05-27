"use client";

import type { ToolPart } from "@/components/ai-elements/tool";
import { isReasoningUIPart, isToolUIPart, type UIMessage } from "ai";

export const configuredTools = [
  {
    description: "Run shell commands inside the sandbox workspace.",
    name: "bash",
  },
  {
    description: "Read sandbox-backed files directly.",
    name: "readFile",
  },
  {
    description: "Write sandbox-backed files directly.",
    name: "writeFile",
  },
  {
    description: "Expose the generated prototype through the preview URL.",
    name: "startPreview",
  },
] as const;

export const samplePrompts = [
  "Build a pricing landing page with an interactive calculator and start a live preview.",
  "Create a waitlist landing page with a ROI calculator and expose the result through the sandbox preview.",
  "Generate a product microsite with HTML, CSS, and JavaScript, then let me iterate on the copy and calculator logic.",
] as const;

export function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

export function getToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}

export function getToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

export function getWrittenFiles(toolParts: ToolPart[]) {
  return toolParts
    .filter(
      (part) =>
        getToolName(part) === "writeFile" && part.state === "output-available"
    )
    .map((part) => {
      if (!part.output || typeof part.output !== "object") {
        return null;
      }

      const candidate = "path" in part.output ? part.output.path : null;

      return typeof candidate === "string" ? candidate : null;
    })
    .filter((path): path is string => Boolean(path));
}
