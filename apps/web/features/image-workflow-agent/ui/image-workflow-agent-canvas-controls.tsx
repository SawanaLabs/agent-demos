"use client";

import { Panel } from "@workspace/ui/components/ai-elements/panel";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ImagePlus, Play, RotateCcw } from "lucide-react";
import {
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useRef,
  useState,
} from "react";

import type { ImageResultNodeData } from "../model/workflow-engine";

export interface ImageWorkflowAgentCanvasControlsProps {
  canAddReference: boolean;
  canReset: boolean;
  canRun: boolean;
  hasReference: boolean;
  isRunning: boolean;
  onAddReference: () => void;
  onReset: () => void;
  onRun: () => void;
  resultStatus: ImageResultNodeData["status"];
  revision: number;
}

interface WorkflowToolbarActionProps {
  buttonRef: Ref<HTMLButtonElement>;
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  tabIndex: number;
  variant?: "default" | "outline";
}

const toolbarNavigationKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "End",
  "Home",
]);

export function getNextToolbarActionIndex(
  enabledActions: readonly boolean[],
  currentIndex: number,
  key: string
) {
  const enabledIndices = enabledActions.flatMap((isEnabled, index) =>
    isEnabled ? [index] : []
  );

  if (enabledIndices.length === 0) {
    return -1;
  }

  if (key === "Home") {
    return enabledIndices[0] ?? -1;
  }

  if (key === "End") {
    return enabledIndices.at(-1) ?? -1;
  }

  const currentEnabledIndex = enabledIndices.indexOf(currentIndex);
  const normalizedCurrentIndex =
    currentEnabledIndex === -1 ? 0 : currentEnabledIndex;
  const direction = key === "ArrowLeft" ? -1 : 1;

  return (
    enabledIndices[
      (normalizedCurrentIndex + direction + enabledIndices.length) %
        enabledIndices.length
    ] ?? -1
  );
}

function WorkflowToolbarAction({
  buttonRef,
  children,
  disabled,
  label,
  onClick,
  onFocus,
  onKeyDown,
  tabIndex,
  variant = "outline",
}: WorkflowToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className="disabled:pointer-events-auto"
            disabled={disabled}
            onClick={onClick}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            ref={buttonRef}
            size="icon-lg"
            tabIndex={tabIndex}
            type="button"
            variant={variant}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ImageWorkflowAgentCanvasControls({
  canAddReference,
  canReset,
  canRun,
  hasReference,
  isRunning,
  onAddReference,
  onReset,
  onRun,
  resultStatus,
  revision,
}: ImageWorkflowAgentCanvasControlsProps) {
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeActionIndex, setActiveActionIndex] = useState(0);
  const enabledActions = [canAddReference, canReset, canRun] as const;
  const firstEnabledActionIndex = enabledActions.findIndex(Boolean);
  const tabStopIndex = enabledActions[activeActionIndex]
    ? activeActionIndex
    : firstEnabledActionIndex;

  const createKeyboardHandler =
    (currentIndex: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!toolbarNavigationKeys.has(event.key)) {
        return;
      }

      event.preventDefault();
      const nextIndex = getNextToolbarActionIndex(
        enabledActions,
        currentIndex,
        event.key
      );

      if (nextIndex === -1) {
        return;
      }

      setActiveActionIndex(nextIndex);
      actionRefs.current[nextIndex]?.focus();
    };

  return (
    <>
      <Panel
        className="border-0 bg-transparent p-0 shadow-none"
        position="top-left"
      >
        <div className="flex items-center gap-1.5 border border-border bg-background/95 p-1 shadow-sm backdrop-blur">
          <Badge variant="outline">Revision {revision}</Badge>
          <Badge variant="outline">
            {hasReference ? "Reference attached" : "Prompt only"}
          </Badge>
          <Badge variant="outline">{resultStatus}</Badge>
        </div>
      </Panel>

      <Panel
        className="border-0 bg-transparent p-0 shadow-none"
        position="bottom-center"
      >
        <div
          aria-label="Workflow actions"
          aria-orientation="horizontal"
          className="flex items-center gap-1 border border-border bg-background/95 p-1.5 shadow-lg backdrop-blur"
          role="toolbar"
        >
          <WorkflowToolbarAction
            buttonRef={(node) => {
              actionRefs.current[0] = node;
            }}
            disabled={!canAddReference}
            label="Add reference"
            onClick={onAddReference}
            onFocus={() => setActiveActionIndex(0)}
            onKeyDown={createKeyboardHandler(0)}
            tabIndex={tabStopIndex === 0 ? 0 : -1}
          >
            <ImagePlus aria-hidden="true" />
          </WorkflowToolbarAction>
          <WorkflowToolbarAction
            buttonRef={(node) => {
              actionRefs.current[1] = node;
            }}
            disabled={!canReset}
            label="Reset workflow"
            onClick={onReset}
            onFocus={() => setActiveActionIndex(1)}
            onKeyDown={createKeyboardHandler(1)}
            tabIndex={tabStopIndex === 1 ? 0 : -1}
          >
            <RotateCcw aria-hidden="true" />
          </WorkflowToolbarAction>
          <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
          <WorkflowToolbarAction
            buttonRef={(node) => {
              actionRefs.current[2] = node;
            }}
            disabled={!canRun}
            label="Run workflow"
            onClick={onRun}
            onFocus={() => setActiveActionIndex(2)}
            onKeyDown={createKeyboardHandler(2)}
            tabIndex={tabStopIndex === 2 ? 0 : -1}
            variant="default"
          >
            {isRunning ? (
              <Spinner aria-hidden="true" className="size-4" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </WorkflowToolbarAction>
        </div>
      </Panel>
    </>
  );
}
