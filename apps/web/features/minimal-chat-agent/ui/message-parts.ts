import {
  type AskUserInput,
  type AskUserOutput,
  askUserInputSchema,
  askUserOutputSchema,
  type GithubRepoInput,
  type GithubRepoOutput,
  githubRepoInputSchema,
  githubRepoOutputSchema,
} from "../server/tools";
import type { MinimalChatAgentUIMessage } from "../types";

type MessagePart = MinimalChatAgentUIMessage["parts"][number];

export interface ProjectedAskUserPart {
  input: AskUserInput;
  output?: AskUserOutput;
  state: string;
  toolCallId: string;
  type: "tool-ask_user";
}

export interface ProjectedGithubRepoPart {
  input: GithubRepoInput;
  output?: GithubRepoOutput;
  state: string;
  toolCallId: string;
  type: "tool-github_repo";
}

export interface ProjectedWebSearchPart {
  input: unknown;
  output?: unknown;
  state: string;
  toolCallId: string;
  type: "tool-web_search";
}

export interface ProjectedSourceUrlPart {
  sourceId: string;
  title?: string;
  type: "source-url";
  url: string;
}

function getText(part: MessagePart) {
  return part.type === "text" && part.text.trim().length > 0
    ? part.text.trim()
    : null;
}

function getReasoningText(part: MessagePart) {
  return part.type === "reasoning" ? part.text.trim() : null;
}

function projectAskUserPart(part: MessagePart): ProjectedAskUserPart | null {
  if (part.type !== "tool-ask_user") {
    return null;
  }

  const parsedInput = askUserInputSchema.safeParse(part.input);

  if (!parsedInput.success) {
    return null;
  }

  const parsedOutput =
    "output" in part ? askUserOutputSchema.safeParse(part.output) : null;

  return {
    input: parsedInput.data,
    output: parsedOutput?.success ? parsedOutput.data : undefined,
    state: part.state,
    toolCallId: part.toolCallId,
    type: "tool-ask_user",
  };
}

function projectGithubRepoPart(
  part: MessagePart
): ProjectedGithubRepoPart | null {
  if (part.type !== "tool-github_repo") {
    return null;
  }

  const parsedInput = githubRepoInputSchema.safeParse(part.input);

  if (!parsedInput.success) {
    return null;
  }

  const parsedOutput =
    "output" in part ? githubRepoOutputSchema.safeParse(part.output) : null;

  return {
    input: parsedInput.data,
    output: parsedOutput?.success ? parsedOutput.data : undefined,
    state: part.state,
    toolCallId: part.toolCallId,
    type: "tool-github_repo",
  };
}

function projectWebSearchPart(
  part: MessagePart
): ProjectedWebSearchPart | null {
  if (part.type !== "tool-web_search") {
    return null;
  }

  return {
    input: part.input,
    output: "output" in part ? part.output : undefined,
    state: part.state,
    toolCallId: part.toolCallId,
    type: "tool-web_search",
  };
}

function projectSourceUrlPart(
  part: MessagePart
): ProjectedSourceUrlPart | null {
  if (part.type !== "source-url") {
    return null;
  }

  return {
    sourceId: part.sourceId,
    title: part.title,
    type: "source-url",
    url: part.url,
  };
}

export function projectMinimalChatAgentMessage(
  message: MinimalChatAgentUIMessage
) {
  const textParts = message.parts.map(getText).filter((text) => text !== null);
  const reasoningParts = message.parts
    .map(getReasoningText)
    .filter((text) => text !== null);
  const askUserParts = message.parts
    .map(projectAskUserPart)
    .filter((part) => part !== null);
  const githubRepoParts = message.parts
    .map(projectGithubRepoPart)
    .filter((part) => part !== null);
  const webSearchParts = message.parts
    .map(projectWebSearchPart)
    .filter((part) => part !== null);
  const seenSourceUrls = new Set<string>();
  const sourceUrlParts = message.parts
    .map(projectSourceUrlPart)
    .filter((part): part is ProjectedSourceUrlPart => {
      if (!part || seenSourceUrls.has(part.url)) {
        return false;
      }

      seenSourceUrls.add(part.url);
      return true;
    });

  return {
    askUserParts,
    githubRepoParts,
    hasReasoningSignal: reasoningParts.length > 0,
    reasoningText: reasoningParts.join("\n\n"),
    sourceUrlParts,
    text: textParts.join("\n\n"),
    webSearchParts,
  };
}

export function findPendingAskUserPart(
  messages: MinimalChatAgentUIMessage[]
): ProjectedAskUserPart | null {
  for (
    let messageIndex = messages.length - 1;
    messageIndex >= 0;
    messageIndex--
  ) {
    const message = messages[messageIndex];

    if (!message) {
      continue;
    }

    for (
      let partIndex = message.parts.length - 1;
      partIndex >= 0;
      partIndex--
    ) {
      const part = message.parts[partIndex];
      const askUserPart = part ? projectAskUserPart(part) : null;

      if (askUserPart?.state === "input-available") {
        return askUserPart;
      }
    }
  }

  return null;
}
