"use client";

import { useLinkStatus } from "next/link";

interface LinkPendingLabelProps {
  pendingLabel: string;
  readyLabel: string;
}

export function LinkPendingLabel({
  pendingLabel,
  readyLabel,
}: LinkPendingLabelProps) {
  const { pending } = useLinkStatus();

  return <span aria-live="polite">{pending ? pendingLabel : readyLabel}</span>;
}
