"use client";

import {
  ArrowClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CornersOutIcon,
  FloppyDiskIcon,
  PencilSimpleIcon,
  RowsIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";

export function UltraChatbotAgentVersionFooter({
  currentVersionIndex,
  isEditing = false,
  isLatestVersionView = false,
  mode,
  onChangeVersion,
  onCancelEdit,
  onRestoreVersion,
  onSaveVersion,
  onSetMode,
  onStartEdit,
  saveDisabled = false,
  totalVersions,
}: {
  currentVersionIndex: number;
  isEditing?: boolean;
  isLatestVersionView?: boolean;
  mode: UltraChatbotAgentArtifactMode;
  onChangeVersion: (direction: "newer" | "older" | "latest") => void;
  onCancelEdit?: () => void;
  onRestoreVersion: () => Promise<void> | void;
  onSaveVersion?: () => Promise<void> | void;
  onSetMode: (mode: UltraChatbotAgentArtifactMode) => void;
  onStartEdit?: () => void;
  saveDisabled?: boolean;
  totalVersions: number;
}) {
  const isLatestVersion = currentVersionIndex === 0;
  const isOldestVersion = currentVersionIndex === totalVersions - 1;

  if (totalVersions === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-foreground/10 border-t pt-3">
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

      <div className="flex flex-wrap items-center justify-end gap-2">
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
          {mode === "diff" ? "Preview" : "Diff"}
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

        {isLatestVersionView && onStartEdit && !isEditing ? (
          <div className="ml-3">
            <Button
              disabled={saveDisabled || mode === "diff"}
              onClick={onStartEdit}
              size="sm"
              type="button"
              variant="outline"
            >
              <PencilSimpleIcon className="size-3.5" />
              Edit
            </Button>
          </div>
        ) : null}

        {isLatestVersionView && isEditing && onSaveVersion ? (
          <div className="ml-3 flex items-center gap-2">
            <Button
              disabled={saveDisabled}
              onClick={onCancelEdit}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <XIcon className="size-3.5" />
              <span className="sr-only">Cancel</span>
            </Button>
            <Button
              disabled={saveDisabled}
              onClick={() => void onSaveVersion()}
              size="sm"
              type="button"
              variant="outline"
            >
              <FloppyDiskIcon className="size-3.5" />
              Save version
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
