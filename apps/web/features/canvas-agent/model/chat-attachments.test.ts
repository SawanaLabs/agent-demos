import type { UIMessage } from "ai";
import { expect, it } from "vitest";
import { referenceAttachment } from "./chat-attachments";

const url =
  "https://example.public.blob.vercel-storage.com/canvas-agent/uploads/photo.png";
const messages: UIMessage[] = [
  {
    id: "photo",
    role: "user",
    parts: [{ type: "file", url, mediaType: "image/png" }],
  },
];
it("binds only an actual chat attachment to a reference node", () => {
  expect(referenceAttachment("reference", url, messages)).toBe(url);
  expect(() => referenceAttachment("image", url, messages)).toThrow();
  expect(() => referenceAttachment("reference", url, [])).toThrow();
});
