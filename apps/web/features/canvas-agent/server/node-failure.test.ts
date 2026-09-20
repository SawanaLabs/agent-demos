import { expect, it } from "vitest";
import { nodeFailureDetails } from "./node-failure";

it("retains the underlying network cause without exposing credentials or request metadata", () => {
  const cause = Object.assign(new Error("connect ECONNRESET"), {
    code: "ECONNRESET",
  });
  const error = Object.assign(
    new Error(
      "request failed: postgres://user:password@host/db Bearer secret-value",
      { cause }
    ),
    { requestHeaders: { authorization: "secret-header" } }
  );
  const details = nodeFailureDetails(error);
  expect(details.cause).toMatchObject({
    message: "connect ECONNRESET",
    code: "ECONNRESET",
  });
  expect(JSON.stringify(details)).not.toMatch(
    /password|secret-value|secret-header/
  );
  expect(details.message).toContain("request failed");
});
