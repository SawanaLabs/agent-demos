import { describe, expect, it } from "vitest";

import { getCronSecret } from "./env";

const missingCronSecretPattern = /CRON_SECRET is missing/i;

describe("cron env contract", () => {
  it("reads the configured cron secret", () => {
    expect(
      getCronSecret({
        CRON_SECRET: "expected-secret",
      })
    ).toBe("expected-secret");
  });

  it("throws a clear error when the cron secret is missing", () => {
    expect(() => getCronSecret({})).toThrow(missingCronSecretPattern);
  });
});
