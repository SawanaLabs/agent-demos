import {
  createSiteUsageGate,
  type MeteredRouteHandler,
  type SiteUsageGate,
  type SiteUsageGateOptions,
} from "./route-wrapper";
import { createDatabaseSiteUsageGateStore } from "./store";

let databaseBackedGate: SiteUsageGate | null = null;

export function handleMeteredSiteUsageRequest(
  request: Request,
  options: SiteUsageGateOptions,
  handler: MeteredRouteHandler
) {
  return getDatabaseBackedSiteUsageGate().handleMeteredRequest(
    request,
    options,
    handler
  );
}

function getDatabaseBackedSiteUsageGate() {
  databaseBackedGate ??= createSiteUsageGate({
    store: createDatabaseSiteUsageGateStore(),
  });
  return databaseBackedGate;
}
