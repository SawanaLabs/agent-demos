import type { UIMessage } from "ai";

export type RouteBackedChatRequestTrigger =
  | "regenerate-message"
  | "submit-message";

interface PrepareRouteBackedChatReplayInput {
  incomingMessage: UIMessage;
  messageId?: string;
  persistedMessages: UIMessage[];
  trigger?: RouteBackedChatRequestTrigger;
}

interface PreparedRouteBackedChatReplay {
  messages: UIMessage[];
  trimAfterMessageId: string | null;
}

function findReplayUserIndex(input: PrepareRouteBackedChatReplayInput) {
  if (input.trigger !== "regenerate-message") {
    return -1;
  }

  if (input.messageId) {
    const targetIndex = input.persistedMessages.findIndex(
      (message) => message.id === input.messageId
    );

    if (targetIndex >= 0) {
      if (input.persistedMessages[targetIndex]?.role === "user") {
        return targetIndex;
      }

      for (let index = targetIndex - 1; index >= 0; index -= 1) {
        if (input.persistedMessages[index]?.role === "user") {
          return index;
        }
      }
    }
  }

  return input.persistedMessages.findIndex(
    (message) => message.id === input.incomingMessage.id
  );
}

export function prepareRouteBackedChatReplay(
  input: PrepareRouteBackedChatReplayInput
): PreparedRouteBackedChatReplay {
  const replayUserIndex = findReplayUserIndex(input);

  if (replayUserIndex >= 0) {
    return {
      messages: input.persistedMessages
        .slice(0, replayUserIndex)
        .concat(input.incomingMessage),
      trimAfterMessageId: input.persistedMessages[replayUserIndex]?.id ?? null,
    };
  }

  const incomingMessageIndex = input.persistedMessages.findIndex(
    (message) => message.id === input.incomingMessage.id
  );

  if (incomingMessageIndex >= 0) {
    return {
      messages: input.persistedMessages
        .slice(0, incomingMessageIndex)
        .concat(input.incomingMessage),
      trimAfterMessageId: null,
    };
  }

  return {
    messages: [...input.persistedMessages, input.incomingMessage],
    trimAfterMessageId: null,
  };
}
