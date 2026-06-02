import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      hookTimeout: 300_000,
      include: ["features/**/*.integration.test.ts"],
      testTimeout: 300_000,
    },
  })
);
