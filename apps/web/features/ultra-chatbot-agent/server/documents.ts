import { z } from "zod";
import {
  createUltraChatbotAgentDocumentStore,
  type UltraChatbotAgentDocumentRecord,
} from "./document-store";

const documentBodySchema = z.object({
  content: z.string(),
  isManualEdit: z.boolean().optional(),
  kind: z.enum(["code", "image", "sheet", "text"]),
  title: z.string().trim().min(1),
});

function getUltraChatbotAgentDocumentNotFoundError(documentId: string) {
  return `No ultra-chatbot-agent document found for ${documentId}.`;
}

export async function handleUltraChatbotAgentDocumentRequest(
  request: Request,
  viewer: { visitorId: string }
) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const documentId = url.searchParams.get("id");
  const store = createUltraChatbotAgentDocumentStore();

  if (!chatId) {
    return Response.json(
      { error: 'Expected the "chatId" search parameter.' },
      { status: 400 }
    );
  }

  if (request.method === "GET") {
    if (!documentId) {
      return Response.json(
        await store.listLatestDocumentsForChat({
          chatId,
          limit: 12,
          visitorId: viewer.visitorId,
        })
      );
    }

    const documents = await store.listDocumentVersions({
      chatId,
      documentId,
      visitorId: viewer.visitorId,
    });

    if (documents.length === 0) {
      return Response.json(
        { error: getUltraChatbotAgentDocumentNotFoundError(documentId) },
        { status: 404 }
      );
    }

    return Response.json(documents);
  }

  if (request.method === "POST") {
    if (!documentId) {
      return Response.json(
        { error: 'Expected the "id" search parameter.' },
        { status: 400 }
      );
    }

    let body: z.infer<typeof documentBodySchema>;

    try {
      body = documentBodySchema.parse(await request.json());
    } catch {
      return Response.json(
        { error: "Expected a valid document payload." },
        { status: 400 }
      );
    }

    const existingDocuments = await store.listDocumentVersions({
      chatId,
      documentId,
      visitorId: viewer.visitorId,
    });
    const latestDocument = existingDocuments[0];

    if (body.isManualEdit && !latestDocument) {
      return Response.json(
        { error: getUltraChatbotAgentDocumentNotFoundError(documentId) },
        { status: 404 }
      );
    }

    const savedDocument = await store.saveDocument({
      chatId,
      content: body.content,
      documentId,
      kind: latestDocument?.kind ?? body.kind,
      title: latestDocument?.title ?? body.title,
      visitorId: viewer.visitorId,
    });

    return Response.json(savedDocument);
  }

  if (request.method === "DELETE") {
    if (!documentId) {
      return Response.json(
        { error: 'Expected the "id" search parameter.' },
        { status: 400 }
      );
    }

    const rawTimestamp = url.searchParams.get("timestamp");

    if (!rawTimestamp) {
      return Response.json(
        { error: 'Expected the "timestamp" search parameter.' },
        { status: 400 }
      );
    }

    const timestamp = new Date(rawTimestamp);

    if (Number.isNaN(timestamp.valueOf())) {
      return Response.json(
        { error: 'Expected a valid "timestamp" value.' },
        { status: 400 }
      );
    }

    const existingDocuments = await store.listDocumentVersions({
      chatId,
      documentId,
      visitorId: viewer.visitorId,
    });

    if (existingDocuments.length === 0) {
      return Response.json(
        { error: getUltraChatbotAgentDocumentNotFoundError(documentId) },
        { status: 404 }
      );
    }

    return Response.json(
      await store.deleteDocumentVersionsAfterTimestamp({
        chatId,
        documentId,
        timestamp,
        visitorId: viewer.visitorId,
      })
    );
  }

  return Response.json({ error: "Method not allowed." }, { status: 405 });
}
