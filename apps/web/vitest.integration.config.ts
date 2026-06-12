import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [...configDefaults.exclude],
      hookTimeout: 300_000,
      include: ["features/**/*.integration.test.ts"],
      testTimeout: 300_000,
    },
  })
);
