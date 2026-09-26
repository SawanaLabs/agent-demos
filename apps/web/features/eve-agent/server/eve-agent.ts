/**
 * PROVISIONAL adapter for Vercel's eve agent framework.
 *
 * The published package surface could not be verified when this slice was
 * authored, so every assumption below is asserted at runtime and fails with a
 * descriptive error instead of a silent fallback. If eve's real exports
 * differ, this file is the only module that should need changes; the thrown
 * EveSurfaceError names the exact unmet assumption.
 *
 * Assumptions (AI SDK conventions — the most likely shape for a Vercel
 * agent framework):
 *   1. The package exports an agent factory as Agent, createAgent, or Eve.
 *   2. The factory accepts { model, instructions | system, tools } where
 *      tools are AI SDK `tool()` definitions (both instruction keys are
 *      passed; strict frameworks should ignore the unused one).
 *   3. The agent exposes a run method (streamText, stream, run, or chat)
 *      that accepts { messages, abortSignal }.
 *   4. The run result is a Response or exposes toUIMessageStreamResponse().
 */

import type { EveAgentModule } from "./eve";

const AGENT_FACTORY_EXPORTS = ["Agent", "createAgent", "Eve"] as const;
const RUN_METHODS = ["streamText", "stream", "run", "chat"] as const;

export class EveSurfaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EveSurfaceError";
  }
}

export interface EveAgentFactoryConfig {
  instructions: string;
  model: unknown;
  system: string;
  tools: Record<string, unknown>;
}

export interface EveAgentHandle {
  agent: Record<string, unknown>;
  runMethod: (typeof RUN_METHODS)[number];
}

export interface EveRunInput {
  abortSignal?: AbortSignal;
  messages: unknown[];
}

export interface EveUiStreamResponseOptions {
  messageMetadata?: (input: {
    part: { finishReason?: string; totalUsage?: unknown; type: string };
  }) => unknown;
  onError?: (error: unknown) => string;
  originalMessages?: unknown;
  sendReasoning?: boolean;
  sendSources?: boolean;
}

type EveAgentFactory = (config: EveAgentFactoryConfig) => unknown;

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function resolveAgentFactory(eve: EveAgentModule): EveAgentFactory {
  for (const exportName of AGENT_FACTORY_EXPORTS) {
    const candidate = eve[exportName];

    if (typeof candidate === "function") {
      return candidate as EveAgentFactory;
    }
  }

  throw new EveSurfaceError(
    `Expected an agent factory export from the eve package (tried: ${AGENT_FACTORY_EXPORTS.join(
      ", "
    )}). Inspect the installed package's exports and update server/eve-agent.ts.`
  );
}

function instantiateAgent(
  factory: EveAgentFactory,
  config: EveAgentFactoryConfig
): Record<string, unknown> {
  try {
    const isClass = Function.prototype.toString
      .call(factory)
      .startsWith("class");
    const agent = isClass
      ? Reflect.construct(
          factory as unknown as new (
            config: EveAgentFactoryConfig
          ) => unknown,
          [config]
        )
      : factory(config);

    if (agent && typeof agent === "object") {
      return agent as Record<string, unknown>;
    }
  } catch (error) {
    throw new EveSurfaceError(
      `The eve agent factory rejected the { model, instructions, system, tools } config: ${describeError(error)}`
    );
  }

  throw new EveSurfaceError(
    "The eve agent factory did not return an agent object."
  );
}

export function createEveAgentHandle(
  eve: EveAgentModule,
  config: EveAgentFactoryConfig
): EveAgentHandle {
  const agent = instantiateAgent(resolveAgentFactory(eve), config);
  const runMethod = RUN_METHODS.find(
    (method) => typeof agent[method] === "function"
  );

  if (!runMethod) {
    throw new EveSurfaceError(
      `The eve agent exposes none of the expected run methods (tried: ${RUN_METHODS.join(
        ", "
      )}). Update server/eve-agent.ts for the real invocation surface.`
    );
  }

  return { agent, runMethod };
}

export async function runEveAgentTurn(
  handle: EveAgentHandle,
  input: EveRunInput
): Promise<unknown> {
  const run = handle.agent[handle.runMethod];

  try {
    return await (run as (input: EveRunInput) => unknown).call(handle.agent, {
      abortSignal: input.abortSignal,
      messages: input.messages,
    });
  } catch (error) {
    throw new EveSurfaceError(
      `The eve agent run method "${handle.runMethod}" rejected the { messages, abortSignal } input: ${describeError(error)}`
    );
  }
}

export function toEveUiMessageStreamResponse(
  result: unknown,
  options: EveUiStreamResponseOptions
): Response {
  const toResponse = (result as { toUIMessageStreamResponse?: unknown })
    ?.toUIMessageStreamResponse;

  if (typeof toResponse === "function") {
    return (
      toResponse as (options: EveUiStreamResponseOptions) => Response
    ).call(result, options);
  }

  if (result instanceof Response) {
    return result;
  }

  throw new EveSurfaceError(
    "The eve run result is not a Response and does not expose toUIMessageStreamResponse(). Adapt the stream conversion in server/eve-agent.ts."
  );
}
