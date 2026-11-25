import { defineAgent } from "eve";
import { openai } from "eve/models/openai";

const modelId = "gpt-5-mini";

export default defineAgent({
  // biome-ignore lint/style/noProcessEnv: Eve reads the key during build and at runtime.
  model: process.env.OPENAI_API_KEY?.trim()
    ? openai(modelId)
    : `openai/${modelId}`,
  modelContextWindowTokens: 400_000,
});
