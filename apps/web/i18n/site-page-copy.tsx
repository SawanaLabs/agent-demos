"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback } from "react";
import { PageCopyProvider } from "@/components/page-copy";
import { pageCopyKey } from "./locale";

const leadingWhitespace = /^\s*/;
const trailingWhitespace = /\s*$/;

export function SitePageCopy({ children }: { children: ReactNode }) {
  const t = useTranslations("Page");
  const translate = useCallback(
    (source: string) => {
      if (!source.trim()) {
        return source;
      }
      const key = pageCopyKey(source);
      if (!t.has(key)) {
        throw new Error(`Missing page translation: ${source}`);
      }
      return `${source.match(leadingWhitespace)?.[0] ?? ""}${t.raw(key) as string}${source.match(trailingWhitespace)?.[0] ?? ""}`;
    },
    [t]
  );

  return <PageCopyProvider translate={translate}>{children}</PageCopyProvider>;
}
