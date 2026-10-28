"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { ChatStatus, UIMessage } from "ai";
import { Compass, Trash2, X } from "lucide-react";
import { PageText, usePageCopy } from "@/components/page-copy";

import {
  getProjectGuideCompanionModelCatalog,
  type ProjectGuideCompanionModel,
} from "../model-catalog";
import { ProjectGuideCompanionMessageList } from "./project-guide-companion-messages";
import { projectGuideCompanionStarterPrompts } from "./project-guide-companion-model";
import { ProjectGuideCompanionModelSelector } from "./project-guide-companion-model-selector";

const projectGuideCompanionModels = getProjectGuideCompanionModelCatalog();

interface ProjectGuideCompanionPanelProps {
  canSend: boolean;
  error: Error | undefined;
  input: string;
  isBusy: boolean;
  isModelSelectorOpen: boolean;
  launcherLabel: string;
  messages: UIMessage[];
  onClearHistory: () => void;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onModelSelectorOpenChange: (open: boolean) => void;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  selectedChatModel: string;
  selectedModel: ProjectGuideCompanionModel | undefined;
  status: ChatStatus;
}

export function ProjectGuideCompanionPanel({
  canSend,
  error,
  input,
  isBusy,
  isModelSelectorOpen,
  launcherLabel,
  messages,
  onClearHistory,
  onClose,
  onInputChange,
  onModelChange,
  onModelSelectorOpenChange,
  onSendMessage,
  onStop,
  selectedChatModel,
  selectedModel,
  status,
}: ProjectGuideCompanionPanelProps) {
  const pageCopy = usePageCopy();

  return (
    <section
      aria-label={pageCopy("Project guide companion")}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[min(82svh,620px)] min-h-0 flex-col overflow-hidden border-border border-t bg-background shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(70vh,640px)] sm:w-[400px] sm:border"
    >
      <ProjectGuideCompanionPanelHeader
        error={error}
        launcherLabel={launcherLabel}
        messages={messages}
        onClearHistory={onClearHistory}
        onClose={onClose}
      />
      <Conversation className="min-h-0 flex-1">
        <ConversationContent
          className="gap-4 px-3 py-3"
          scrollClassName="overflow-y-auto overscroll-contain touch-pan-y"
        >
          {messages.length > 0 ? (
            <ProjectGuideCompanionMessageList
              isBusy={isBusy}
              messages={messages}
              onDemoNavigate={onClose}
            />
          ) : null}
          {error ? (
            <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs">
              <PageText>
                {
                  "Project Compass could not answer. Check model setup or try again."
                }
              </PageText>
            </div>
          ) : null}
        </ConversationContent>
        <ProjectGuideCompanionScrollButton />
      </Conversation>
      <div className="border-border border-t p-3">
        {messages.length === 0 ? (
          <ProjectGuideCompanionStarterSuggestions
            isBusy={isBusy}
            onSendMessage={onSendMessage}
          />
        ) : null}
        <PromptInput onSubmit={({ text }) => onSendMessage(text)}>
          <PromptInputBody>
            <PromptInputTextarea
              className="max-h-24 min-h-10 text-sm"
              disabled={isBusy}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={pageCopy("Ask about the project...")}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-2 py-2">
            <ProjectGuideCompanionModelSelector
              isOpen={isModelSelectorOpen}
              models={projectGuideCompanionModels}
              onModelChange={onModelChange}
              onOpenChange={onModelSelectorOpenChange}
              selectedChatModel={selectedChatModel}
              selectedModel={selectedModel}
            />
            <PromptInputSubmit
              disabled={!(canSend || isBusy)}
              onStop={onStop}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}

export function ProjectGuideCompanionScrollButton() {
  const pageCopy = usePageCopy();

  return (
    <ConversationScrollButton
      aria-label={pageCopy("Scroll companion conversation to bottom")}
      className="bottom-3 z-10"
      title={pageCopy("Scroll to bottom")}
    />
  );
}

function ProjectGuideCompanionPanelHeader({
  error,
  launcherLabel,
  messages,
  onClearHistory,
  onClose,
}: {
  error: Error | undefined;
  launcherLabel: string;
  messages: UIMessage[];
  onClearHistory: () => void;
  onClose: () => void;
}) {
  const pageCopy = usePageCopy();

  return (
    <header className="flex items-start justify-between gap-3 border-border border-b px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted">
          <Compass className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-medium text-sm">
            <PageText>{"Project Compass"}</PageText>
          </h2>
          <p className="truncate text-muted-foreground text-xs">
            {launcherLabel}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ProjectGuideCompanionClearMenu
          disabled={messages.length === 0 && !error}
          onClearHistory={onClearHistory}
        />
        <Button
          aria-label={pageCopy("Close project guide companion")}
          onClick={onClose}
          size="icon-sm"
          title={pageCopy("Close")}
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
    </header>
  );
}

function ProjectGuideCompanionClearMenu({
  disabled,
  onClearHistory,
}: {
  disabled: boolean;
  onClearHistory: () => void;
}) {
  const pageCopy = usePageCopy();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={pageCopy("Clear companion history")}
        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
        disabled={disabled}
        title={pageCopy("Clear history")}
        type="button"
      >
        <Trash2 />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <PageText>{"Clear this session?"}</PageText>
          </DropdownMenuLabel>
          <div className="px-2 pb-2 text-muted-foreground text-xs/relaxed">
            <PageText>
              {
                "This clears Project Compass history in this tab. It cannot be undone."
              }
            </PageText>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <PageText>{"Cancel"}</PageText>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onClearHistory}
            onSelect={onClearHistory}
            variant="destructive"
          >
            <Trash2 />
            <PageText>{"Clear history"}</PageText>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectGuideCompanionStarterSuggestions({
  isBusy,
  onSendMessage,
}: {
  isBusy: boolean;
  onSendMessage: (text: string) => void;
}) {
  return (
    <div className="mb-3 space-y-2">
      <p className="text-muted-foreground text-xs">
        <PageText>{"Need bearings? Ask where to start."}</PageText>
      </p>
      <Suggestions className="flex w-full flex-col items-stretch gap-2 whitespace-normal">
        {projectGuideCompanionStarterPrompts.map((prompt) => (
          <Suggestion
            className="h-auto min-h-8 w-full justify-start whitespace-normal rounded-none px-2 py-1.5 text-left"
            disabled={isBusy}
            key={prompt}
            onClick={onSendMessage}
            suggestion={prompt}
            variant="outline"
          >
            <Compass className="size-3.5" />
            <span className="min-w-0">
              <PageText>{prompt}</PageText>
            </span>
          </Suggestion>
        ))}
      </Suggestions>
    </div>
  );
}
