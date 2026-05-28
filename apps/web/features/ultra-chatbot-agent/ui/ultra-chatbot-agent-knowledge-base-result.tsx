"use client";

import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentKnowledgeBaseResult } from "./ultra-chatbot-agent-message-parts";

export function UltraChatbotAgentKnowledgeBaseResultCard({
  result,
}: {
  result: UltraChatbotAgentKnowledgeBaseResult;
}) {
  const seenSourceKeys = new Map<string, number>();
  const seenSnippetKeys = new Map<string, number>();
  const keyedSnippets = result.snippets.slice(0, 3).map((snippet) => {
    const baseKey = `${snippet.documentUrl}-${snippet.citationLabel}-${snippet.content}`;
    const nextCount = (seenSnippetKeys.get(baseKey) ?? 0) + 1;
    seenSnippetKeys.set(baseKey, nextCount);

    return {
      key: nextCount === 1 ? baseKey : `${baseKey}-${nextCount}`,
      snippet,
    };
  });
  const keyedSources = result.sources.map((source) => {
    const baseKey = `${source.url}-${source.title}`;
    const nextCount = (seenSourceKeys.get(baseKey) ?? 0) + 1;
    seenSourceKeys.set(baseKey, nextCount);

    return {
      key: nextCount === 1 ? baseKey : `${baseKey}-${nextCount}`,
      source,
    };
  });

  return (
    <article className="w-full space-y-4 border border-foreground/15 bg-background px-5 py-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Knowledge base</Badge>
          <Badge variant={result.answerable ? "secondary" : "outline"}>
            {result.answerable ? "Grounded" : "Low confidence"}
          </Badge>
          <Badge variant="secondary">{result.sources.length} sources</Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Query
          </p>
          <h3 className="mt-2 text-balance font-medium text-lg">
            {result.query}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {result.message}
        </p>
      </div>

      {result.snippets.length > 0 ? (
        <div className="space-y-3">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Retrieved snippets
          </p>
          <div className="grid gap-3">
            {keyedSnippets.map(({ key, snippet }) => (
              <div
                className="space-y-2 border border-foreground/10 bg-muted/20 px-3 py-3"
                key={key}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{snippet.citationLabel}</Badge>
                  {snippet.sectionTitle ? (
                    <Badge variant="secondary">{snippet.sectionTitle}</Badge>
                  ) : null}
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed">
                  {snippet.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.sources.length > 0 ? (
        <div className="space-y-2 border-foreground/10 border-t pt-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Resources
          </p>
          <div className="flex flex-wrap gap-2">
            {keyedSources.map(({ key, source }) => (
              <a
                className="border border-foreground/15 px-2.5 py-1 text-xs transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                href={source.url}
                key={key}
                rel="noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
