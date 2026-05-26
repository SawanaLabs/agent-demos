import { SparkleIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentSuggestionRecord } from "../server/suggestion-store";

export function UltraChatbotAgentDocumentSuggestions({
  suggestions,
}: {
  suggestions: UltraChatbotAgentSuggestionRecord[];
}) {
  if (suggestions.length === 0) {
    return (
      <div className="border border-dashed border-foreground/10 px-3 py-4 text-muted-foreground text-xs/relaxed">
        Ask the agent to review this document when you want sentence-level improvement suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion) => (
        <div
          className="space-y-2 border border-foreground/10 px-3 py-3"
          key={suggestion.id}
        >
          <div className="flex items-center gap-2">
            <SparkleIcon className="size-3.5 text-muted-foreground" />
            <Badge variant="secondary">Suggestion</Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Original
            </p>
            <p>{suggestion.originalText}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Suggested
            </p>
            <p>{suggestion.suggestedText}</p>
          </div>
          {suggestion.description ? (
            <p className="text-muted-foreground text-xs/relaxed">
              {suggestion.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
