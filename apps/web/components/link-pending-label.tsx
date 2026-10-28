"use client";

import { useLinkStatus } from "next/link";
import { PageText } from "@/components/page-copy";

interface LinkPendingLabelProps {
  pendingLabel: string;
  readyLabel: string;
}

export function LinkPendingLabel({
  pendingLabel,
  readyLabel,
}: LinkPendingLabelProps) {
  const { pending } = useLinkStatus();

  return (
    <span aria-live="polite">
      <PageText>{pending ? pendingLabel : readyLabel}</PageText>
    </span>
  );
}
