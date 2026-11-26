import { defineAgent } from "eve";
import { openai } from "eve/models/openai";

export default defineAgent({
  model: openai("gpt-5-mini"),
  modelContextWindowTokens: 400_000,
});
