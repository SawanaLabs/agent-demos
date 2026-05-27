"use client";

import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsInIcon,
  ArrowsOutIcon,
  CopySimpleIcon,
} from "@phosphor-icons/react";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { TabsContent } from "@/components/ui/tabs";

import {
  formatPreviewStatusSummary,
  parsePreviewStatus,
} from "./preview-state";
import {
  type SandboxPreviewState,
  usePreviewHealth,
} from "./use-sandbox-preview-state";

interface LatestPreview {
  directory: string | null;
  entryPath: string | null;
  port: number | null;
  url: string;
}

interface SandboxPreviewPaneProps {
  latestPreview: LatestPreview | null;
  previewState: SandboxPreviewState;
}

export function SandboxPreviewPane({
  latestPreview,
  previewState,
}: SandboxPreviewPaneProps) {
  const previewHealth = usePreviewHealth(
    previewState.activePreviewUrl,
    previewState.previewReloadKey,
    previewState.appendPreviewLog
  );

  if (!latestPreview?.url) {
    return (
      <TabsContent className="mt-0 min-h-0 flex-1" value="preview">
        <div className="flex size-full items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-2">
            <p className="font-medium text-foreground text-sm">
              Preview is not running yet
            </p>
            <p className="text-muted-foreground text-sm">
              A live preview will appear here after the agent starts a sandbox
              preview for the generated prototype.
            </p>
          </div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent className="mt-0 min-h-0 flex-1" value="preview">
      <div className="size-full" ref={previewState.previewContainerRef}>
        <WebPreview
          className="size-full rounded-none border-0 bg-transparent"
          defaultUrl="/"
          key={`${previewState.activePreviewUrl}:${previewState.previewReloadKey}`}
          onUrlChange={previewState.handlePreviewUrlChange}
          style={{ height: "100%" }}
        >
          <WebPreviewNavigation>
            <WebPreviewNavigationButton
              disabled={!previewState.canGoBack}
              onClick={previewState.handleGoBack}
              tooltip="Go back"
            >
              <ArrowLeftIcon className="size-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              disabled={!previewState.canGoForward}
              onClick={previewState.handleGoForward}
              tooltip="Go forward"
            >
              <ArrowRightIcon className="size-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              onClick={previewState.handleReload}
              tooltip="Reload"
            >
              <ArrowClockwiseIcon className="size-4" />
            </WebPreviewNavigationButton>
            <WebPreviewUrl
              data-preview-url-input="true"
              value={previewState.activePreviewUrl}
            />
            <WebPreviewNavigationButton
              onClick={previewState.handleCopy}
              tooltip="Copy preview URL"
            >
              <CopySimpleIcon className="size-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              onClick={previewState.handleOpenInNewTab}
              tooltip="Open in new tab"
            >
              <ArrowSquareOutIcon className="size-4" />
            </WebPreviewNavigationButton>
            <WebPreviewNavigationButton
              onClick={previewState.handleToggleFullscreen}
              tooltip={
                previewState.isPreviewFullscreen ? "Restore" : "Maximize"
              }
            >
              {previewState.isPreviewFullscreen ? (
                <ArrowsInIcon className="size-4" />
              ) : (
                <ArrowsOutIcon className="size-4" />
              )}
            </WebPreviewNavigationButton>
          </WebPreviewNavigation>

          {previewHealth.state === "error" ? (
            <div className="flex min-h-0 flex-1 items-center justify-center border-t px-6 py-10 text-center">
              <div className="max-w-xl space-y-2">
                <p className="font-medium text-foreground text-sm">
                  Preview is unavailable
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatPreviewStatusSummary(
                    previewHealth.details ??
                      parsePreviewStatus({
                        errorCode: "UNKNOWN_PREVIEW_ERROR",
                        message: "The preview URL could not be verified.",
                        ok: false,
                        status: null,
                        statusText: null,
                      })
                  )}
                </p>
              </div>
            </div>
          ) : (
            <WebPreviewBody
              className="min-h-0 flex-1"
              src={previewState.activePreviewUrl}
            />
          )}

          <WebPreviewConsole logs={previewState.previewLogs} />
        </WebPreview>
      </div>
    </TabsContent>
  );
}
