export const siteUsageLimitErrorCode = "SITE_USAGE_LIMIT_EXCEEDED";

export type SiteUsageGateAction =
  | "edit_message"
  | "evaluate"
  | "generate_suggestion"
  | "resend"
  | "send_message";

export type SiteUsagePolicyScope = "access_code" | "default_daily";

export interface SiteUsageLimitPayload {
  action: SiteUsageGateAction;
  code: typeof siteUsageLimitErrorCode;
  demoSlug: string;
  message: string;
  policy: {
    allowanceUnits: number;
    remainingUnits: 0;
    scope: SiteUsagePolicyScope;
    windowSeconds: number;
  };
  resetAt: string;
  serverTime: string;
}
