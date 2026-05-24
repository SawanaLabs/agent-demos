import { describe, expect, it } from "vitest";

import {
  getVercelSandboxSetupState,
  getVercelSandboxTokenCredentials,
} from "./env";

const missingSandboxCredentialsPattern = /VERCEL_OIDC_TOKEN|VERCEL_TOKEN/i;

describe("vercel sandbox env contract", () => {
  it("prefers oidc auth when an oidc token is present", () => {
    expect(
      getVercelSandboxSetupState({
        VERCEL_OIDC_TOKEN: "oidc-token",
      })
    ).toMatchObject({
      authMode: "oidc",
      isReady: true,
    });
  });

  it("reads token credentials when the trio is present", () => {
    expect(
      getVercelSandboxTokenCredentials({
        VERCEL_PROJECT_ID: "project_123",
        VERCEL_TEAM_ID: "team_123",
        VERCEL_TOKEN: "token_123",
      })
    ).toEqual({
      projectId: "project_123",
      teamId: "team_123",
      token: "token_123",
    });
  });

  it("reports missing sandbox credentials clearly", () => {
    expect(getVercelSandboxSetupState({}).issues.join(" ")).toMatch(
      missingSandboxCredentialsPattern
    );
  });
});
