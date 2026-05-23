import {
  type DynamicToolUIPart,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";

export interface SandboxPreviewOutput {
  directory: string | null;
  entryPath: string | null;
  port: number | null;
  url: string;
}

export interface SandboxPreviewStatus {
  errorCode: string | null;
  message: string | null;
  ok: boolean;
  status: number | null;
  statusText: string | null;
}

type PreviewToolPart = ToolUIPart | DynamicToolUIPart;

function getToolName(part: PreviewToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

function readObjectField(value: unknown, field: string): string | null {
  if (!value || typeof value !== "object" || !(field in value)) {
    return null;
  }

  const candidate = value[field as keyof typeof value];

  return typeof candidate === "string" ? candidate : null;
}

function readNumberField(value: unknown, field: string): number | null {
  if (!value || typeof value !== "object" || !(field in value)) {
    return null;
  }

  const candidate = value[field as keyof typeof value];

  return typeof candidate === "number" ? candidate : null;
}

export function getPreviewOutput(
  toolParts: PreviewToolPart[]
): SandboxPreviewOutput | null {
  const previewPart = [...toolParts]
    .reverse()
    .find(
      (part) =>
        getToolName(part) === "startPreview" &&
        part.state === "output-available" &&
        readObjectField(part.output, "url")
    );

  if (!previewPart) {
    return null;
  }

  const url = readObjectField(previewPart.output, "url");

  if (!url) {
    return null;
  }

  return {
    directory: readObjectField(previewPart.output, "directory"),
    entryPath: readObjectField(previewPart.output, "entryPath"),
    port: readNumberField(previewPart.output, "port"),
    url,
  };
}

export function getLatestPreviewOutput(
  messages: UIMessage[]
): SandboxPreviewOutput | null {
  for (const message of [...messages].reverse()) {
    const preview = getPreviewOutput(message.parts.filter(isToolUIPart));

    if (preview) {
      return preview;
    }
  }

  return null;
}

export function sanitizePreviewText(text: string, previewUrl: string | null) {
  if (!(previewUrl && text.includes(previewUrl))) {
    return text;
  }

  return text.split(previewUrl).join("the Preview tab");
}

export function parsePreviewStatus(value: unknown): SandboxPreviewStatus {
  const objectValue =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    errorCode:
      typeof objectValue.errorCode === "string" ? objectValue.errorCode : null,
    message:
      typeof objectValue.message === "string" ? objectValue.message : null,
    ok: objectValue.ok === true,
    status: typeof objectValue.status === "number" ? objectValue.status : null,
    statusText:
      typeof objectValue.statusText === "string"
        ? objectValue.statusText
        : null,
  };
}

export function formatPreviewStatusSummary(status: SandboxPreviewStatus) {
  if (status.ok) {
    return "Preview is reachable.";
  }

  const parts = ["Preview is unavailable."];

  if (typeof status.status === "number") {
    parts.push(`HTTP ${status.status}`);
  }

  if (status.errorCode) {
    parts.push(status.errorCode);
  }

  if (status.message) {
    parts.push(status.message);
  }

  return parts.join(" ");
}

export function appendPreviewHistory(
  history: string[],
  currentIndex: number,
  url: string
) {
  const currentUrl = currentIndex >= 0 ? history[currentIndex] : null;

  if (currentUrl === url) {
    return {
      history,
      index: currentIndex,
    };
  }

  const nextHistory = history.slice(0, currentIndex + 1);
  nextHistory.push(url);

  return {
    history: nextHistory,
    index: nextHistory.length - 1,
  };
}

export function movePreviewHistory(
  history: string[],
  currentIndex: number,
  direction: -1 | 1
) {
  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= history.length) {
    return null;
  }

  const nextUrl = history[nextIndex];

  if (!nextUrl) {
    return null;
  }

  return {
    index: nextIndex,
    url: nextUrl,
  };
}
