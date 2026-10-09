"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowUpIcon,
  AtSignIcon,
  CheckIcon,
  ChevronDownIcon,
  FileTextIcon,
  GlobeIcon,
  MicIcon,
  SearchIcon,
  SparklesIcon,
  TerminalIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  isSourceOption,
  type PickerMode,
  type PickerOption,
  useUxPromptBar,
} from "./ux-prompt-bar-state";
import type {
  UxPromptBarCommand,
  UxPromptBarModel,
  UxPromptBarSource,
  UxPromptBarSubmit,
} from "./ux-prompt-bar-types";

export type {
  UxPromptBarCommand,
  UxPromptBarModel,
  UxPromptBarSource,
  UxPromptBarSubmit,
} from "./ux-prompt-bar-types";

/**
 * UxPromptBar — an interactive prompt input in the beautifului spirit.
 *
 * Interaction patterns recreated here:
 * - Typing `@` opens a source picker anchored above the textarea. Enter
 *   accepts the highlighted option; Escape dismisses. Picked sources
 *   render as removable chips above the input.
 * - Typing `/` as the first character opens a command picker with the
 *   same accept/dismiss keyboard flow. A picked command pins itself as
 *   a `/command` chip until removed.
 * - A compact model picker lives in the footer toolbar.
 * - The bar lifts with a subtle ring while focused.
 * - Enter submits; Shift+Enter inserts a newline; send is disabled on
 *   an empty draft.
 *
 * Self-contained: local state only, no backend. `onSubmit` receives the
 * parsed draft (text + attached sources + command + model) so a host can
 * wire it to a real agent loop.
 *
 * State and keyboard handling live in `./ux-prompt-bar-state.ts`; shared
 * types in `./ux-prompt-bar-types.ts` — kept under the 500-line file cap.
 */

interface UxPromptBarProps {
  className?: string;
  commands?: UxPromptBarCommand[];
  models?: UxPromptBarModel[];
  onSubmit?: (payload: UxPromptBarSubmit) => void;
  placeholder?: string;
  sources?: UxPromptBarSource[];
}

const defaultSources: UxPromptBarSource[] = [
  { id: "doc-readme", kind: "doc", title: "README.md" },
  { id: "doc-arch", kind: "doc", title: "architecture.md" },
  { id: "doc-api", kind: "doc", title: "api-reference.md" },
  { id: "web-docs", kind: "web", title: "docs.example.com" },
  { id: "web-changelog", kind: "web", title: "changelog feed" },
  { id: "tool-github", kind: "tool", title: "github_repo tool" },
];

const defaultCommands: UxPromptBarCommand[] = [
  {
    description: "Search the web and cite sources",
    id: "search",
    name: "search",
  },
  {
    description: "Run a multi-step plan with approvals",
    id: "plan",
    name: "plan",
  },
  {
    description: "Summarize the attached sources",
    id: "summarize",
    name: "summarize",
  },
  {
    description: "Generate UI components as output",
    id: "ui",
    name: "ui",
  },
];

const defaultModels: UxPromptBarModel[] = [
  { id: "auto", label: "Auto" },
  { id: "gpt-5-mini", label: "GPT-5 mini" },
  { id: "gpt-5", label: "GPT-5" },
  { id: "local", label: "Local" },
];

const sourceIcons: Record<UxPromptBarSource["kind"], ReactNode> = {
  doc: <FileTextIcon className="size-3.5" />,
  tool: <WrenchIcon className="size-3.5" />,
  web: <GlobeIcon className="size-3.5" />,
};

const commandIcons: Record<string, ReactNode> = {
  plan: <SparklesIcon className="size-3.5" />,
  search: <SearchIcon className="size-3.5" />,
  summarize: <FileTextIcon className="size-3.5" />,
  ui: <TerminalIcon className="size-3.5" />,
};

interface PickerPanelProps {
  highlightIndex: number;
  onPick: (option: PickerOption) => void;
  options: PickerOption[];
  pickerMode: Exclude<PickerMode, "none">;
}

