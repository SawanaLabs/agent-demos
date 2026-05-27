import { validateUIMessages, type UIMessage } from "ai";

export const invalidMessagesError =
  'Expected a JSON body with a "messages" array.';
export const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
export const malformedJsonError = "Expected a valid JSON request body.";
export const supportedAudiences = ["engineers", "buyers", "support"] as const;

export type StreamingAudience = (typeof supportedAudiences)[number];

interface StreamingChatShellRequestBody {
  audience?: string;
  messages?: UIMessage[];
}

export async function readStreamingChatShellRequest(body: unknown): Promise<{
  audience: StreamingAudience;
  messages: UIMessage[];
}> {
  const { audience, messages } = (body ?? {}) as StreamingChatShellRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return {
      audience:
        supportedAudiences.find((candidate) => candidate === audience) ??
        "engineers",
      messages: await validateUIMessages({ messages }),
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}
