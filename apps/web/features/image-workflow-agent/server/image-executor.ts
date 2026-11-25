import { generateImage, generateText } from "ai";

import { openAIModelId } from "@/features/shared/ai-gateway/server/openai-platform";
import type {
  WorkflowResultImage,
  WorkflowRunPlan,
} from "../model/workflow-engine";
import {
  createImageWorkflowAgentGateway,
  type ImageWorkflowAgentEnv,
  type ImageWorkflowAgentGateway,
} from "./env";

const gptImage2Sizes = {
  "1:1": "1024x1024",
  "16:9": "1536x864",
  "9:16": "864x1536",
} as const;
const legacyImageSizes = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
} as const;

export class ImageWorkflowExecutionError extends Error {
  code: "network" | "no-image" | "provider";

  constructor(code: ImageWorkflowExecutionError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export interface ImageWorkflowExecutionDependencies {
  createGateway: (env: ImageWorkflowAgentEnv) => ImageWorkflowAgentGateway;
  generateImage?: typeof generateImage;
  generateText: typeof generateText;
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
    const openaiModel = openAIModelId(plan.imageModel);
    if (openaiModel) {
      const prompt = createRunPrompt(plan);
      const sizes = openaiModel.startsWith("gpt-image-2")
        ? gptImage2Sizes
        : legacyImageSizes;
      const { image } = await (dependencies.generateImage ?? generateImage)({
        maxRetries: 0,
        model: gateway.imageModel(plan.imageModel),
        prompt: plan.referenceImage
          ? { images: [plan.referenceImage.dataUrl], text: prompt }
          : prompt,
        size: sizes[plan.aspectRatio],
      });

      return {
        dataUrl: `data:${image.mediaType};base64,${image.base64}`,
        mediaType: image.mediaType,
      };
    }

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
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
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

    const message = error instanceof Error ? error.message : "";
    const lowered = message.toLowerCase();

    if (
      lowered.includes("fetch") ||
      lowered.includes("network") ||
      lowered.includes("econn") ||
      lowered.includes("timeout")
    ) {
      throw new ImageWorkflowExecutionError(
        "network",
        "Network error while generating the workflow image."
      );
    }

    throw new ImageWorkflowExecutionError(
      "provider",
      "Image generation provider request failed."
    );
  }
}
