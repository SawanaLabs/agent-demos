import { describe, expect, it, vi } from "vitest";

vi.mock("./blob-cleanup", () => ({
  cleanupExpiredUltraChatbotAgentUploadBlobs: vi.fn(),
}));

vi.mock("./chat-store", () => ({
  cleanupExpiredUltraChatbotAgentChats: vi.fn(),
}));

import { cleanupExpiredUltraChatbotAgentUploadBlobs } from "./blob-cleanup";
import { cleanupExpiredUltraChatbotAgentChats } from "./chat-store";
import {
  cleanupExpiredUltraChatbotAgentDemoData,
  ultraChatbotAgentCleanupRetentionDays,
} from "./cleanup";

describe("ultra chatbot agent cleanup", () => {
  it("cleans database rows and uploaded blobs with the same retention window", async () => {
    const now = new Date("2026-06-03T20:00:00.000Z");
    const env = {
      BLOB_READ_WRITE_TOKEN: "blob-token",
    };

    vi.mocked(cleanupExpiredUltraChatbotAgentChats).mockResolvedValue({
      chatIds: ["chat-1"],
      deletedChats: 1,
      deletedVotes: 2,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });
    vi.mocked(cleanupExpiredUltraChatbotAgentUploadBlobs).mockResolvedValue({
      deletedCount: 3,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });

    const result = await cleanupExpiredUltraChatbotAgentDemoData({ env, now });

    expect(cleanupExpiredUltraChatbotAgentChats).toHaveBeenCalledWith({
      now,
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });
    expect(cleanupExpiredUltraChatbotAgentUploadBlobs).toHaveBeenCalledWith(
      env,
      {
        now,
        retentionDays: ultraChatbotAgentCleanupRetentionDays,
      }
    );
    expect(result).toEqual({
      blobs: {
        deletedCount: 3,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: ultraChatbotAgentCleanupRetentionDays,
      },
      database: {
        chatIds: ["chat-1"],
        deletedChats: 1,
        deletedVotes: 2,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: ultraChatbotAgentCleanupRetentionDays,
      },
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });
  });
});
