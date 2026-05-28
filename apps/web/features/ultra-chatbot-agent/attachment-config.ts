export const ultraChatbotAgentAcceptedUploadMediaTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ultraChatbotAgentMaxUploadBytes = 5 * 1024 * 1024;

export const ultraChatbotAgentUnsupportedAttachmentMediaTypeError =
  "Only PDF, JPEG, and PNG attachments are supported.";

const ultraChatbotAgentAcceptedUploadMediaTypeSet = new Set<string>(
  ultraChatbotAgentAcceptedUploadMediaTypes
);

export function isUltraChatbotAgentAcceptedUploadMediaType(mediaType: string) {
  return ultraChatbotAgentAcceptedUploadMediaTypeSet.has(mediaType);
}
