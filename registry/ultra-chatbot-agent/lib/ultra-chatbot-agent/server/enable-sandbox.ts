import { tool } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentChatStore } from "./chat-store";

const sandboxEnablementInputSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1)
    .describe("Why sandbox access is required for the current request."),
  requestedToolFamilies: z
    .array(z.string().trim().min(1))
    .min(1)
    .describe("The higher-risk capability families that require sandbox."),
});

export function createUltraChatbotAgentEnableSandboxTool(input: {
  chatId: string;
  visitorId: string;
}) {
  return tool({
    description:
      "Request human approval to enable sandbox-backed capabilities for this chat before using execution-heavy tools.",
    inputSchema: sandboxEnablementInputSchema,
    needsApproval: true,
    execute: async ({ reason, requestedToolFamilies }) => {
      const capabilities =
        await createUltraChatbotAgentChatStore().setChatCapabilities({
          capabilities: {
            sandboxEnabled: true,
          },
          chatId: input.chatId,
          visitorId: input.visitorId,
        });

      return {
        capabilities,
        reason,
        requestedToolFamilies,
        sandboxEnabled: capabilities.sandboxEnabled,
      };
    },
  });
}
