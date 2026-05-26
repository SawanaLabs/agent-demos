import type { ContentReviewAttachment } from "@/lib/content-review/schema";

export interface PendingReviewAttachment {
  file: File;
  id: string;
  previewUrl: string;
}

export interface SubmittedReviewAttachment {
  filename: string;
  id: string;
  mediaType: string;
  previewUrl: string;
}

export function buildPendingReviewAttachment(
  file: File
): PendingReviewAttachment {
  return {
    file,
    id: `${file.name}-${file.size}-${file.lastModified}`,
    previewUrl: URL.createObjectURL(file),
  };
}

export async function convertFilesToReviewAttachments(
  files: File[]
): Promise<ContentReviewAttachment[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<ContentReviewAttachment>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result !== "string") {
              reject(new Error(`Failed to read ${file.name} as a data URL.`));
              return;
            }

            resolve({
              filename: file.name,
              mediaType: file.type || "application/octet-stream",
              url: reader.result,
            });
          };

          reader.onerror = () => {
            reject(new Error(`Failed to read ${file.name} as a data URL.`));
          };

          reader.readAsDataURL(file);
        })
    )
  );
}
