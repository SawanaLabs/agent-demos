export const siteUsageLimitErrorCode = "SITE_USAGE_LIMIT_EXCEEDED";

export type SiteUsageGateAction =
  | "image_generation"
  | "text_generation"
  | "rag_search"
  | "sandbox_start"
  | "compact_context"
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
    remainingUnits: number;
    scope: SiteUsagePolicyScope;
    windowSeconds: number;
  };
  requiredUnits?: number;
  resetAt: string;
  serverTime: string;
}
