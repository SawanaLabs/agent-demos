import { z } from "zod";
import { nodeSchema } from "./graph";
import { canvasImageUrlSchema } from "./image";

export const chatNodeSchema = z.object({
  attachmentUrl: canvasImageUrlSchema
    .optional()
    .describe(
      "For reference nodes only: exact URL from a user chat attachment. Reuse an existing reference for the same image. Never invent URLs."
    ),
  node: nodeSchema.omit({
    id: true,
    resultPosition: true,
    resultPositions: true,
  }),
  sourceResults: z
    .array(
      z.object({
        source: z.string(),
        resultIndex: z.number().int().min(0).max(3),
      })
    )
    .optional()
    .describe(
      "Selected generated results returned by a prior tool. Connects them during creation without adding an empty prompt material."
    ),
  sourceIds: z
    .array(z.string())
    .max(20)
    .describe(
      "Connect ALL results from each of these original upstream node IDs. Required image references must be real connections; repeating a description does not supply the image. For selected results, use sourceResults and omit those sources here. Also use [] for independent generation or materials."
    ),
});
