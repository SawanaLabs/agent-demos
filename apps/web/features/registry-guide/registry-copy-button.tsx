"use client";

import { Button } from "@workspace/ui/components/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function RegistryCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <Button
      aria-label={copied ? "Copied" : "Copy command"}
      onClick={copyValue}
      size="icon-sm"
      title={copied ? "Copied" : "Copy command"}
      type="button"
      variant="ghost"
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
