import { describe, expect, it } from "vitest";

import {
  findPendingAskUserPart,
  projectMinimalChatAgentMessage,
} from "./message-parts";

describe("minimal chat agent message projection", () => {
  it("separates text, sources, and all three tool channels", () => {
    const message = {
      id: "assistant-1",
      parts: [
        { text: "Here is what I found.", type: "text" as const },
        {
          text: "I should confirm the user's deployment preference.",
          type: "reasoning" as const,
        },
        {
          input: { repo: "shadcn-ui/chatbot-template" },
          output: {
            description: "A minimal chatbot template.",
            forks: 42,
            language: "TypeScript",
            openIssues: 3,
            repo: "shadcn-ui/chatbot-template",
            stars: 1234,
            url: "https://github.com/shadcn-ui/chatbot-template",
          },
          state: "output-available" as const,
          toolCallId: "call-github",
          type: "tool-github_repo" as const,
        },
        {
          input: { query: "AI chatbot templates 2026" },
          output: { type: "computer_initialize_state" },
          state: "output-available" as const,
          toolCallId: "call-search",
          type: "tool-web_search" as const,
        },
        {
          input: {
            questions: [
              {
                choices: ["Prototype", "Production", "Learning"],
                question: "What is the primary goal?",
              },
            ],
          },
          output: [
            { answer: "Production", question: "What is the primary goal?" },
          ],
          state: "output-available" as const,
          toolCallId: "call-ask",
          type: "tool-ask_user" as const,
        },
        {
          providerMetadata: undefined,
          sourceId: "source-1",
          title: "AI SDK",
          type: "source-url" as const,
          url: "https://ai-sdk.dev",
        },
        {
          providerMetadata: undefined,
          sourceId: "source-duplicate",
          title: "AI SDK duplicate",
          type: "source-url" as const,
          url: "https://ai-sdk.dev",
        },
      ],
      role: "assistant" as const,
    };

    expect(projectMinimalChatAgentMessage(message)).toMatchObject({
      askUserParts: [{ toolCallId: "call-ask" }],
      githubRepoParts: [{ toolCallId: "call-github" }],
      hasReasoningSignal: true,
      reasoningText: "I should confirm the user's deployment preference.",
      sourceUrlParts: [{ title: "AI SDK", url: "https://ai-sdk.dev" }],
      text: "Here is what I found.",
      webSearchParts: [{ toolCallId: "call-search" }],
    });
  });

  it("returns the latest unanswered ask-user call", () => {
    const messages = [
      {
        id: "assistant-1",
        parts: [
          {
            input: {
              questions: [
                {
                  choices: ["Prototype", "Production", "Learning"],
                  question: "What is the primary goal?",
                },
              ],
            },
            state: "input-available" as const,
            toolCallId: "call-ask",
            type: "tool-ask_user" as const,
          },
        ],
        role: "assistant" as const,
      },
    ];

    expect(findPendingAskUserPart(messages)).toMatchObject({
      toolCallId: "call-ask",
    });
  });
});
