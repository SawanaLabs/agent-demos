"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ChevronRightIcon, FileTextIcon } from "lucide-react";
import { toolResultsSchema } from "../model/tool-results";
import { CanvasContent, CanvasDownloads } from "./canvas-content";
import { CanvasImage } from "./canvas-image";

export function CanvasToolResults({ results }: { results: unknown }) {
  const parsed = toolResultsSchema.safeParse(results);
  if (!parsed.success) {
    return null;
  }
  return (
    <div className="space-y-3 py-2">
      {parsed.data.map(({ nodeId, resultIndex, label, reused, content }) => (
        <section className="space-y-2" key={`${nodeId}:${resultIndex}`}>
          <p className="font-medium text-sm">
            {label}
            {reused ? (
              <span className="ml-2 text-muted-foreground text-xs">已复用</span>
            ) : null}
          </p>
          {content.image ? (
            <CanvasImage label={label} src={content.image} />
          ) : null}
          {content.text ? (
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-sm border p-2 text-left text-sm">
                <FileTextIcon aria-hidden="true" className="size-4 shrink-0" />
                查看文本
                <ChevronRightIcon
                  aria-hidden="true"
                  className="ml-auto size-4 transition-transform group-aria-expanded:rotate-90"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <CanvasContent content={{ text: content.text }} label={label} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <CanvasDownloads content={content} label={label} />
          </div>
        </section>
      ))}
    </div>
  );
}
