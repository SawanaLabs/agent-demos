import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const openai = createOpenAI({
  baseURL: "https://api.openai.com/v1",
});

export default defineAgent({
  model: openai.responses("gpt-5-mini"),
  modelContextWindowTokens: 400_000,
});
