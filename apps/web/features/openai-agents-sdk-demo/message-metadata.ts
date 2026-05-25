import type { UIMessage } from "ai";
import { z } from "zod";

export const openAiAgentsSdkDemoMessageMetadataSchema = z.object({
  usedGuardrailNames: z.array(z.string()).optional(),
  usedGuideIds: z.array(z.string()).optional(),
  usedToolNames: z.array(z.string()).optional(),
});

export type OpenAiAgentsSdkDemoMessageMetadata = z.infer<
  typeof openAiAgentsSdkDemoMessageMetadataSchema
>;

export type OpenAiAgentsSdkDemoMessage =
  UIMessage<OpenAiAgentsSdkDemoMessageMetadata>;
