import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";

import type { MultiAgentExplorerUIMessage, OrchestrationPhase } from "../types";
import {
  createMultiAgentExplorerGateway,
  getMultiAgentExplorerConfig,
  getMultiAgentExplorerEnv,
  type MultiAgentExplorerEnv,
} from "./env";
import {
  buildSynthesisPrompt,
  getLeadSynthesisSystemPrompt,
  planResearchTopics,
  runExplorerSubagent,
} from "./orchestrator";

const missingQuestionError =
  "Multi-Agent Explorer expects the latest user message to contain a research question.";

function latestUserQuestion(messages: MultiAgentExplorerUIMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const question = lastUserMessage?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  if (!question) {
    throw new Error(missingQuestionError);
  }

  return question;
}

/**
 * Runs the lead → fan-out → collect → synthesize loop over one UI message
 * stream. Planning and explorer lifecycles are emitted as `data-*` parts;
 * the lead's final report is merged in as regular streamed text.
 */
export async function streamMultiAgentExplorer(
  messages: MultiAgentExplorerUIMessage[],
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv(),
  abortSignal?: AbortSignal
) {
  const { chatModel } = getMultiAgentExplorerConfig(env);
  const gateway = createMultiAgentExplorerGateway(env);
  const model = gateway(chatModel);
  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  const stream = createUIMessageStream<MultiAgentExplorerUIMessage>({
    execute: async ({ writer }) => {
      const writePhase = (phase: OrchestrationPhase, detail: string) =>
        writer.write({
          data: { detail, phase },
          id: "orchestration",
          type: "data-orchestration-phase",
        });

      writePhase(
        "planning",
        "Lead agent is decomposing the question into explorer subtopics."
      );
      const question = latestUserQuestion(messages);
      const plan = await planResearchTopics({ abortSignal, model, question });
      writer.write({
        data: plan,
        id: "research-plan",
        type: "data-research-plan",
      });

      writePhase(
        "exploring",
        `Fan-out: ${plan.subtopics.length} explorer subagents are researching in parallel.`
      );
      const explorerRuns = await Promise.all(
        plan.subtopics.map((subtopic, index) =>
          runExplorerSubagent({
            abortSignal,
            angle: subtopic.angle,
            emit: (snapshot) =>
              writer.write({
                data: snapshot,
                id: snapshot.explorerId,
                type: "data-explorer",
              }),
            explorerId: `explorer-${index + 1}`,
            model,
            subtopic: subtopic.title,
          })
        )
      );

      writePhase(
        "synthesizing",
        "Lead agent is synthesizing explorer findings into the final report."
      );
      const synthesis = streamText({
        abortSignal,
        experimental_telemetry: {
          functionId: "multi-agent-explorer.synthesize",
          isEnabled: true,
          metadata: {
            demo: "multi-agent-explorer",
            explorerCount: explorerRuns.length,
            runId,
          },
        },
        maxOutputTokens: 2200,
        messages: [
          {
            content: buildSynthesisPrompt({
              question,
              runs: explorerRuns,
            }),
            role: "user",
          },
        ],
        model,
        system: getLeadSynthesisSystemPrompt(),
      });

      writer.merge(
        synthesis.toUIMessageStream<MultiAgentExplorerUIMessage>({
          messageMetadata: ({ part }) => {
            if (part.type === "start") {
              return {
                explorerCount: explorerRuns.length,
                model: chatModel,
                runId,
                startedAt,
              };
            }

            if (part.type === "finish") {
              return {
                explorerCount: explorerRuns.length,
                finishedAt: Date.now(),
                finishReason: part.finishReason,
                model: chatModel,
                runId,
                startedAt,
                totalUsage: part.totalUsage,
              };
            }

            return;
          },
          sendReasoning: true,
        })
      );

      await synthesis.text;
      writePhase("done", "Report complete.");
    },
    onError: () => "Multi-Agent Explorer could not complete this turn.",
    originalMessages: messages,
  });

  return createUIMessageStreamResponse({ stream });
}
