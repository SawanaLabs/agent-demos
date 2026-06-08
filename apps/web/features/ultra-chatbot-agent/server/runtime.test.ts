import type { UIMessage } from "ai";
import { beforeEach, expect, it } from "vitest";
import {
  aiMockState,
  createAssistantMessage,
  createAssistantSearchMessage,
  createDocumentToolState,
  createUserMessage,
  editDocumentToolState,
  enableSandboxToolState,
  getWeatherToolState,
  importRuntimeModule,
  projectDocsMcpToolboxState,
  requestSuggestionsToolState,
  researchReportToolState,
  resetUltraChatbotAgentRuntimeMocks,
  resumableStreamState,
  sandboxToolboxState,
  storeState,
  ultraMessageIdPattern,
  updateDocumentToolState,
  webSearchToolState,
} from "./runtime-test-fixtures";

beforeEach(resetUltraChatbotAgentRuntimeMocks);

function expectRouteBackedAgentConfiguration() {
  expect(aiMockState.ToolLoopAgent).toHaveBeenCalledWith(
    expect.objectContaining({
      instructions: expect.any(String),
      model: expect.anything(),
      providerOptions: {
        openai: {
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          textVerbosity: "low",
        },
      },
      stopWhen: expect.any(Function),
      tools: expect.objectContaining({
        createDocument: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        createResearchReport: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        editDocument: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        enableSandbox: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        getWeather: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        project__list_demos: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        project__read_demo_docs: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        project__search_project_docs: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        requestSuggestions: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        searchKnowledgeBase: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        updateDocument: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        web_search: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
      }),
    })
  );
  expect(aiMockState.stream).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: expect.any(Array),
    })
  );
}

function expectRouteBackedToolFactoriesCalled() {
  const toolContext = {
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    visitorId: "visitor-123",
  };

  expect(
    createDocumentToolState.createUltraChatbotAgentCreateDocumentTool
  ).toHaveBeenCalledWith(toolContext);
  expect(
    editDocumentToolState.createUltraChatbotAgentEditDocumentTool
  ).toHaveBeenCalledWith(toolContext);
  expect(
    enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool
  ).toHaveBeenCalledWith(toolContext);
  expect(
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool
  ).toHaveBeenCalledWith();
  expect(
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool
  ).toHaveBeenCalledWith({
    ...toolContext,
    model: expect.anything(),
  });
  expect(
    researchReportToolState.createUltraChatbotAgentResearchReportTool
  ).toHaveBeenCalledWith({
    model: expect.anything(),
  });
  expect(
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool
  ).toHaveBeenCalledWith({
    ...toolContext,
    model: expect.anything(),
  });
  expect(
    webSearchToolState.createUltraChatbotAgentWebSearchTool
  ).toHaveBeenCalledWith({
    model: expect.anything(),
    webSearchTool: expect.anything(),
  });
  expect(
    projectDocsMcpToolboxState.createUltraChatbotAgentProjectDocsMcpToolbox
  ).toHaveBeenCalledWith({
    origin: "http://localhost",
  });
  expect(
    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox
  ).not.toHaveBeenCalled();
}

async function finishRouteBackedStream(userMessage: UIMessage) {
  expect(aiMockState.responseOptions?.originalMessages).toEqual([userMessage]);
  expect(aiMockState.responseOptions?.sendReasoning).toBe(true);
  expect(aiMockState.responseOptions?.sendSources).toBe(true);
  expect(aiMockState.responseOptions?.generateMessageId?.()).toMatch(
    ultraMessageIdPattern
  );

  await aiMockState.responseOptions?.consumeSseStream?.({
    stream: new ReadableStream(),
  });

  expect(resumableStreamState.createNewResumableStream).toHaveBeenCalledTimes(
    1
  );
  expect(storeState.setActiveStream).toHaveBeenCalledWith({
    activeStreamId: expect.any(String),
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    visitorId: "visitor-123",
  });

  await aiMockState.responseOptions?.onFinish?.({
    isAborted: false,
    messages: [
      userMessage,
      {
        id: "assistant-1",
        parts: [
          {
            text: "An artifact panel lets the document evolve outside the chat scrollback.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ],
  });

  expect(storeState.saveFinishedMessages).toHaveBeenCalledWith({
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    messages: expect.arrayContaining([
      expect.objectContaining({ id: "assistant-1", role: "assistant" }),
    ]),
    visitorId: "visitor-123",
  });
  expect(projectDocsMcpToolboxState.close).toHaveBeenCalledTimes(1);
}

it("persists route-backed turns with selected model and visibility", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
  const userMessage = createUserMessage();

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: userMessage,
        selectedChatModel: "openai/gpt-5-mini",
        selectedVisibilityType: "private",
      }),
      method: "POST",
    }),
    { visitorId: "visitor-123" },
    {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    }
  );

  expect(response.status).toBe(200);
  expect(storeState.saveIncomingUserMessage).toHaveBeenCalledWith({
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    message: userMessage,
    selectedChatModel: "openai/gpt-5-mini",
    selectedVisibilityType: "private",
    visitorId: "visitor-123",
  });
  expectRouteBackedAgentConfiguration();
  expectRouteBackedToolFactoriesCalled();
  await finishRouteBackedStream(userMessage);
});

