import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.base.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        ...configDefaults.exclude,
        "**/*.integration.test.ts",
        "features/demo-catalog/registry-availability.test.mjs",
      ],
      testTimeout: 30_000,
    },
  })
);
