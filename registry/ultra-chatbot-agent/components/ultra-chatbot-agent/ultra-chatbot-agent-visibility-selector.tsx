"use client";

import {
  CaretDownIcon,
  CheckIcon,
  GlobeIcon,
  LockIcon,
} from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

type UltraChatbotAgentVisibility = "private" | "public";

const ultraChatbotAgentVisibilities = [
  {
    description: "Only this visitor can reopen the chat.",
    icon: LockIcon,
    id: "private",
    label: "Private",
  },
  {
    description:
      "Shared-link behavior is not enabled yet, but the port keeps the public state.",
    icon: GlobeIcon,
    id: "public",
    label: "Public",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: typeof LockIcon;
  id: UltraChatbotAgentVisibility;
  label: string;
}>;

async function updateUltraChatbotAgentVisibility(input: {
  chatId: string;
  visibility: UltraChatbotAgentVisibility;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/visibility`,
    {
      body: JSON.stringify({
        visibility: input.visibility,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update chat visibility.");
  }

  return (await response.json()) as {
    visibility: UltraChatbotAgentVisibility;
  };
}

interface UltraChatbotAgentVisibilitySelectorProps {
  chatId: string;
  disabled?: boolean;
  onChange: (visibility: UltraChatbotAgentVisibility) => void;
  onError: (message: string | null) => void;
  value: UltraChatbotAgentVisibility;
}

export function UltraChatbotAgentVisibilitySelector({
  chatId,
  disabled = false,
  onChange,
  onError,
  value,
}: UltraChatbotAgentVisibilitySelectorProps) {
  const [isPending, setIsPending] = useState(false);
  const selectedVisibility =
    ultraChatbotAgentVisibilities.find(
      (visibility) => visibility.id === value
    ) ?? ultraChatbotAgentVisibilities[0];
  const SelectedIcon = selectedVisibility.icon;

  async function handleSelect(nextVisibility: UltraChatbotAgentVisibility) {
    onError(null);
    setIsPending(true);

    try {
      const result = await updateUltraChatbotAgentVisibility({
        chatId,
        visibility: nextVisibility,
      });
      onChange(result.visibility);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to update chat visibility."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            size: "sm",
            variant: "outline",
          }),
          "data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
        )}
        disabled={disabled || isPending}
        type="button"
      >
        <SelectedIcon className="size-3.5" />
        {selectedVisibility.label}
        <CaretDownIcon className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {ultraChatbotAgentVisibilities.map((visibility) => {
          const VisibilityIcon = visibility.icon;
          const isSelected = visibility.id === value;

          return (
            <DropdownMenuItem
              className="flex items-start justify-between gap-3"
              key={visibility.id}
              onSelect={() => handleSelect(visibility.id)}
            >
              <div className="flex gap-3">
                <VisibilityIcon className="mt-0.5 size-4" />
                <div>
                  <p className="text-sm">{visibility.label}</p>
                  <p className="text-muted-foreground text-xs/relaxed">
                    {visibility.description}
                  </p>
                </div>
              </div>
              {isSelected ? <CheckIcon className="mt-0.5 size-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
