import {
  createSiteUsageGate,
  type MeteredRouteHandler,
  type SiteUsageGate,
  type SiteUsageGateOptions,
} from "./route-wrapper";
import { createDatabaseSiteUsageGateStore } from "./store";

let databaseBackedGate: SiteUsageGate | null = null;

export function withSiteUsageGate<TContext = unknown>(
  options: SiteUsageGateOptions,
  handler: (request: Request, context: TContext) => Promise<Response>
) {
  return async (request: Request, context: TContext) =>
    getDatabaseBackedSiteUsageGate().handleMeteredRequest(
      request,
      options,
      () => handler(request, context)
    );
}

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
