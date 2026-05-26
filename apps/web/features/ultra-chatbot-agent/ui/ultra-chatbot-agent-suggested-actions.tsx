"use client";

import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";

import { ultraChatbotAgentSuggestedActions } from "../constants";

export function UltraChatbotAgentSuggestedActions({
  onSelect,
}: {
  onSelect: (value: string) => void | Promise<void>;
}) {
  return (
    <div className="w-full space-y-3" data-testid="suggested-actions">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Suggested actions
      </p>
      <Suggestions>
        {ultraChatbotAgentSuggestedActions.map((suggestion) => (
          <Suggestion
            className="h-auto whitespace-normal rounded-xl border border-foreground/10 px-4 py-3 text-left text-xs/relaxed hover:border-foreground/30"
            key={suggestion}
            onClick={onSelect}
            suggestion={suggestion}
          />
        ))}
      </Suggestions>
    </div>
  );
}
