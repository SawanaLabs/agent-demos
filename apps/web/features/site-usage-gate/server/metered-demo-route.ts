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
    readonly failureCategory?: "provider" | "tool";
  }): void;
}

const uiMessageStreamHeader = "x-vercel-ai-ui-message-stream";
const uiMessageStreamErrorMarkers = [
  {
    failureCategory: "provider" as const,
    marker: 'data: {"type":"error",',
  },
  {
    failureCategory: "tool" as const,
    marker: 'data: {"type":"tool-output-error",',
  },
];
const maximumUiMessageStreamMarkerLength = Math.max(
  ...uiMessageStreamErrorMarkers.map(({ marker }) => marker.length)
);

function observeResponseFailures(
  response: Response,
  report: (failureCategory: "provider" | "tool") => void
): Response {
  if (!response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const isUiMessageStream =
    response.headers.get(uiMessageStreamHeader) === "v1";
  let markerTail = "";
  let reported = false;

  function reportOnce(failureCategory: "provider" | "tool") {
    if (reported) {
      return;
    }

    reported = true;

    try {
      report(failureCategory);
    } catch {
      // Runtime telemetry must never replace the product stream.
    }
  }

  function inspectUiMessageStream(chunk: Uint8Array) {
    if (!isUiMessageStream || reported) {
      return;
    }

    const text = markerTail + decoder.decode(chunk, { stream: true });
    let firstMatch:
      | { failureCategory: "provider" | "tool"; index: number }
      | undefined;

    for (const { failureCategory, marker } of uiMessageStreamErrorMarkers) {
      const index = text.indexOf(marker);

      if (index >= 0 && (!firstMatch || index < firstMatch.index)) {
        firstMatch = { failureCategory, index };
      }
    }

    if (firstMatch) {
      reportOnce(firstMatch.failureCategory);
      return;
    }

    markerTail = text.slice(-(maximumUiMessageStreamMarkerLength - 1));
  }

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();
          return;
        }

        inspectUiMessageStream(value);
        controller.enqueue(value);
      } catch (error) {
        reportOnce("provider");
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return new Response(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
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

      if (response.ok && !runtimeFailureHandled) {
        return observeResponseFailures(response, (failureCategory) => {
          telemetry.reportUnexpectedFailure({
            action: observedAction,
            demoSlug,
            failureCategory,
          });
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
