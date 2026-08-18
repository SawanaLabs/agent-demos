import { describe, expect, it } from "vitest";

import { deploymentContextFromEnvironment } from "./deployment-context";

describe("runtime deployment context", () => {
  it("extracts bounded Vercel deployment metadata without URL details", () => {
    expect(
      deploymentContextFromEnvironment({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: "hermes",
        VERCEL_URL: "https://preview.example.vercel.app/private?token=secret",
      })
    ).toEqual({
      deployment_environment: "preview",
      deployment_host: "preview.example.vercel.app",
      deployment_ref: "hermes",
    });
  });

  it("prefers the target environment and recognizes local development", () => {
    expect(
      deploymentContextFromEnvironment({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_TARGET_ENV: "staging",
      })
    ).toEqual({ deployment_environment: "staging" });
    expect(
      deploymentContextFromEnvironment({
        NODE_ENV: "development",
      })
    ).toEqual({ deployment_environment: "development" });
  });

  it("fails closed when deployment metadata is malformed", () => {
    expect(
      deploymentContextFromEnvironment({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_ENV: "../../private",
        VERCEL_GIT_COMMIT_REF: "secret\nheader",
        VERCEL_URL: "not a host?token=secret",
      })
    ).toEqual({ deployment_environment: "unknown" });
  });
});
