import { creditPriceList } from "@/features/site-usage-gate/pricing";
import { readCreditBalance } from "@/features/site-usage-gate/server/balance";
import { createDatabaseSiteUsageGateStore } from "@/features/site-usage-gate/server/store";
import {
  appendSiteUsageVisitorCookie,
  resolveSiteUsageViewerContext,
} from "@/features/site-usage-gate/server/viewer-context";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  const balance = await readCreditBalance(
    createDatabaseSiteUsageGateStore(),
    viewer.visitorId,
    new Date()
  );
  return appendSiteUsageVisitorCookie(
    Response.json(
      { ...balance, prices: creditPriceList },
      { headers: { "Cache-Control": "private, no-store" } }
    ),
    viewer
  );
}
