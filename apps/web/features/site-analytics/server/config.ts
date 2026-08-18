export type SiteAnalyticsConfig =
  | { readonly enabled: false }
  | {
      readonly enabled: true;
      readonly measurementId: string;
      readonly mode: "preview" | "production";
    };

interface SiteAnalyticsEnvironment {
  readonly isVercel?: boolean;
  readonly nodeEnvironment?: "development" | "production" | "test";
  readonly previewMeasurementId?: string;
  readonly productionMeasurementId?: string;
  readonly vercelEnvironment?: "development" | "preview" | "production";
}

const measurementIdPattern = /^G-[A-Z0-9]{6,20}$/u;
const placeholderMeasurementIds = new Set(["G-PLACEHOLDER", "G-XXXXXXXXXX"]);

function requireMeasurementId(
  rawValue: string | undefined,
  name:
    | "NEXT_PUBLIC_GA_MEASUREMENT_ID"
    | "NEXT_PUBLIC_GA_PREVIEW_MEASUREMENT_ID"
): string {
  const value = rawValue?.trim();

  if (
    !(
      value &&
      measurementIdPattern.test(value) &&
      !placeholderMeasurementIds.has(value)
    )
  ) {
    throw new Error(`${name} must contain a valid GA4 Measurement ID.`);
  }

  return value;
}

export function readSiteAnalyticsConfig(
  environment: SiteAnalyticsEnvironment
): SiteAnalyticsConfig {
  if (
    environment.nodeEnvironment !== "production" ||
    environment.isVercel !== true
  ) {
    return { enabled: false };
  }

  if (environment.vercelEnvironment === "production") {
    return {
      enabled: true,
      measurementId: requireMeasurementId(
        environment.productionMeasurementId,
        "NEXT_PUBLIC_GA_MEASUREMENT_ID"
      ),
      mode: "production",
    };
  }

  if (
    environment.vercelEnvironment === "preview" &&
    environment.previewMeasurementId !== undefined
  ) {
    const measurementId = requireMeasurementId(
      environment.previewMeasurementId,
      "NEXT_PUBLIC_GA_PREVIEW_MEASUREMENT_ID"
    );
    const productionMeasurementId = requireMeasurementId(
      environment.productionMeasurementId,
      "NEXT_PUBLIC_GA_MEASUREMENT_ID"
    );

    if (measurementId === productionMeasurementId) {
      throw new Error(
        "Preview analytics must use a separate GA4 property from Production."
      );
    }

    return {
      enabled: true,
      measurementId,
      mode: "preview",
    };
  }

  return { enabled: false };
}
