import { describe, expect, it, vi } from "vitest";

import {
  cleanupExpiredUltraChatbotAgentChats,
  type UltraChatbotAgentChatCleanupPersistence,
  ultraChatbotAgentCleanupRetentionDays,
} from "./chat-store";

function createPersistence(
  overrides: Partial<UltraChatbotAgentChatCleanupPersistence> = {}
): UltraChatbotAgentChatCleanupPersistence {
  return {
    deleteExpiredChatsByIds: vi.fn().mockResolvedValue({
      deletedChats: 2,
      deletedVotes: 3,
    }),
    findExpiredChats: vi.fn().mockResolvedValue([
      {
        id: "chat-1",
        updatedAt: "2026-05-24T20:00:00.000Z",
      },
      {
        id: "chat-2",
        updatedAt: "2026-05-25T20:00:00.000Z",
      },
    ]),
    ...overrides,
  };
}

describe("ultra chatbot agent chat cleanup", () => {
  it("deletes expired chats and their non-cascading vote rows", async () => {
    const persistence = createPersistence();

    const result = await cleanupExpiredUltraChatbotAgentChats(
      {
        now: new Date("2026-06-03T20:00:00.000Z"),
      },
      { persistence }
    );

    expect(persistence.findExpiredChats).toHaveBeenCalledWith({
      olderThan: new Date("2026-05-27T20:00:00.000Z"),
    });
    expect(persistence.deleteExpiredChatsByIds).toHaveBeenCalledWith([
      "chat-1",
      "chat-2",
    ]);
    expect(result).toEqual({
      chatIds: ["chat-1", "chat-2"],
      deletedChats: 2,
      deletedVotes: 3,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });
  });

  it("skips delete calls when no chat has expired", async () => {
    const persistence = createPersistence({
      findExpiredChats: vi.fn().mockResolvedValue([]),
    });

    const result = await cleanupExpiredUltraChatbotAgentChats(
      {
        now: new Date("2026-06-03T20:00:00.000Z"),
      },
      { persistence }
    );

    expect(persistence.deleteExpiredChatsByIds).not.toHaveBeenCalled();
    expect(result).toEqual({
      chatIds: [],
      deletedChats: 0,
      deletedVotes: 0,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: ultraChatbotAgentCleanupRetentionDays,
    });
  });
});
