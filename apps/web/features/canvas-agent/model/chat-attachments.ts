import type { UIMessage } from "ai";
import { z } from "zod";
import { canvasImageTypes, canvasImageUrlSchema } from "./image";

export const chatImageSchema = z.object({
  type: z.literal("file"),
  url: canvasImageUrlSchema,
  mediaType: z.enum(canvasImageTypes),
  filename: z.string().max(255).optional(),
});

export const questionSchema = z.object({
  question: z.string().max(500),
  options: z.array(z.string().max(200)).min(2).max(4),
});

export function chatAttachments(messages: UIMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .flatMap((message) => message.parts.filter((part) => part.type === "file"))
    .map((part) => chatImageSchema.parse(part));
}

export function referenceAttachment(
  kind: string,
  url: string | undefined,
  messages: UIMessage[]
) {
  if (!url) {
    return;
  }
  if (kind !== "reference") {
    throw new Error("Chat images must be attached to reference nodes");
  }
  const attachment = chatAttachments(messages).find((file) => file.url === url);
  if (!attachment) {
    throw new Error("Image is not an attachment in this conversation");
  }
  return attachment.url;
}
