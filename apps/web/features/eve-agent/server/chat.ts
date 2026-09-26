import { convertToModelMessages, type UIMessage } from "ai";
import {
  createEveAgentGateway,
  type EveAgentEnv,
  getEveAgentConfig,
  getEveAgentEnv,
} from "./env";
import { loadEveModule } from "./eve";
import {
  createEveAgentHandle,
  runEveAgentTurn,
  toEveUiMessageStreamResponse,
} from "./eve-agent";
import { createEveAgentTools } from "./tools";

const systemPrompt = [
  "You are Eve Agent, a compact service-triage assistant built on Vercel's eve agent framework.",
  "Use lookup_service to resolve a service's owning team, tier, and home region.",
  "Use check_region to read the current health status of a region.",
  "When asked whether a service is affected by an incident, look up the service first, check its home region next, then answer from both results.",
  "Keep answers concise and name the evidence used.",
].join(" ");

export async function streamEveAgent(
  messages: UIMessage[],
  env: EveAgentEnv = getEveAgentEnv(),
  abortSignal?: AbortSignal
) {
  const config = getEveAgentConfig(env);
  const gateway = createEveAgentGateway(env);
  const eve = await loadEveModule();
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const handle = createEveAgentHandle(eve, {
    instructions: systemPrompt,
    model: gateway(config.chatModel),
    system: systemPrompt,
    tools: createEveAgentTools(),
  });
  const result = await runEveAgentTurn(handle, {
    abortSignal,
    messages: await convertToModelMessages(messages),
  });

  return toEveUiMessageStreamResponse(result, {
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return {
          model: config.chatModel,
          runId,
          startedAt,
        };
      }

      if (part.type === "finish") {
        return {
          finishReason: part.finishReason,
          finishedAt: Date.now(),
          model: config.chatModel,
          runId,
          startedAt,
          totalUsage: part.totalUsage,
        };
      }

      return;
    },
    onError: () => "Eve Agent could not complete this turn.",
    originalMessages: messages,
    sendReasoning: true,
    sendSources: true,
  });
}
