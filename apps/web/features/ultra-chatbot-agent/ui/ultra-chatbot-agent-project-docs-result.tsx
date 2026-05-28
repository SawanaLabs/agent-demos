"use client";

import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentProjectDocsMcpResult } from "./ultra-chatbot-agent-message-parts";

export function UltraChatbotAgentProjectDocsResultCard({
  result,
}: {
  result: UltraChatbotAgentProjectDocsMcpResult;
}) {
  return (
    <article className="w-full space-y-4 border border-foreground/15 bg-background px-5 py-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Project Docs MCP</Badge>
          <Badge variant="secondary">{result.matches.length} matches</Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Docs search
          </p>
          <h3 className="mt-2 text-balance font-medium text-lg">
            {result.query}
          </h3>
        </div>
      </div>

      {result.matches.length > 0 ? (
        <div className="grid gap-3">
          {result.matches.slice(0, 5).map((match) => (
            <div
              className="space-y-2 border border-foreground/10 bg-muted/20 px-3 py-3"
              key={`${match.path}:${match.line}`}
            >
              <p className="break-all font-mono text-muted-foreground text-xs">
                {match.path}:{match.line}
              </p>
              <p className="text-sm leading-relaxed">{match.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No project docs matched this query.
        </p>
      )}
    </article>
  );
}
