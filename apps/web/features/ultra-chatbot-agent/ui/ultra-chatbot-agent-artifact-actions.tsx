"use client";

import {
  ArrowCounterClockwiseIcon,
  FloppyDiskIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { PageText } from "@/components/page-copy";

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
        <PageText>{"Scratch doc"}</PageText>
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
          <PageText>{"Save version"}</PageText>
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
          <PageText>{"Latest"}</PageText>
        </Button>
      ) : null}
    </div>
  );
}
