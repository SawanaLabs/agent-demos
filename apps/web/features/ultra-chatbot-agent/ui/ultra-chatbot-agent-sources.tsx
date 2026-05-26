import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@workspace/ui/components/ai-elements/sources";

import type { UltraChatbotAgentSourcePart } from "./ultra-chatbot-agent-message-parts";

interface UltraChatbotAgentSourcesProps {
  sources: UltraChatbotAgentSourcePart[];
}

export function UltraChatbotAgentSources({
  sources,
}: UltraChatbotAgentSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source
            href={source.url}
            key={source.sourceId}
            title={source.title}
          />
        ))}
      </SourcesContent>
    </Sources>
  );
}