it("projects replay history before sending multi-turn search chats to the model", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
  const followUpMessage: UIMessage = {
    id: "user-2",
    parts: [{ text: "Compare it with BYD.", type: "text" }],
    role: "user",
  };

  storeState.loadChatSession.mockResolvedValue({
    chat: {
      activeStreamId: null,
      capabilities: {
        sandboxEnabled: false,
      },
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      id: "7dad003a-e507-448b-ac02-10937a0290da",
      selectedChatModel: "openai/gpt-4.1-mini",
      title: "Tesla research",
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
      visibility: "private",
      visitorId: "visitor-123",
    },
    messages: [createUserMessage(), createAssistantSearchMessage()],
  });

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: followUpMessage,
        selectedChatModel: "openai/gpt-4.1-mini",
        selectedVisibilityType: "private",
      }),
      method: "POST",
    }),
    { visitorId: "visitor-123" },
    {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    }
  );

  expect(response.status).toBe(200);
  expect(aiMockState.stream).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "assistant" }),
      ]),
    })
  );

  const runtimeInput = aiMockState.stream.mock.calls.at(-1)?.[0];
  const assistantMessage = runtimeInput?.messages.find(
    (message: { role: string }) => message.role === "assistant"
  );

  expect(assistantMessage).toBeDefined();
  expect(JSON.stringify(assistantMessage)).toContain(
    "Tesla is a public company focused on EVs and energy."
  );
  expect(JSON.stringify(assistantMessage)).not.toContain("tool-web_search");
  expect(JSON.stringify(assistantMessage)).not.toContain("source-url");
});

it("replays a persisted user turn when regenerating a failed assistant response", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
  const userMessage = createUserMessage();
  const assistantMessage = createAssistantMessage();

  storeState.loadChatSession.mockResolvedValue({
    chat: {
      activeStreamId: null,
      capabilities: {
        sandboxEnabled: false,
      },
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      id: "7dad003a-e507-448b-ac02-10937a0290da",
      selectedChatModel: "openai/gpt-4.1-mini",
      title: "Retry test",
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
      visibility: "private",
      visitorId: "visitor-123",
    },
    messages: [userMessage, assistantMessage],
  });

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: userMessage,
        messageId: assistantMessage.id,
        selectedChatModel: "openai/gpt-4.1-mini",
        selectedVisibilityType: "private",
        trigger: "regenerate-message",
      }),
      method: "POST",
    }),
    { visitorId: "visitor-123" },
    {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    }
  );

  expect(response.status).toBe(200);
  expect(storeState.deleteMessagesAfterMessage).toHaveBeenCalledWith({
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    messageId: userMessage.id,
    visitorId: "visitor-123",
  });
  expect(aiMockState.responseOptions?.originalMessages).toEqual([userMessage]);
});

it("exposes sandbox-backed tools after sandbox is already enabled", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

  storeState.loadChatSession.mockResolvedValue({
    chat: {
      activeStreamId: null,
      capabilities: {
        sandboxEnabled: true,
      },
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      id: "7dad003a-e507-448b-ac02-10937a0290da",
      selectedChatModel: "openai/gpt-4.1-mini",
      title: "Sandbox chat",
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
      visibility: "private",
      visitorId: "visitor-123",
    },
    messages: [createUserMessage()],
  });

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: createUserMessage(),
        selectedChatModel: "openai/gpt-4.1-mini",
        selectedVisibilityType: "private",
      }),
      method: "POST",
    }),
    { visitorId: "visitor-123" },
    {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    }
  );

  expect(response.status).toBe(200);
  const runtimeSettings = aiMockState.ToolLoopAgent.mock.calls.at(-1)?.[0] as {
    tools: Record<string, unknown>;
  };

  expect(runtimeSettings.tools.enableSandbox).toBeUndefined();
  expect(runtimeSettings.tools).toEqual(
    expect.objectContaining({
      bash: expect.objectContaining({
        description: expect.any(String),
        execute: expect.any(Function),
      }),
      readFile: expect.objectContaining({
        description: expect.any(String),
        execute: expect.any(Function),
      }),
      skill: expect.objectContaining({
        description: expect.any(String),
        execute: expect.any(Function),
      }),
      writeFile: expect.objectContaining({
        description: expect.any(String),
        execute: expect.any(Function),
      }),
    })
  );
  expect(
    enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool
  ).not.toHaveBeenCalled();
  expect(
    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox
  ).toHaveBeenCalledWith({
    chatId: "7dad003a-e507-448b-ac02-10937a0290da",
    env: {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    },
    visitorId: "visitor-123",
  });
});

it("returns a concrete setup error when enabled sandbox tools cannot be prepared", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

  sandboxToolboxState.createUltraChatbotAgentSandboxToolbox.mockRejectedValue(
    new Error(
      "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio."
    )
  );
  storeState.loadChatSession.mockResolvedValue({
    chat: {
      activeStreamId: null,
      capabilities: {
        sandboxEnabled: true,
      },
      createdAt: new Date("2026-05-27T00:00:00.000Z"),
      id: "7dad003a-e507-448b-ac02-10937a0290da",
      selectedChatModel: "openai/gpt-4.1-mini",
      title: "Sandbox chat",
      updatedAt: new Date("2026-05-27T00:00:00.000Z"),
      visibility: "private",
      visitorId: "visitor-123",
    },
    messages: [createUserMessage()],
  });

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: createUserMessage(),
        selectedChatModel: "openai/gpt-4.1-mini",
        selectedVisibilityType: "private",
      }),
      method: "POST",
    }),
    { visitorId: "visitor-123" },
    {
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      REDIS_URL: "redis://localhost:6379",
    }
  );

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error:
      "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio.",
  });
  expect(aiMockState.ToolLoopAgent).not.toHaveBeenCalled();
  expect(projectDocsMcpToolboxState.close).toHaveBeenCalledTimes(1);
});
