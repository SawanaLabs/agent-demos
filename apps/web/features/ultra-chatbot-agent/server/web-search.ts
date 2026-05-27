import { generateText, stepCountIs, tool, type Source } from "ai";
import { z } from "zod";

const webSearchInputSchema = z.object({
  query: z.string().trim().min(1),
});

interface UltraChatbotAgentWebSearchToolSource {
  title: string;
  url: string;
}

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const explicitUrlPattern = /\bhttps?:\/\/[^\s)]+/g;

function normalizeCitationUrl(value: string) {
  return value.trim().replace(/[),.;]+$/g, "");
}

function normalizeSearchSource(source: Source): UltraChatbotAgentWebSearchToolSource | null {
  if (source.type !== "source") {
    return null;
  }

  const url = typeof source.url === "string" ? source.url.trim() : "";

  if (!url) {
    return null;
  }

  return {
    title:
      typeof source.title === "string" && source.title.trim().length > 0
        ? source.title.trim()
        : url,
    url,
  };
}

function collectSourcesFromSummary(summary: string) {
  const sources = new Map<string, UltraChatbotAgentWebSearchToolSource>();

  for (const match of summary.matchAll(markdownLinkPattern)) {
    const [, label, rawUrl] = match;

    if (typeof rawUrl !== "string") {
      continue;
    }

    const url = normalizeCitationUrl(rawUrl);
    const title = typeof label === "string" ? label.trim() : "";

    if (!url) {
      continue;
    }

    sources.set(url, {
      title: title || url,
      url,
    });
  }

  for (const match of summary.matchAll(explicitUrlPattern)) {
    const url = normalizeCitationUrl(match[0]);

    if (!url || sources.has(url)) {
      continue;
    }

    sources.set(url, {
      title: url.replace(/^https?:\/\//, ""),
      url,
    });
  }

  return [...sources.values()];
}

export function createUltraChatbotAgentWebSearchTool(input: {
  model: Parameters<typeof generateText>[0]["model"];
  webSearchTool: ReturnType<
    NonNullable<Parameters<typeof generateText>[0]["tools"]>[string]
  >;
}) {
  return tool({
    description:
      "Search the public web for current information and return grounded notes plus concrete sources.",
    inputSchema: webSearchInputSchema,
    execute: async ({ query }) => {
      const result = await generateText({
        model: input.model,
        prompt: query,
        stopWhen: stepCountIs(5),
        system: [
          "You are the Ultra agent's research helper.",
          "Use web_search when the query needs current or external facts.",
          "Return a short synthesis grounded in the search results.",
          "Cite at least two concrete sources when enough evidence is available.",
        ].join(" "),
        tools: {
          web_search: input.webSearchTool,
        },
      });

      const summary = result.text.trim();
      const explicitSources = result.sources
        .map(normalizeSearchSource)
        .filter((source): source is UltraChatbotAgentWebSearchToolSource =>
          source !== null
        );

      return {
        query,
        summary,
        sources:
          explicitSources.length > 0
            ? explicitSources
            : collectSourcesFromSummary(summary),
      };
    },
  });
}
