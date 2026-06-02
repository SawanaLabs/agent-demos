import type { VisitorOwnerContext } from "@/features/shared/visitor-owner/server/route-owner";
import { handleMeteredSiteUsageRequest } from "./route-handler";
import type {
  MeteredRouteHandler,
  SiteUsageGateOptions,
} from "./route-wrapper";

export interface MeteredDemoRouteMeter {
  handleMeteredRequest(
    request: Request,
    options: SiteUsageGateOptions,
    handler: MeteredRouteHandler
  ): Promise<Response>;
}

export type MeteredDemoRoute<TContext = unknown> = (
  request: Request,
  context: TContext
) => Promise<Response>;

export interface MeteredDemoRouteHandlerInput<TContext = unknown> {
  context: TContext;
  request: Request;
}

export type MeteredDemoRouteHandler<TContext = unknown> = (
  input: MeteredDemoRouteHandlerInput<TContext>
) => Promise<Response>;

export type VisitorOwnedMeteredDemoRouteHandlerInput<
  TContext = unknown,
  TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
> = MeteredDemoRouteHandlerInput<TContext> & {
  visitor: TVisitor;
};

export type VisitorOwnedMeteredDemoRouteHandler<
  TContext = unknown,
  TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
> = (
  input: VisitorOwnedMeteredDemoRouteHandlerInput<TContext, TVisitor>
) => Promise<Response>;

export type MeteredDemoVisitorRequestHandler<
  TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
> = (
  request: Request,
  handler: (request: Request, visitor: TVisitor) => Promise<Response>
) => Promise<Response>;

export type MeteredDemoRouteOptions<TContext = unknown> =
  SiteUsageGateOptions & {
    handler: MeteredDemoRouteHandler<TContext>;
  };

export type VisitorOwnedMeteredDemoRouteOptions<
  TContext = unknown,
  TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
> = SiteUsageGateOptions & {
  handleVisitorRequest: MeteredDemoVisitorRequestHandler<TVisitor>;
  handler: VisitorOwnedMeteredDemoRouteHandler<TContext, TVisitor>;
};

export function createMeteredDemoRouteFactory({
  meter,
}: {
  meter: MeteredDemoRouteMeter;
}) {
  function createMeteredDemoRoute<TContext = unknown>({
    action,
    demoSlug,
    handler,
  }: MeteredDemoRouteOptions<TContext>): MeteredDemoRoute<TContext> {
    return (request, context) =>
      meter.handleMeteredRequest(request, { action, demoSlug }, () =>
        handler({ context, request })
      );
  }

  function createVisitorOwnedMeteredDemoRoute<
    TContext = unknown,
    TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
  >({
    action,
    demoSlug,
    handleVisitorRequest,
    handler,
  }: VisitorOwnedMeteredDemoRouteOptions<
    TContext,
    TVisitor
  >): MeteredDemoRoute<TContext> {
    return (request, context) =>
      meter.handleMeteredRequest(request, { action, demoSlug }, () =>
        handleVisitorRequest(request, (ownedRequest, visitor) =>
          handler({ context, request: ownedRequest, visitor })
        )
      );
  }

  return {
    createMeteredDemoRoute,
    createVisitorOwnedMeteredDemoRoute,
  };
}

const databaseBackedMeteredDemoRoutes = createMeteredDemoRouteFactory({
  meter: {
    handleMeteredRequest: handleMeteredSiteUsageRequest,
  },
});

export const createMeteredDemoRoute =
  databaseBackedMeteredDemoRoutes.createMeteredDemoRoute;

export const createVisitorOwnedMeteredDemoRoute =
  databaseBackedMeteredDemoRoutes.createVisitorOwnedMeteredDemoRoute;
