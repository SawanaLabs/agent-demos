"use client";

import {
  ArrowCounterClockwiseIcon,
  FloppyDiskIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function UltraChatbotAgentArtifactActions({
  canResetToLatest,
  disabled,
  hasSelectedDocument,
  isCreating,
  isLatestVersion,
  isSaving,
  onCreateScratchDocument,
  onResetToLatest,
  onSaveVersion,
}: {
  canResetToLatest: boolean;
  disabled: boolean;
  hasSelectedDocument: boolean;
  isCreating: boolean;
  isLatestVersion: boolean;
  isSaving: boolean;
  onCreateScratchDocument: () => Promise<void> | void;
  onResetToLatest: () => void;
  onSaveVersion: () => Promise<void> | void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        disabled={disabled || isCreating}
        onClick={() => void onCreateScratchDocument()}
        size="sm"
        type="button"
        variant="outline"
      >
        <PlusIcon className="size-3.5" />
        Scratch doc
      </Button>

      {hasSelectedDocument ? (
        <Button
          disabled={disabled || isSaving || !isLatestVersion}
          onClick={() => void onSaveVersion()}
          size="sm"
          type="button"
          variant="outline"
        >
          <FloppyDiskIcon className="size-3.5" />
          Save version
        </Button>
      ) : null}

      {canResetToLatest ? (
        <Button
          disabled={disabled}
          onClick={onResetToLatest}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowCounterClockwiseIcon className="size-3.5" />
          Latest
        </Button>
      ) : null}
    </div>
  );
}
