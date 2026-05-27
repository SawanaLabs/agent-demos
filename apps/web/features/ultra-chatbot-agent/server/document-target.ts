import type { UltraChatbotAgentDocumentRecord } from "./document-store";

const placeholderDocumentId = "00000000-0000-0000-0000-000000000000";

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase();
}

function normalizeDocumentId(value: string | undefined) {
  if (!value || value === placeholderDocumentId) {
    return undefined;
  }

  return value;
}

export function getUltraChatbotAgentDocumentLookupError(input: {
  documentId?: string;
  documentTitle?: string;
  documentsCount: number;
}) {
  const documentId = normalizeDocumentId(input.documentId);

  if (input.documentTitle) {
    return `No document found with the title "${input.documentTitle}".`;
  }

  if (documentId) {
    return `No document found for ${documentId}.`;
  }

  if (input.documentsCount === 0) {
    return "There is no saved document yet. Create one before editing or updating it.";
  }

  return "More than one saved document exists. Pass a documentTitle so the tool can target the right artifact.";
}

export function findUltraChatbotAgentTargetDocument(input: {
  documentId?: string;
  documentTitle?: string;
  latestDocuments: UltraChatbotAgentDocumentRecord[];
}) {
  const documentId = normalizeDocumentId(input.documentId);
  const { documentTitle, latestDocuments } = input;

  if (documentId) {
    const matchedById =
      latestDocuments.find((document) => document.id === documentId) ?? null;

    if (matchedById) {
      return matchedById;
    }
  }

  if (documentTitle) {
    return (
      latestDocuments.find(
        (document) =>
          normalizeTitle(document.title) === normalizeTitle(documentTitle)
      ) ?? null
    );
  }

  if (latestDocuments.length === 1) {
    return latestDocuments[0];
  }

  return null;
}
