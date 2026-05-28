"use client";

import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
} from "@workspace/ui/components/ai-elements/attachments";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import type { FileUIPart } from "ai";

export type UltraChatbotAgentPreviewAttachmentData = FileUIPart & {
  id: string;
};

export interface UltraChatbotAgentPreviewAttachmentProps {
  attachment: UltraChatbotAgentPreviewAttachmentData;
  isUploading?: boolean;
  onRemove?: () => void;
}

export function UltraChatbotAgentPreviewAttachment({
  attachment,
  isUploading = false,
  onRemove,
}: UltraChatbotAgentPreviewAttachmentProps) {
  return (
    <Attachment
      className={cn(
        "min-w-0 max-w-full overflow-hidden",
        isUploading && "pointer-events-none opacity-80"
      )}
      data={attachment}
      onRemove={onRemove}
    >
      <AttachmentPreview />
      <AttachmentInfo showMediaType />
      <AttachmentRemove disabled={isUploading} />
      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
          <Spinner className="size-4" />
        </div>
      ) : null}
    </Attachment>
  );
}
