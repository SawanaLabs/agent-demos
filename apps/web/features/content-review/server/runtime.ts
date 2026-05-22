import { Output, streamText, type LanguageModelUsage } from "ai";

import {
  createAiGateway,
  getAiGatewayConfig,
  getAiGatewaySetupState,
} from "@/features/shared/ai-gateway/server/env";

import {
  contentReviewAcceptedMediaTypes,
  contentReviewRequestSchema,
  contentReviewResultSchema,
  type ContentReviewRequest,
} from "../schema";
import { startRecordedReviewRun } from "./recorded-review-run";

const invalidBodyError =
  'Expected a JSON body with a "prompt" string and an "attachments" array.';
const malformedJsonError = "Expected a valid JSON request body.";
const unsupportedMediaTypeError =
  "Only image attachments and PDF attachments are supported.";
const missingReviewInputError =
  "Provide review text, at least one attachment, or both.";

type DemoEnv = Record<string, string | undefined>;

const reviewSystemPrompt = [
  "You are the structured-output content review demo in a production-ready agent demos monorepo.",
  "Review the provided text, images, and PDFs for policy, trust, and brand-safety issues.",
  "Return only the structured content review result requested by the output schema.",
  "Use approved when the content is safe to publish as-is, needs_review when it needs human review or minor changes, and blocked when it should not be published.",
  "Ground every finding in provided evidence and keep summaries concise.",
].join(" ");

export interface ContentReviewRuntimeState {
  acceptedMediaTypes: string[];
  chatModel: string;
  isReviewAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface ContentReviewRequestDependencies {
  createContentReviewStream: (
    input: ContentReviewRequest,
    env: DemoEnv
  ) => Promise<ContentReviewStreamResult>;
}

export interface ContentReviewStreamResult {
  textStream: AsyncIterable<string>;
  totalUsage: PromiseLike<LanguageModelUsage>;
}

function isAcceptedMediaType(mediaType: string) {
  return mediaType.startsWith("image/") || mediaType === "application/pdf";
}

function readContentReviewInput(body: unknown): ContentReviewRequest {
  const parsed = contentReviewRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new Error(invalidBodyError);
  }

  const input = {
    attachments: parsed.data.attachments,
    prompt: parsed.data.prompt.trim(),
  };

  if (!input.prompt && input.attachments.length === 0) {
    throw new Error(missingReviewInputError);
  }

  for (const attachment of input.attachments) {
    if (!isAcceptedMediaType(attachment.mediaType)) {
      throw new Error(unsupportedMediaTypeError);
    }
  }

  return input;
}

function buildReviewMessages(input: ContentReviewRequest) {
  return [
    {
      content: [
        {
          text: [
            "Review the provided content submission.",
            "Focus on safety, policy, trust, unsupported claims, and editorial risk.",
            input.prompt
              ? `Requester guidance: ${input.prompt}`
              : "Requester guidance: Review the provided attachments only.",
          ].join("\n"),
          type: "text" as const,
        },
        ...input.attachments.map((attachment) => ({
          data: attachment.url,
          filename: attachment.filename,
          mediaType: attachment.mediaType,
          type: "file" as const,
        })),
      ],
      role: "user" as const,
    },
  ];
}

export function getContentReviewRuntimeState(
  env: DemoEnv = process.env
): ContentReviewRuntimeState {
  const setup = getAiGatewaySetupState(env);

  return {
    acceptedMediaTypes: [...contentReviewAcceptedMediaTypes],
    chatModel: setup.config.chatModel,
    isReviewAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export async function createContentReviewStream(
  input: ContentReviewRequest,
  env: DemoEnv
) : Promise<ContentReviewStreamResult> {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    messages: buildReviewMessages(input),
    output: Output.object({
      description:
        "A structured review decision with grounded findings and evidence.",
      name: "ContentReviewResult",
      schema: contentReviewResultSchema,
    }),
    system: reviewSystemPrompt,
  });

  return {
    textStream: result.textStream,
    totalUsage: result.totalUsage,
  };
}

export async function handleContentReviewRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: ContentReviewRequestDependencies = {
    createContentReviewStream,
  }
) {
  const runtimeState = getContentReviewRuntimeState(env);

  if (!runtimeState.isReviewAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let input: ContentReviewRequest;

  try {
    input = readContentReviewInput(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          error: malformedJsonError,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      [
        invalidBodyError,
        missingReviewInputError,
        unsupportedMediaTypeError,
      ].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }

  const stream = await dependencies.createContentReviewStream(input, env);

  return startRecordedReviewRun(stream);
}
