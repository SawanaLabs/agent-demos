import type { ModelResponse, RunItem } from "@openai/agents";
import type { UIMessageChunk } from "ai";

const defaultGeneratedImageMediaType = "image/png";

interface ImageGenerationArtifactSource {
  id?: string;
  name?: string;
  output?: string;
  result?: string | null;
  status?: string;
  type?: string;
}

interface ImageGenerationRunArtifact {
  id: string;
  result: string;
}

function getImageGenerationArtifact({
  output,
  rawItem,
}: {
  output?: string;
  rawItem: ImageGenerationArtifactSource | undefined;
}): ImageGenerationRunArtifact | null {
  if (!rawItem) {
    return null;
  }

  if (
    rawItem.type === "image_generation_call" &&
    rawItem.status === "completed" &&
    typeof rawItem.result === "string" &&
    rawItem.result.length > 0
  ) {
    return {
      id: rawItem.id ?? rawItem.result,
      result: rawItem.result,
    };
  }

  const hostedOutput =
    typeof output === "string"
      ? output
      : typeof rawItem.output === "string"
        ? rawItem.output
        : null;

  if (
    rawItem.type === "hosted_tool_call" &&
    rawItem.name === "image_generation_call" &&
    rawItem.status === "completed" &&
    hostedOutput &&
    hostedOutput.length > 0
  ) {
    return {
      id: rawItem.id ?? hostedOutput,
      result: hostedOutput,
    };
  }

  return null;
}

function appendArtifactChunk(
  chunks: UIMessageChunk[],
  emittedImageIds: Set<string>,
  artifact: ImageGenerationRunArtifact | null
) {
  if (!artifact || emittedImageIds.has(artifact.id)) {
    return;
  }

  emittedImageIds.add(artifact.id);
  chunks.push({
    mediaType: defaultGeneratedImageMediaType,
    type: "file",
    url: `data:${defaultGeneratedImageMediaType};base64,${artifact.result}`,
  });
}

export function getOpenAiAgentsSdkDemoArtifactChunks({
  newItems = [],
  rawResponses = [],
}: {
  newItems?: RunItem[];
  rawResponses?: ModelResponse[];
}): UIMessageChunk[] {
  const emittedImageIds = new Set<string>();
  const chunks: UIMessageChunk[] = [];

  for (const item of newItems) {
    appendArtifactChunk(
      chunks,
      emittedImageIds,
      getImageGenerationArtifact({
        output:
          "output" in item && typeof item.output === "string"
            ? item.output
            : undefined,
        rawItem: item.rawItem as ImageGenerationArtifactSource | undefined,
      })
    );
  }

  for (const response of rawResponses) {
    for (const item of response.output) {
      appendArtifactChunk(
        chunks,
        emittedImageIds,
        getImageGenerationArtifact({
          rawItem: item as ImageGenerationArtifactSource,
        })
      );
    }
  }

  return chunks;
}
