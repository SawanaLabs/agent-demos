"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  appendPreviewHistory,
  formatPreviewStatusSummary,
  movePreviewHistory,
  parsePreviewStatus,
  type SandboxPreviewStatus,
} from "./preview-state";

interface PreviewLog {
  level: "error" | "log" | "warn";
  message: string;
  timestamp: Date;
}

interface LatestPreview {
  directory: string | null;
  entryPath: string | null;
  port: number | null;
  url: string;
}

export interface SandboxPreviewState {
  activePreviewUrl: string;
  appendPreviewLog: (level: PreviewLog["level"], message: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  handleCopy: () => Promise<void>;
  handleGoBack: () => void;
  handleGoForward: () => void;
  handleOpenInNewTab: () => void;
  handlePreviewUrlChange: (nextUrl: string) => void;
  handleReload: () => void;
  handleToggleFullscreen: () => Promise<void>;
  isPreviewFullscreen: boolean;
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  previewLogs: PreviewLog[];
  previewReloadKey: number;
  sandboxSessionId: string;
}

export interface PreviewHealthState {
  details: SandboxPreviewStatus | null;
  state: "checking" | "error" | "idle" | "ok";
}

export function useSandboxPreviewState(
  latestPreview: LatestPreview | null,
  sandboxSessionId: string
): SandboxPreviewState {
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewHistoryState, setPreviewHistoryState] = useState<{
    history: string[];
    index: number;
  }>({
    history: [],
    index: -1,
  });
  const [previewLogs, setPreviewLogs] = useState<PreviewLog[]>([]);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const lastPreviewUrlRef = useRef<string | null>(null);
  const activePreviewUrl = previewUrl || latestPreview?.url || "";
  const canGoBack = previewHistoryState.index > 0;
  const canGoForward =
    previewHistoryState.index >= 0 &&
    previewHistoryState.index < previewHistoryState.history.length - 1;

