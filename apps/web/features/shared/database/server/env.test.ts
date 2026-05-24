import { describe, expect, it } from "vitest";

import { getDatabaseSetupState, getDatabaseUrl } from "./env";

const missingDatabaseUrlPattern = /DATABASE_URL is missing/i;

describe("database env contract", () => {
  it("reads the configured database url", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      })
    ).toBe("postgresql://user:password@localhost:5432/database");
  });

  it("reports a missing database url without hiding the issue", () => {
    expect(getDatabaseSetupState({}).issues.join(" ")).toMatch(
      missingDatabaseUrlPattern
    );
  });
});
