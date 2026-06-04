import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";

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

  const seenSourceKeys = new Map<string, number>();
  const keyedSources = sources.map((source) => {
    const baseKey = `${source.sourceId}-${source.url}-${source.title}`;
    const nextCount = (seenSourceKeys.get(baseKey) ?? 0) + 1;
    seenSourceKeys.set(baseKey, nextCount);

    return {
      key: nextCount === 1 ? baseKey : `${baseKey}-${nextCount}`,
      source,
    };
  });

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {keyedSources.map(({ key, source }) => (
          <Source href={source.url} key={key} title={source.title} />
        ))}
      </SourcesContent>
    </Sources>
  );
}
