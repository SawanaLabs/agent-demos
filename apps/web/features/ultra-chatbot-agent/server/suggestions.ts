import { createUltraChatbotAgentDocumentStore } from "./document-store";
import { createUltraChatbotAgentSuggestionStore } from "./suggestion-store";

function getUltraChatbotAgentSuggestionNotFoundError(documentId: string) {
  return `No ultra-chatbot-agent document found for ${documentId}.`;
}

export async function handleUltraChatbotAgentSuggestionsRequest(
  request: Request,
  viewer: { visitorId: string }
) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const documentId = url.searchParams.get("id");

  if (!chatId) {
    return Response.json(
      { error: 'Expected the "chatId" search parameter.' },
      { status: 400 }
    );
  }

  if (!documentId) {
    return Response.json(
      { error: 'Expected the "id" search parameter.' },
      { status: 400 }
    );
  }

  const latestDocument =
    await createUltraChatbotAgentDocumentStore().loadLatestDocument({
      chatId,
      documentId,
      visitorId: viewer.visitorId,
    });

  if (!latestDocument) {
    return Response.json(
      { error: getUltraChatbotAgentSuggestionNotFoundError(documentId) },
      { status: 404 }
    );
  }

  return Response.json(
    await createUltraChatbotAgentSuggestionStore().listSuggestionsForDocumentVersion(
      {
        documentCreatedAt: latestDocument.createdAt,
        documentId,
        visitorId: viewer.visitorId,
      }
    )
  );
}
