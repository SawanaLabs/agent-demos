"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { Compass, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { prepareProjectGuideCompanionContextMessages } from "../message-history";
import {
  findProjectGuideCompanionModel,
  getProjectGuideCompanionDefaultModel,
} from "../model-catalog";
import {
  getProjectGuideCompanionSurface,
  type ProjectGuideCompanionSurface,
  projectGuideCompanionRevealStorageKey,
  projectGuideCompanionStorageKey,
  projectStorableCompanionMessages,
  projectVisibleCompanionMessages,
} from "./project-guide-companion-model";
import { ProjectGuideCompanionPanel } from "./project-guide-companion-panel";

function readStoredMessages() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.sessionStorage.getItem(
    projectGuideCompanionStorageKey
  );

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? projectStorableCompanionMessages(parsedValue as UIMessage[])
      : [];
  } catch {
    return [];
  }
}

function persistMessages(messages: UIMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storableMessages = projectStorableCompanionMessages(messages);

  if (storableMessages.length === 0) {
    window.sessionStorage.removeItem(projectGuideCompanionStorageKey);
    return;
  }

  window.sessionStorage.setItem(
    projectGuideCompanionStorageKey,
    JSON.stringify(storableMessages)
  );
}

function createProjectGuideCompanionTransport(
  getSelectedChatModel: () => string
) {
  return new DefaultChatTransport({
    api: "/api/project-guide-companion",
    credentials: "include",
    prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          messages: prepareProjectGuideCompanionContextMessages({
            messages: projectVisibleCompanionMessages(messages),
          }),
          selectedChatModel: getSelectedChatModel(),
        },
      };
    },
  });
}

function getLauncherLabel(surface: ProjectGuideCompanionSurface) {
  switch (surface) {
    case "demo":
      return "Project guide";
    case "guide":
      return "Guide companion";
    case "home":
      return "Project compass";
    default:
      return "Project compass";
  }
}

export function ProjectGuideCompanion() {
  const pathname = usePathname();
  const surface = getProjectGuideCompanionSurface(pathname);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedChatModel, setSelectedChatModel] = useState(
    getProjectGuideCompanionDefaultModel
  );
  const [showReveal, setShowReveal] = useState(false);
  const selectedChatModelRef = useRef(selectedChatModel);
  const transport = useMemo(
    () =>
      createProjectGuideCompanionTransport(() => selectedChatModelRef.current),
    []
  );
  const {
    clearError,
    error,
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    transport,
  });
  const isBusy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !isBusy;
  const selectedModel = findProjectGuideCompanionModel(selectedChatModel);

  useEffect(() => {
    setMessages(readStoredMessages());
    setHasLoadedStorage(true);
  }, [setMessages]);

  useEffect(() => {
    selectedChatModelRef.current = selectedChatModel;
  }, [selectedChatModel]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    persistMessages(messages);
  }, [hasLoadedStorage, messages]);

  useEffect(() => {
    if (surface !== "home" || typeof window === "undefined") {
      setShowReveal(false);
      return;
    }

    if (window.sessionStorage.getItem(projectGuideCompanionRevealStorageKey)) {
      return;
    }

    window.sessionStorage.setItem(projectGuideCompanionRevealStorageKey, "1");
    setShowReveal(true);

    const timeoutId = window.setTimeout(() => setShowReveal(false), 9000);

    return () => window.clearTimeout(timeoutId);
  }, [surface]);

  useEffect(() => {
    if (!showReveal) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setShowReveal(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showReveal]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;

      if (
        rootRef.current?.contains(target) ||
        target.closest("[data-slot='dialog-content']") ||
        target.closest("[data-slot='dropdown-menu-content']")
      ) {
        return;
      }

      setShowReveal(false);
      setIsOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!(surface && hasLoadedStorage)) {
    return null;
  }

  async function sendCurrentMessage(text: string) {
    const trimmedText = text.trim();

    if (!trimmedText || isBusy) {
      return;
    }

    setInput("");
    setShowReveal(false);
    await sendMessage({ text: trimmedText });
  }

  function clearHistory() {
    clearError();
    setMessages([]);
    window.sessionStorage.removeItem(projectGuideCompanionStorageKey);
  }

  function openPanel() {
    setShowReveal(false);
    setIsOpen(true);
  }

  function closePanel() {
    setShowReveal(false);
    setIsOpen(false);
  }

  function handleModelChange(modelId: string) {
    selectedChatModelRef.current = modelId;
    setSelectedChatModel(modelId);
  }

  return (
    <div ref={rootRef}>
      {isOpen ? (
        <ProjectGuideCompanionPanel
          canSend={canSend}
          error={error}
          input={input}
          isBusy={isBusy}
          isModelSelectorOpen={isModelSelectorOpen}
          launcherLabel={getLauncherLabel(surface)}
          messages={messages}
          onClearHistory={clearHistory}
          onClose={closePanel}
          onInputChange={setInput}
          onModelChange={handleModelChange}
          onModelSelectorOpenChange={setIsModelSelectorOpen}
          onSendMessage={sendCurrentMessage}
          onStop={stop}
          selectedChatModel={selectedChatModel}
          selectedModel={selectedModel}
          status={status}
        />
      ) : (
        <ProjectGuideCompanionLauncher
          onDismissReveal={() => setShowReveal(false)}
          onOpen={openPanel}
          showReveal={showReveal}
          surface={surface}
        />
      )}
    </div>
  );
}

function ProjectGuideCompanionLauncher({
  onDismissReveal,
  onOpen,
  showReveal,
  surface,
}: {
  onDismissReveal: () => void;
  onOpen: () => void;
  showReveal: boolean;
  surface: ProjectGuideCompanionSurface;
}) {
  return (
    <>
      {showReveal ? (
        <div className="fixed right-3 bottom-16 z-50 w-[min(18rem,calc(100vw-1.5rem))] border border-foreground bg-foreground px-3 py-2 text-background shadow-lg sm:right-4 sm:bottom-20">
          <div className="flex items-start gap-2">
            <Compass className="mt-0.5 size-4 shrink-0" />
            <p className="min-w-0 flex-1 text-sm">
              Lots to explore here. I can help you find the fastest path in.
            </p>
            <Button
              aria-label="Dismiss companion greeting"
              className="-mt-1 -mr-1 text-background hover:bg-background/15 hover:text-background focus-visible:ring-background/50"
              onClick={onDismissReveal}
              size="icon-xs"
              title="Dismiss"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        aria-label="Open project guide companion"
        className={cn(
          "fixed right-3 bottom-3 z-50 shadow-lg sm:right-4 sm:bottom-4",
          surface === "demo" ? "size-10" : "size-12"
        )}
        onClick={onOpen}
        title="Open Project Compass"
        type="button"
      >
        <Compass className={surface === "demo" ? "size-4" : "size-5"} />
      </Button>
    </>
  );
}
