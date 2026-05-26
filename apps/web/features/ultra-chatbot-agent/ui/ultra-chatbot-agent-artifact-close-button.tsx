"use client";

import { XIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";

export function UltraChatbotAgentArtifactCloseButton({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Button onClick={onClose} size="icon" type="button" variant="ghost">
      <XIcon className="size-4" />
      <span className="sr-only">Close artifact</span>
    </Button>
  );
}
