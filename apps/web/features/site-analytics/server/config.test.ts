import { describe, expect, it } from "vitest";

import { readSiteAnalyticsConfig } from "./config";

describe("site analytics environment contract", () => {
  it("keeps local, test, and ordinary Preview traffic disabled", () => {
    expect(
      readSiteAnalyticsConfig({
        nodeEnvironment: "development",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: undefined,
      })
    ).toEqual({ enabled: false });
    expect(
      readSiteAnalyticsConfig({
        nodeEnvironment: "development",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "production",
      })
    ).toEqual({ enabled: false });
    expect(
      readSiteAnalyticsConfig({
        nodeEnvironment: "test",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "production",
      })
    ).toEqual({ enabled: false });
    expect(
      readSiteAnalyticsConfig({
        nodeEnvironment: "production",
        previewMeasurementId: "G-TEST1234",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "preview",
      })
    ).toEqual({ enabled: false });
    expect(
      readSiteAnalyticsConfig({
        nodeEnvironment: "production",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "production",
      })
    ).toEqual({ enabled: false });
  });

  it("uses a separate explicitly configured test property in Preview", () => {
    expect(
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        previewMeasurementId: "G-TEST1234",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "preview",
      })
    ).toEqual({
      enabled: true,
      measurementId: "G-TEST1234",
      mode: "preview",
    });
  });

  it("rejects a Preview property that reuses the Production property", () => {
    expect(() =>
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        previewMeasurementId: "G-SHARED1234",
        productionMeasurementId: "G-SHARED1234",
        vercelEnvironment: "preview",
      })
    ).toThrow(/separate GA4 property/u);
  });

  it("fails closed when Preview cannot compare against Production", () => {
    expect(() =>
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        previewMeasurementId: "G-TEST1234",
        vercelEnvironment: "preview",
      })
    ).toThrow(/NEXT_PUBLIC_GA_MEASUREMENT_ID/u);
  });

  it("fails fast when Production has no valid Measurement ID", () => {
    expect(() =>
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        vercelEnvironment: "production",
      })
    ).toThrow(/NEXT_PUBLIC_GA_MEASUREMENT_ID/u);
    expect(() =>
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        productionMeasurementId: "UA-123456",
        vercelEnvironment: "production",
      })
    ).toThrow(/NEXT_PUBLIC_GA_MEASUREMENT_ID/u);
    expect(() =>
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        productionMeasurementId: "G-XXXXXXXXXX",
        vercelEnvironment: "production",
      })
    ).toThrow(/NEXT_PUBLIC_GA_MEASUREMENT_ID/u);
  });

  it("enables a valid Production property", () => {
    expect(
      readSiteAnalyticsConfig({
        isVercel: true,
        nodeEnvironment: "production",
        productionMeasurementId: "G-PROD1234",
        vercelEnvironment: "production",
      })
    ).toEqual({
      enabled: true,
      measurementId: "G-PROD1234",
      mode: "production",
    });
  });
});
