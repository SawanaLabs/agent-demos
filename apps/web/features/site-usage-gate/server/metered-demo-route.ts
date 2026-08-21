import type { VisitorOwnerContext } from "@/features/shared/visitor-owner/server/route-owner";
import { markAcceptedDemoAction } from "@/features/site-analytics/server/demo-route-adapter";
import type { CatalogDemoAction } from "@/features/site-analytics/shared/demo-action-contract";
import { reportDemoRouteFailure } from "@/features/site-runtime-logging/server/demo-route-adapter";
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
    productAction?: CatalogDemoAction | false;
    runtimeFailureHandled?: boolean;
  };

export type VisitorOwnedMeteredDemoRouteOptions<
  TContext = unknown,
  TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
> = SiteUsageGateOptions & {
  handleVisitorRequest: MeteredDemoVisitorRequestHandler<TVisitor>;
  handler: VisitorOwnedMeteredDemoRouteHandler<TContext, TVisitor>;
  productAction?: CatalogDemoAction | false;
  runtimeFailureHandled?: boolean;
};

export interface MeteredDemoRouteTelemetry {
  markAcceptedAction(
    response: Response,
    input: { readonly action: unknown; readonly demoSlug: unknown }
  ): void;
  reportUnexpectedFailure(input: {
    readonly action: unknown;
    readonly demoSlug: unknown;
  }): void;
}

const productionTelemetry: MeteredDemoRouteTelemetry = {
  markAcceptedAction: markAcceptedDemoAction,
  reportUnexpectedFailure: reportDemoRouteFailure,
};

export function createMeteredDemoRouteFactory({
  meter,
  telemetry = productionTelemetry,
}: {
  meter: MeteredDemoRouteMeter;
  telemetry?: MeteredDemoRouteTelemetry;
}) {
  async function runObservedRoute({
    action,
    demoSlug,
    execute,
    productAction,
    runtimeFailureHandled = false,
  }: {
    action: SiteUsageGateOptions["action"];
    demoSlug: string;
    execute: () => Promise<Response>;
    productAction?: CatalogDemoAction | false;
    runtimeFailureHandled?: boolean;
  }) {
    const acceptedAction = productAction === undefined ? action : productAction;
    const observedAction = acceptedAction === false ? action : acceptedAction;

    try {
      const response = await execute();

      if (!runtimeFailureHandled && response.status >= 500) {
        telemetry.reportUnexpectedFailure({
          action: observedAction,
          demoSlug,
        });
      }

      if (response.ok && acceptedAction !== false) {
        telemetry.markAcceptedAction(response, {
          action: acceptedAction,
          demoSlug,
        });
      }

      return response;
    } catch (error) {
      if (!runtimeFailureHandled) {
        telemetry.reportUnexpectedFailure({
          action: observedAction,
          demoSlug,
        });
      }

      throw error;
    }
  }

  function createMeteredDemoRoute<TContext = unknown>({
    action,
    demoSlug,
    chargeMessage,
    handler,
    productAction,
    runtimeFailureHandled,
  }: MeteredDemoRouteOptions<TContext>): MeteredDemoRoute<TContext> {
    return (request, context) =>
      runObservedRoute({
        action,
        demoSlug,
        execute: () =>
          meter.handleMeteredRequest(
            request,
            {
              action,
              demoSlug,
              ...(chargeMessage === undefined ? {} : { chargeMessage }),
            },
            () => handler({ context, request })
          ),
        productAction,
        runtimeFailureHandled,
      });
  }

  function createVisitorOwnedMeteredDemoRoute<
    TContext = unknown,
    TVisitor extends VisitorOwnerContext = VisitorOwnerContext,
  >({
    action,
    demoSlug,
    chargeMessage,
    handleVisitorRequest,
    handler,
    productAction,
    runtimeFailureHandled,
  }: VisitorOwnedMeteredDemoRouteOptions<
    TContext,
    TVisitor
  >): MeteredDemoRoute<TContext> {
    return (request, context) =>
      runObservedRoute({
        action,
        demoSlug,
        execute: () =>
          meter.handleMeteredRequest(
            request,
            {
              action,
              demoSlug,
              ...(chargeMessage === undefined ? {} : { chargeMessage }),
            },
            () =>
              handleVisitorRequest(request, (ownedRequest, visitor) =>
                handler({ context, request: ownedRequest, visitor })
              )
          ),
        productAction,
        runtimeFailureHandled,
      });
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
