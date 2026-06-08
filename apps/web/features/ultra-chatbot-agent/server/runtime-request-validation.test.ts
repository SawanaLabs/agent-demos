import { beforeEach, expect, it } from "vitest";
import {
  createUserMessage,
  createUserMessageWithFile,
  importRuntimeModule,
  resetUltraChatbotAgentRuntimeMocks,
  storeState,
} from "./runtime-test-fixtures";

beforeEach(resetUltraChatbotAgentRuntimeMocks);

it("reports setup requirements when gateway, database, or redis config is missing", async () => {
  const { getUltraChatbotAgentRuntimeState } = await importRuntimeModule();

  expect(getUltraChatbotAgentRuntimeState({})).toMatchObject({
    isChatAvailable: false,
    setupMessage: expect.stringContaining("AI_GATEWAY_API_KEY"),
    statusLabel: "Setup required",
  });
});

it("rejects unknown selected models before touching persistence", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: createUserMessage(),
        selectedChatModel: "anthropic/claude-sonnet-4",
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

  expect(response.status).toBe(400);
  expect(storeState.saveIncomingUserMessage).not.toHaveBeenCalled();
});

it("rejects unsupported attachments before touching persistence", async () => {
  const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

  const response = await handleUltraChatbotAgentChatRequest(
    new Request("http://localhost/api/demos/ultra-chatbot-agent", {
      body: JSON.stringify({
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        message: createUserMessageWithFile("application/zip"),
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

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Only PDF, JPEG, and PNG attachments are supported.",
  });
  expect(storeState.saveIncomingUserMessage).not.toHaveBeenCalled();
});
