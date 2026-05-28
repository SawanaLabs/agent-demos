"use client";

import type { UltraChatbotAgentDocumentRecord } from "../server/document-store";
import type { UltraChatbotAgentSuggestionRecord } from "../server/suggestion-store";

export function formatUltraChatbotAgentDocumentTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function buildUltraChatbotAgentDocumentSearchParams(input: {
  chatId: string;
  documentId?: string;
  timestamp?: string;
}) {
  const searchParams = new URLSearchParams({
    chatId: input.chatId,
  });

  if (input.documentId) {
    searchParams.set("id", input.documentId);
  }

  if (input.timestamp) {
    searchParams.set("timestamp", input.timestamp);
  }

  return searchParams;
}

export async function loadUltraChatbotAgentDocuments(chatId: string) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId,
      }
    ).toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load thread documents.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord[];
}

export async function loadUltraChatbotAgentLatestDocument(
  chatId: string,
  documentId: string
) {
  const documents = await loadUltraChatbotAgentDocumentVersions(
    chatId,
    documentId
  );

  return documents[0] ?? null;
}

export async function loadUltraChatbotAgentDocumentVersions(
  chatId: string,
  documentId: string
) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId,
        documentId,
      }
    ).toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load document versions.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord[];
}

export async function loadUltraChatbotAgentDocumentSuggestions(
  chatId: string,
  documentId: string
) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/suggestions?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId,
        documentId,
      }
    ).toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load document suggestions.");
  }

  return (await response.json()) as UltraChatbotAgentSuggestionRecord[];
}

export async function createUltraChatbotAgentScratchDocument(chatId: string) {
  const documentId = crypto.randomUUID();
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId,
        documentId,
      }
    ).toString()}`,
    {
      body: JSON.stringify({
        content: "",
        kind: "text",
        title: "Scratch note",
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create the scratch document.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord;
}

export async function saveUltraChatbotAgentDocumentDraft(input: {
  chatId: string;
  content: string;
  documentId: string;
  title: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId: input.chatId,
        documentId: input.documentId,
      }
    ).toString()}`,
    {
      body: JSON.stringify({
        content: input.content,
        isManualEdit: true,
        kind: "text",
        title: input.title,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save the document draft.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord;
}

export async function restoreUltraChatbotAgentDocumentVersion(input: {
  chatId: string;
  createdAt: string;
  documentId: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?${buildUltraChatbotAgentDocumentSearchParams(
      {
        chatId: input.chatId,
        documentId: input.documentId,
        timestamp: input.createdAt,
      }
    ).toString()}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to restore the selected document version.");
  }
}
