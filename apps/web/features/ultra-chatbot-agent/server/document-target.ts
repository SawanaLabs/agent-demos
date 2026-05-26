import type { UltraChatbotAgentDocumentRecord } from "./document-store";

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getUltraChatbotAgentDocumentLookupError(input: {
  documentId?: string;
  documentTitle?: string;
  documentsCount: number;
}) {
  if (input.documentId) {
    return `No document found for ${input.documentId}.`;
  }

  if (input.documentTitle) {
    return `No document found with the title "${input.documentTitle}".`;
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
  const { documentId, documentTitle, latestDocuments } = input;

  if (documentId) {
    return latestDocuments.find((document) => document.id === documentId) ?? null;
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