function PickerPanel({
  highlightIndex,
  onPick,
  options,
  pickerMode,
}: PickerPanelProps) {
  return (
    <div className="absolute inset-x-2 bottom-full z-20 mb-2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
      <div className="border-b px-3 py-1.5 text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
        {pickerMode === "sources" ? "Attach a source" : "Run a command"}
      </div>
      <ul className="max-h-56 overflow-y-auto py-1">
        {options.length === 0 ? (
          <li className="px-3 py-2 text-muted-foreground text-xs">
            No matches.
          </li>
        ) : (
          options.map((option, index) => {
            const isSource = isSourceOption(option);
            const label = isSource ? option.title : `/${option.name}`;
            const meta = isSource ? option.kind : option.description;
            return (
              <li key={option.id}>
                <button
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px]",
                    index === highlightIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/60"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onPick(option);
                  }}
                  type="button"
                >
                  {isSource
                    ? sourceIcons[option.kind]
                    : (commandIcons[option.id] ?? (
                        <TerminalIcon className="size-3.5" />
                      ))}
                  <span className={cn(isSource ? "" : "font-mono text-xs")}>
                    {label}
                  </span>
                  <span className="ml-auto truncate text-[11px] text-muted-foreground">
                    {meta}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        ↑↓ to navigate · Enter to accept · Esc to dismiss
      </div>
    </div>
  );
}

interface AttachmentChipsProps {
  activeCommand: UxPromptBarCommand | null;
  onClearCommand: () => void;
  onRemoveSource: (id: string) => void;
  sources: UxPromptBarSource[];
}

function AttachmentChips({
  activeCommand,
  onClearCommand,
  onRemoveSource,
  sources,
}: AttachmentChipsProps) {
  if (sources.length === 0 && !activeCommand) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
      {activeCommand ? (
        <Badge className="gap-1 font-mono text-[11px]" variant="secondary">
          /{activeCommand.name}
          <button
            aria-label={`Remove /${activeCommand.name}`}
            className="opacity-60 hover:opacity-100"
            onClick={onClearCommand}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ) : null}
      {sources.map((source) => (
        <Badge
          className="gap-1 text-[11px]"
          key={source.id}
          variant="secondary"
        >
          {sourceIcons[source.kind]}
          {source.title}
          <button
            aria-label={`Remove ${source.title}`}
            className="opacity-60 hover:opacity-100"
            onClick={() => onRemoveSource(source.id)}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

interface FooterToolbarProps {
  canSubmit: boolean;
  model: UxPromptBarModel;
  models: UxPromptBarModel[];
  onAttachSource: () => void;
  onSelectModel: (model: UxPromptBarModel) => void;
  onSubmit: () => void;
}

function FooterToolbar({
  canSubmit,
  model,
  models,
  onAttachSource,
  onSelectModel,
  onSubmit,
}: FooterToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t px-2.5 py-2">
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="h-7 gap-1 px-2 font-normal text-[12px] text-muted-foreground"
                size="sm"
                variant="ghost"
              />
            }
          >
            {model.label}
            <ChevronDownIcon className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {models.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onSelectModel(option)}
              >
                <span className="flex-1">{option.label}</span>
                {option.id === model.id ? (
                  <CheckIcon className="size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          aria-label="Attach source"
          className="h-7 w-7 text-muted-foreground"
          onClick={onAttachSource}
          size="icon"
          type="button"
          variant="ghost"
        >
          <AtSignIcon className="size-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          aria-label="Voice input"
          className="h-7 w-7 text-muted-foreground"
          size="icon"
          type="button"
          variant="ghost"
        >
          <MicIcon className="size-3.5" />
        </Button>
        <Button
          aria-label="Send"
          className="h-7 w-7 rounded-lg"
          disabled={!canSubmit}
          onClick={onSubmit}
          size="icon"
          type="button"
        >
          <ArrowUpIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function UxPromptBar({
  sources = defaultSources,
  commands = defaultCommands,
  models = defaultModels,
  placeholder = "Ask anything. Type @ for sources, / for commands.",
  onSubmit,
  className,
}: UxPromptBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const bar = useUxPromptBar({ commands, models, onSubmit, sources });

  return (
    <div
      className={cn(
        "relative rounded-xl ring-1 ring-foreground/10 transition-shadow",
        isFocused && "shadow-lg ring-foreground/20",
        className
      )}
    >
      {bar.pickerOpen ? (
        <PickerPanel
          highlightIndex={bar.highlightIndex}
          onPick={bar.handlePickOption}
          options={bar.pickerOptions}
          pickerMode={bar.pickerMode as Exclude<PickerMode, "none">}
        />
      ) : null}

      <div className="rounded-xl bg-background">
        <AttachmentChips
          activeCommand={bar.activeCommand}
          onClearCommand={bar.clearCommand}
          onRemoveSource={bar.removeSource}
          sources={bar.attachedSources}
        />

        <textarea
          className="min-h-[4.5rem] w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[13.5px]/relaxed outline-none placeholder:text-muted-foreground/70"
          onBlur={() => setIsFocused(false)}
          onChange={bar.handleChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={bar.handleKeyDown}
          placeholder={placeholder}
          ref={bar.textareaRef}
          rows={3}
          value={bar.draft}
        />

        <FooterToolbar
          canSubmit={bar.draft.trim().length > 0}
          model={bar.model}
          models={models}
          onAttachSource={bar.attachSourceFromToolbar}
          onSelectModel={bar.setModel}
          onSubmit={bar.handleSubmit}
        />
      </div>
    </div>
  );
}
