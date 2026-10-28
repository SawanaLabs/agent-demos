"use client";

import { Button } from "@workspace/ui/components/button";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "./actions";

export function LanguageSwitch() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const targetLocale = locale === "en" ? "zh-CN" : "en";
  const label = targetLocale === "zh-CN" ? "中文" : "English";

  return (
    <Button
      aria-label={locale === "en" ? "Switch to Chinese" : "切换为英文"}
      className="fixed top-4 right-16 z-40 gap-1.5 shadow-sm"
      disabled={pending}
      onClick={() => startTransition(async () => setLocale(targetLocale))}
      size="sm"
      type="button"
      variant="outline"
    >
      <Languages aria-hidden="true" className="size-4" />
      <span lang={targetLocale}>{label}</span>
    </Button>
  );
}
