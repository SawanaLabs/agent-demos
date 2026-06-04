"use client";

import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";

import { ultraChatbotAgentSuggestedActions } from "@/lib/ultra-chatbot-agent/constants";

export function UltraChatbotAgentSuggestedActions({
  onSelect,
}: {
  onSelect: (value: string) => void | Promise<void>;
}) {
  return (
    <div className="w-full" data-testid="suggested-actions">
      <Suggestions className="w-full flex-wrap items-stretch">
        {ultraChatbotAgentSuggestedActions.map((suggestion) => (
          <Suggestion
            className="h-auto max-w-full justify-start whitespace-normal rounded-none px-4 text-left text-sm leading-6"
            key={suggestion}
            onClick={onSelect}
            suggestion={suggestion}
          />
        ))}
      </Suggestions>
    </div>
  );
}
