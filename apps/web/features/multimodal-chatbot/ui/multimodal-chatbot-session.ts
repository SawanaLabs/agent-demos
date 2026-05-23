import type { FileUIPart, UIMessage } from "ai";

export interface PendingAttachment {
  file: File;
  id: string;
  previewUrl: string;
}

export const multimodalSamplePrompts = [
  "Summarize the uploaded PDF in three bullets.",
  "What stands out in this image?",
  "Compare the text in the PDF with the diagram screenshot.",
] as const;

export function getMultimodalMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getMultimodalFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file"
  );
}

export function buildPendingAttachmentId(
  file: Pick<File, "lastModified" | "name" | "size">
) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function mergePendingAttachments(
  current: PendingAttachment[],
  next: PendingAttachment[]
) {
  const byId = new Map(
    current.map((attachment) => [attachment.id, attachment])
  );

  for (const attachment of next) {
    byId.set(attachment.id, attachment);
  }

  return Array.from(byId.values());
}
