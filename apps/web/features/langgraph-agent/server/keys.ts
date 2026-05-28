import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      LANGGRAPH_AGENT_API_KEY: z.string().min(1).optional(),
      LANGGRAPH_AGENT_API_URL: z.string().url().optional(),
      LANGGRAPH_AGENT_ASSISTANT_ID: z.string().min(1).optional(),
    },
    runtimeEnv: {
      LANGGRAPH_AGENT_API_KEY: process.env.LANGGRAPH_AGENT_API_KEY,
      LANGGRAPH_AGENT_API_URL: process.env.LANGGRAPH_AGENT_API_URL,
      LANGGRAPH_AGENT_ASSISTANT_ID: process.env.LANGGRAPH_AGENT_ASSISTANT_ID,
    },
  });
