"use client";

import { createContext, type ReactNode, useContext } from "react";

type TranslatePageCopy = (source: string) => string;

const PageCopyContext = createContext<TranslatePageCopy>((source) => source);

// Registry consumers keep readable English without a site-level locale provider.
export function PageCopyProvider({
  children,
  translate,
}: {
  children: ReactNode;
  translate: TranslatePageCopy;
}) {
  return (
    <PageCopyContext.Provider value={translate}>
      {children}
    </PageCopyContext.Provider>
  );
}

export function usePageCopy() {
  return useContext(PageCopyContext);
}

export function PageText({ children }: { children: string }) {
  const copy = usePageCopy();
  return copy(children);
}
