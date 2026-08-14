import { generateText } from "ai";

import type {
  WorkflowResultImage,
  WorkflowRunPlan,
} from "../model/workflow-engine";
import {
  createImageWorkflowAgentGateway,
  type ImageWorkflowAgentEnv,
  type ImageWorkflowAgentGateway,
} from "./env";

export class ImageWorkflowExecutionError extends Error {
  code: "network" | "no-image" | "provider";

  constructor(code: ImageWorkflowExecutionError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export interface ImageWorkflowExecutionDependencies {
  createGateway: (env: ImageWorkflowAgentEnv) => ImageWorkflowAgentGateway;
  generateText: typeof generateText;
}

function sanitizeErrorMessage(message: string, env: ImageWorkflowAgentEnv) {
  return [env.AI_GATEWAY_API_KEY, env.VERCEL_OIDC_TOKEN]
    .filter((value): value is string => Boolean(value))
    .reduce(
      (nextMessage, secret) => nextMessage.split(secret).join("[redacted]"),
      message
    );
}

function createReferenceImagePart(plan: WorkflowRunPlan) {
  if (!plan.referenceImage) {
    return [];
  }

  return [
    {
      image: plan.referenceImage.dataUrl,
      mediaType: plan.referenceImage.mediaType,
      type: "image" as const,
    },
  ];
}

function createRunPrompt(plan: WorkflowRunPlan) {
  return [
    `Generate exactly one image with aspect ratio ${plan.aspectRatio}.`,
    plan.referenceImage
      ? "Use the attached reference image as the visual source material."
      : "Create a new image from scratch.",
    `Prompt: ${plan.prompt}`,
  ].join(" ");
}

export async function executeImageWorkflowRunPlan(
  plan: WorkflowRunPlan,
  env: ImageWorkflowAgentEnv,
  dependencies: ImageWorkflowExecutionDependencies = {
    createGateway: createImageWorkflowAgentGateway,
    generateText,
  }
): Promise<WorkflowResultImage> {
  const gateway = dependencies.createGateway(env);

  try {
    const result = await dependencies.generateText({
      messages: [
        {
          content: [
            {
              text: createRunPrompt(plan),
              type: "text",
            },
            ...createReferenceImagePart(plan),
          ],
          role: "user",
        },
      ],
      model: gateway.languageModel(plan.imageModel),
    });
    const firstImage = result.files.find((file) =>
      file.mediaType.startsWith("image/")
    );

    if (!firstImage) {
      throw new ImageWorkflowExecutionError(
        "no-image",
        "Image generation completed without an image file."
      );
    }

    return {
      dataUrl: `data:${firstImage.mediaType};base64,${firstImage.base64}`,
      mediaType: firstImage.mediaType,
    };
  } catch (error) {
    if (error instanceof ImageWorkflowExecutionError) {
      throw error;
    }

    const message = sanitizeErrorMessage(
      error instanceof Error ? error.message : "Unknown image execution error.",
      env
    );
    const lowered = message.toLowerCase();

    if (
      lowered.includes("fetch") ||
      lowered.includes("network") ||
      lowered.includes("econn") ||
      lowered.includes("timeout")
    ) {
      throw new ImageWorkflowExecutionError(
        "network",
        "AI Gateway network error while generating the workflow image."
      );
    }

    throw new ImageWorkflowExecutionError(
      "provider",
      `Image generation provider error: ${message}`
    );
  }
}
