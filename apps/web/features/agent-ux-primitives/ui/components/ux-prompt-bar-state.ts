"use client";

import type React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  UxPromptBarCommand,
  UxPromptBarModel,
  UxPromptBarSource,
  UxPromptBarSubmit,
} from "./ux-prompt-bar-types";

/**
 * State hook + keydown handler for `UxPromptBar`.
 *
 * Split out of the component file to keep both under the 500-line file cap
 * (biome `noExcessiveLinesPerFile`) and the 150-line function cap.
 */

export type PickerMode = "none" | "sources" | "commands";
export type PickerOption = UxPromptBarSource | UxPromptBarCommand;

export function isSourceOption(
  option: PickerOption
): option is UxPromptBarSource {
  return "title" in option;
}

interface KeyDownDeps {
  closePicker: () => void;
  handlePickOption: (option: PickerOption) => void;
  handleSubmit: () => void;
  highlightIndex: number;
  pickerOpen: boolean;
  pickerOptions: PickerOption[];
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>;
}

function handlePickerKeyDown(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  deps: KeyDownDeps
) {
  if (!deps.pickerOpen) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      deps.handleSubmit();
    }
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    deps.closePicker();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    deps.setHighlightIndex((index) =>
      deps.pickerOptions.length === 0
        ? 0
        : (index + 1) % deps.pickerOptions.length
    );
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    deps.setHighlightIndex((index) =>
      deps.pickerOptions.length === 0
        ? 0
        : (index - 1 + deps.pickerOptions.length) % deps.pickerOptions.length
    );
    return;
  }
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    const option =
      deps.pickerOptions[deps.highlightIndex] ?? deps.pickerOptions[0];
    if (option) {
      deps.handlePickOption(option);
    }
  }
}

export interface UseUxPromptBarArgs {
  commands: UxPromptBarCommand[];
  models: UxPromptBarModel[];
  onSubmit?: (payload: UxPromptBarSubmit) => void;
  sources: UxPromptBarSource[];
}

export function useUxPromptBar({
  commands,
  models,
  onSubmit,
  sources,
}: UseUxPromptBarArgs) {
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState<UxPromptBarModel>(
    () => models[0] ?? { id: "auto", label: "Auto" }
  );
  const [pickerMode, setPickerMode] = useState<PickerMode>("none");
  const [pickerQuery, setPickerQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [attachedSources, setAttachedSources] = useState<UxPromptBarSource[]>(
    []
  );
  const [activeCommand, setActiveCommand] = useState<UxPromptBarCommand | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredSources = useMemo(() => {
    const query = pickerQuery.toLowerCase();
    return sources.filter(
      (source) =>
        source.title.toLowerCase().includes(query) &&
        !attachedSources.some((attached) => attached.id === source.id)
    );
  }, [pickerQuery, sources, attachedSources]);

  const filteredCommands = useMemo(() => {
    const query = pickerQuery.toLowerCase();
    return commands.filter((command) => command.name.startsWith(query));
  }, [pickerQuery, commands]);

  const pickerOptions =
    pickerMode === "sources" ? filteredSources : filteredCommands;
  const pickerOpen = pickerMode !== "none";

  const openPicker = useCallback((mode: PickerMode, query = "") => {
    setPickerMode(mode);
    setPickerQuery(query);
    setHighlightIndex(0);
  }, []);

  const closePicker = useCallback(() => {
    setPickerMode("none");
    setPickerQuery("");
    setHighlightIndex(0);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    const caret = event.target.selectionStart ?? next.length;
    setDraft(next);

    const beforeCaret = next.slice(0, caret);
    const lastAt = beforeCaret.lastIndexOf("@");

    if (beforeCaret.startsWith("/") && !beforeCaret.includes(" ")) {
      openPicker("commands", beforeCaret.slice(1));
      return;
    }

    if (
      lastAt >= 0 &&
      (lastAt === 0 || /\s/.test(beforeCaret.charAt(lastAt - 1))) &&
      !beforeCaret.slice(lastAt + 1).includes(" ")
    ) {
      openPicker("sources", beforeCaret.slice(lastAt + 1));
      return;
    }

    closePicker();
  };

  const insertTokenAtCaret = useCallback((token: string, strip: number) => {
    const textarea = textareaRef.current;
    setDraft((currentDraft) => {
      const caret = textarea?.selectionStart ?? currentDraft.length;
      const beforeCaret = currentDraft.slice(0, caret);
      const afterCaret = currentDraft.slice(caret);
      const base = beforeCaret.slice(0, beforeCaret.length - strip);
      const needsSpace = base.length > 0 && !base.endsWith(" ");
      return `${base}${needsSpace ? " " : ""}${token} ${afterCaret}`;
    });
  }, []);

  const pickSource = useCallback(
    (source: UxPromptBarSource) => {
      setAttachedSources((current) =>
        current.some((item) => item.id === source.id)
          ? current
          : [...current, source]
      );
      insertTokenAtCaret(`@${source.title}`, pickerQuery.length + 1);
      closePicker();
      textareaRef.current?.focus();
    },
    [pickerQuery, closePicker, insertTokenAtCaret]
  );

  const pickCommand = useCallback(
    (command: UxPromptBarCommand) => {
      setActiveCommand(command);
      setDraft(`/${command.name} `);
      closePicker();
      textareaRef.current?.focus();
    },
    [closePicker]
  );

  const handlePickOption = useCallback(
    (option: PickerOption) => {
      if (isSourceOption(option)) {
        pickSource(option);
      } else {
        pickCommand(option);
      }
    },
    [pickSource, pickCommand]
  );

  const removeSource = useCallback((id: string) => {
    setAttachedSources((current) =>
      current.filter((source) => source.id !== id)
    );
  }, []);

  const clearCommand = useCallback(() => setActiveCommand(null), []);

  const handleSubmit = useCallback(() => {
    setDraft((currentDraft) => {
      const text = currentDraft.trim();
      if (text) {
        onSubmit?.({
          command: activeCommand,
          model,
          sources: attachedSources,
          text,
        });
      }
      return text ? "" : currentDraft;
    });
    setAttachedSources([]);
    setActiveCommand(null);
    closePicker();
  }, [activeCommand, model, attachedSources, onSubmit, closePicker]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handlePickerKeyDown(event, {
      closePicker,
      handlePickOption,
      handleSubmit,
      highlightIndex,
      pickerOpen,
      pickerOptions,
      setHighlightIndex,
    });
  };

  const attachSourceFromToolbar = useCallback(() => {
    openPicker("sources");
    textareaRef.current?.focus();
  }, [openPicker]);

  return {
    activeCommand,
    attachSourceFromToolbar,
    attachedSources,
    clearCommand,
    draft,
    handleChange,
    handleKeyDown,
    handlePickOption,
    handleSubmit,
    highlightIndex,
    model,
    pickerMode,
    pickerOpen,
    pickerOptions,
    removeSource,
    setModel,
    textareaRef,
  };
}
