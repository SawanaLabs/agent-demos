"use client";

import {
  ArrowClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CornersOutIcon,
  RowsIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";

export function UltraChatbotAgentVersionFooter({
  currentVersionIndex,
  mode,
  onChangeVersion,
  onRestoreVersion,
  onSetMode,
  totalVersions,
}: {
  currentVersionIndex: number;
  mode: UltraChatbotAgentArtifactMode;
  onChangeVersion: (direction: "newer" | "older" | "latest") => void;
  onRestoreVersion: () => Promise<void> | void;
  onSetMode: (mode: UltraChatbotAgentArtifactMode) => void;
  totalVersions: number;
}) {
  const isLatestVersion = currentVersionIndex === 0;
  const isOldestVersion = currentVersionIndex === totalVersions - 1;

  if (totalVersions === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-3">
      <div className="flex items-center gap-2">
        <Button
          disabled={isLatestVersion}
          onClick={() => onChangeVersion("newer")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CaretLeftIcon className="size-4" />
          <span className="sr-only">Newer version</span>
        </Button>
        <Badge variant="outline">
          {currentVersionIndex + 1} / {totalVersions}
        </Badge>
        <Button
          disabled={isOldestVersion}
          onClick={() => onChangeVersion("older")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CaretRightIcon className="size-4" />
          <span className="sr-only">Older version</span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => onSetMode(mode === "diff" ? "edit" : "diff")}
          size="sm"
          type="button"
          variant="ghost"
        >
          {mode === "diff" ? (
            <CornersOutIcon className="size-3.5" />
          ) : (
            <RowsIcon className="size-3.5" />
          )}
          {mode === "diff" ? "Edit" : "Diff"}
        </Button>

        <Button
          disabled={isLatestVersion}
          onClick={() => void onRestoreVersion()}
          size="sm"
          type="button"
          variant="outline"
        >
          <ArrowClockwiseIcon className="size-3.5" />
          Restore
        </Button>

        <Button
          disabled={isLatestVersion}
          onClick={() => onChangeVersion("latest")}
          size="sm"
          type="button"
          variant="outline"
        >
          Latest
        </Button>
      </div>
    </div>
  );
}
