import { describe, expect, it } from "vitest";

import {
  findUltraChatbotAgentTargetDocument,
  getUltraChatbotAgentDocumentLookupError,
} from "./document-target";

const documentRecord = {
  chatId: "chat-1",
  content: "content",
  createdAt: "2026-05-27T00:00:00.000Z",
  id: "11111111-1111-1111-1111-111111111111",
  kind: "text" as const,
  title: "Ultra Launch Brief",
  visitorId: "visitor-1",
};

describe("ultra chatbot document target lookup", () => {
  it("finds the document by title when the model sends the zero UUID placeholder", () => {
    const matchedDocument = findUltraChatbotAgentTargetDocument({
      documentId: "00000000-0000-0000-0000-000000000000",
      documentTitle: "Ultra Launch Brief",
      latestDocuments: [documentRecord],
    });

    expect(matchedDocument?.id).toBe(documentRecord.id);
  });

  it("reports title-based lookup errors when the zero UUID placeholder is present", () => {
    expect(
      getUltraChatbotAgentDocumentLookupError({
        documentId: "00000000-0000-0000-0000-000000000000",
        documentTitle: "Ultra Launch Brief",
        documentsCount: 1,
      })
    ).toBe('No document found with the title "Ultra Launch Brief".');
  });

  it("falls back to the title when the model hallucinates a document id", () => {
    const matchedDocument = findUltraChatbotAgentTargetDocument({
      documentId: "22222222-2222-2222-2222-222222222222",
      documentTitle: "Ultra Launch Brief",
      latestDocuments: [documentRecord],
    });

    expect(matchedDocument?.id).toBe(documentRecord.id);
  });
});
