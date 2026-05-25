"use client";

import { CornerDownLeftIcon, LoaderCircleIcon, SquareIcon } from "lucide-react";
import type {
  ComponentProps,
  FormEvent,
  HTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PromptStatus = "error" | "ready" | "streaming" | "submitted";

interface PromptInputContextValue {
  setText: (text: string) => void;
  text: string;
}

interface PromptInputMessage {
  text: string;
}

interface PromptInputProps
  extends Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  children: ReactNode;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
}

interface PromptInputSubmitProps
  extends Omit<ComponentProps<typeof Button>, "children" | "type"> {
  onStop?: () => void;
  status?: PromptStatus;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInputContext() {
  const context = useContext(PromptInputContext);

  if (!context) {
    throw new Error(
      "PromptInput components must be used inside <PromptInput>."
    );
  }

  return context;
}

export function PromptInput({
  children,
  className,
  onSubmit,
  ...props
}: PromptInputProps) {
  const [text, setText] = useState("");

  const contextValue = useMemo(
    () => ({
      setText,
      text,
    }),
    [text]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextText = text.trim();
      if (!nextText) {
        return;
      }

      const result = onSubmit({ text: nextText }, event);

      try {
        await result;
        setText("");
      } catch {
        // Keep the text for retry after a failed submit.
      }
    },
    [onSubmit, text]
  );

  return (
    <PromptInputContext.Provider value={contextValue}>
      <form
        className={cn("w-full", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export function PromptInputBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid", className)} {...props} />;
}

export function PromptInputFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function PromptInputTextarea({
  className,
  disabled,
  onChange,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const context = usePromptInputContext();

  return (
    <Textarea
      className={cn(
        "min-h-16 resize-none rounded-none border-0 px-3 py-3 shadow-none focus-visible:ring-0",
        className
      )}
      disabled={disabled}
      onChange={(event) => {
        context.setText(event.currentTarget.value);
        onChange?.(event);
      }}
      value={context.text}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  className,
  disabled,
  onClick,
  onStop,
  size = "icon",
  status = "ready",
  variant = "default",
  ...props
}: PromptInputSubmitProps) {
  const { text } = usePromptInputContext();
  const isBusy = status === "submitted" || status === "streaming";
  const isDisabled = Boolean(disabled) || (!isBusy && text.trim().length === 0);

  let icon = <CornerDownLeftIcon className="size-4" />;

  if (status === "submitted") {
    icon = <LoaderCircleIcon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    icon = <SquareIcon className="size-4" />;
  }

  return (
    <Button
      aria-label={isBusy ? "Stop" : "Submit"}
      className={cn(className)}
      disabled={isDisabled}
      onClick={(event) => {
        if (isBusy && onStop) {
          event.preventDefault();
          onStop();
          return;
        }

        onClick?.(event);
      }}
      size={size}
      type={isBusy && onStop ? "button" : "submit"}
      variant={variant}
      {...props}
    >
      {icon}
    </Button>
  );
}
