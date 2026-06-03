import { Output, streamText } from "ai";
import {
  type ObjectGenerationRequest,
  objectGenerationAcceptedMediaTypes,
  objectGenerationRequestSchema,
  objectGenerationResultSchema,
} from "../schema";
import {
  createObjectGenerationGateway,
  getObjectGenerationConfig,
  getObjectGenerationEnv,
  getObjectGenerationSetupState,
  type ObjectGenerationEnv,
} from "./env";

const invalidBodyError =
  'Expected a JSON body with a "prompt" string and an "attachments" array.';
const malformedJsonError = "Expected a valid JSON request body.";
const unsupportedMediaTypeError =
  "Only image attachments and PDF attachments are supported.";
const missingReviewInputError =
  "Provide text guidance, at least one attachment, or both.";

const reviewSystemPrompt = [
  "You are the Object Generation structured-output demo in a production-ready agent demos monorepo.",
  "Generate the requested object from the provided text, images, and PDFs.",
  "Evaluate policy, trust, and brand-safety issues before filling the object fields.",
  "Return only the structured object requested by the output schema.",
  "Use approved when the content is safe to publish as-is, needs_review when it needs human review or minor changes, and blocked when it should not be published.",
  "Ground every finding in provided evidence and keep summaries concise.",
].join(" ");

export interface ObjectGenerationRuntimeState {
  acceptedMediaTypes: string[];
  chatModel: string;
  isReviewAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface ObjectGenerationRequestDependencies {
  createObjectGenerationStream: (
    input: ObjectGenerationRequest,
    env: ObjectGenerationEnv
  ) => ObjectGenerationStreamResult | Promise<ObjectGenerationStreamResult>;
}

export interface ObjectGenerationStreamResult {
  textStream: AsyncIterable<string>;
}

function isAcceptedMediaType(mediaType: string) {
  return mediaType.startsWith("image/") || mediaType === "application/pdf";
}

function readObjectGenerationInput(body: unknown): ObjectGenerationRequest {
  const parsed = objectGenerationRequestSchema.safeParse(body);

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

function buildReviewMessages(input: ObjectGenerationRequest) {
  return [
    {
      content: [
        {
          text: [
            "Generate the structured object for the provided content submission.",
            "Focus on safety, policy, trust, unsupported claims, and editorial risk.",
            input.prompt
              ? `Requester guidance: ${input.prompt}`
              : "Requester guidance: Use the provided attachments only.",
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

export function getObjectGenerationRuntimeState(
  env: ObjectGenerationEnv = getObjectGenerationEnv()
): ObjectGenerationRuntimeState {
  const setup = getObjectGenerationSetupState(env);

  return {
    acceptedMediaTypes: [...objectGenerationAcceptedMediaTypes],
    chatModel: setup.config.chatModel,
    isReviewAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export function createObjectGenerationStream(
  input: ObjectGenerationRequest,
  env: ObjectGenerationEnv
): Promise<ObjectGenerationStreamResult> {
  const gateway = createObjectGenerationGateway(env);
  const { chatModel } = getObjectGenerationConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    messages: buildReviewMessages(input),
    output: Output.object({
      description:
        "A structured object with grounded findings, evidence, and next action.",
      name: "ObjectGenerationResult",
      schema: objectGenerationResultSchema,
    }),
    system: reviewSystemPrompt,
  });

  return Promise.resolve({
    textStream: result.textStream,
  });
}

function createObjectGenerationResponse(stream: ObjectGenerationStreamResult) {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export async function handleObjectGenerationRequest(
  request: Request,
  env: ObjectGenerationEnv = getObjectGenerationEnv(),
  dependencies: ObjectGenerationRequestDependencies = {
    createObjectGenerationStream,
  }
) {
  const runtimeState = getObjectGenerationRuntimeState(env);

  if (!runtimeState.isReviewAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let input: ObjectGenerationRequest;

  try {
    input = readObjectGenerationInput(await request.json());
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

  const stream = await dependencies.createObjectGenerationStream(input, env);

  return createObjectGenerationResponse(stream);
}