  const appendPreviewLog = useCallback(
    (level: PreviewLog["level"], message: string) => {
      setPreviewLogs((current) => [
        ...current.slice(-49),
        {
          level,
          message,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  const handlePreviewUrlChange = useCallback(
    (nextUrl: string) => {
      setPreviewUrl(nextUrl);
      setPreviewHistoryState((current) =>
        appendPreviewHistory(current.history, current.index, nextUrl)
      );
      appendPreviewLog("log", `Navigated to ${nextUrl}`);
    },
    [appendPreviewLog]
  );

  const handleGoBack = useCallback(() => {
    setPreviewHistoryState((current) => {
      const previous = movePreviewHistory(current.history, current.index, -1);

      if (!previous) {
        return current;
      }

      setPreviewUrl(previous.url);
      appendPreviewLog("log", `Went back to ${previous.url}`);

      return {
        history: current.history,
        index: previous.index,
      };
    });
  }, [appendPreviewLog]);

  const handleGoForward = useCallback(() => {
    setPreviewHistoryState((current) => {
      const next = movePreviewHistory(current.history, current.index, 1);

      if (!next) {
        return current;
      }

      setPreviewUrl(next.url);
      appendPreviewLog("log", `Went forward to ${next.url}`);

      return {
        history: current.history,
        index: next.index,
      };
    });
  }, [appendPreviewLog]);

  const handleReload = useCallback(() => {
    setPreviewReloadKey((current) => current + 1);

    if (activePreviewUrl) {
      appendPreviewLog("log", `Reloaded ${activePreviewUrl}`);
    }
  }, [activePreviewUrl, appendPreviewLog]);

  const handleCopy = useCallback(async () => {
    if (!activePreviewUrl) {
      appendPreviewLog("warn", "No preview URL is available yet.");
      return;
    }

    if (!navigator.clipboard) {
      appendPreviewLog("error", "Clipboard API is not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(activePreviewUrl);
      appendPreviewLog("log", `Copied ${activePreviewUrl} to the clipboard.`);
    } catch (error) {
      appendPreviewLog(
        "error",
        error instanceof Error
          ? `Failed to copy preview URL: ${error.message}`
          : "Failed to copy preview URL."
      );
    }
  }, [activePreviewUrl, appendPreviewLog]);

  const handleOpenInNewTab = useCallback(() => {
    if (!activePreviewUrl) {
      appendPreviewLog("warn", "No preview URL is available yet.");
      return;
    }

    window.open(activePreviewUrl, "_blank", "noopener,noreferrer");
    appendPreviewLog("log", `Opened ${activePreviewUrl} in a new tab.`);
  }, [activePreviewUrl, appendPreviewLog]);

  const handleToggleFullscreen = useCallback(async () => {
    const container = previewContainerRef.current;

    if (!container) {
      appendPreviewLog("warn", "Preview container is not available.");
      return;
    }

    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      appendPreviewLog("log", "Exited preview fullscreen.");
      return;
    }

    await container.requestFullscreen();
    appendPreviewLog("log", "Entered preview fullscreen.");
  }, [appendPreviewLog]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPreviewFullscreen(
        document.fullscreenElement === previewContainerRef.current
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const nextUrl = latestPreview?.url ?? null;

    if (!nextUrl || lastPreviewUrlRef.current === nextUrl) {
      return;
    }

    lastPreviewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setPreviewHistoryState((current) =>
      appendPreviewHistory(current.history, current.index, nextUrl)
    );
    appendPreviewLog("log", `Preview ready at ${nextUrl}`);
  }, [appendPreviewLog, latestPreview?.url]);

  return {
    activePreviewUrl,
    appendPreviewLog,
    canGoBack,
    canGoForward,
    handleCopy,
    handleGoBack,
    handleGoForward,
    handleOpenInNewTab,
    handlePreviewUrlChange,
    handleReload,
    handleToggleFullscreen,
    isPreviewFullscreen,
    previewContainerRef,
    previewLogs,
    previewReloadKey,
    sandboxSessionId,
  };
}

export function buildPreviewStatusUrl({
  previewReloadKey,
  previewUrl,
  sandboxSessionId,
}: {
  previewReloadKey: number;
  previewUrl: string;
  sandboxSessionId: string;
}) {
  const params = new URLSearchParams({
    sessionId: sandboxSessionId,
    url: previewUrl,
    reload: String(previewReloadKey),
  });

  return `/api/demos/sandbox-agent/preview-status?${params}`;
}

export function usePreviewHealth(
  sandboxSessionId: string,
  previewUrl: string,
  previewReloadKey: number,
  appendPreviewLog: SandboxPreviewState["appendPreviewLog"]
) {
  const [health, setHealth] = useState<PreviewHealthState>({
    details: null,
    state: "idle",
  });

  useEffect(() => {
    if (!previewUrl) {
      setHealth({
        details: null,
        state: "idle",
      });
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    setHealth((current) => ({
      details: current.details,
      state: "checking",
    }));

    fetch(
      buildPreviewStatusUrl({
        previewReloadKey,
        previewUrl,
        sandboxSessionId,
      }),
      {
        cache: "no-store",
        signal: controller.signal,
      }
    )
      .then(async (response) => {
        const payload = parsePreviewStatus(await response.json());

        if (isCancelled) {
          return;
        }

        setHealth({
          details: payload,
          state: payload.ok ? "ok" : "error",
        });

        if (payload.ok) {
          appendPreviewLog("log", `Preview check succeeded for ${previewUrl}`);
          return;
        }

        appendPreviewLog("error", formatPreviewStatusSummary(payload));
      })
      .catch((error) => {
        if (isCancelled || controller.signal.aborted) {
          return;
        }

        const details = parsePreviewStatus({
          errorCode: "FETCH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Failed to check preview URL.",
          ok: false,
          status: null,
          statusText: null,
        });

        setHealth({
          details,
          state: "error",
        });
        appendPreviewLog("error", formatPreviewStatusSummary(details));
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [appendPreviewLog, previewReloadKey, previewUrl, sandboxSessionId]);

  return health;
}
