import { ragChatbotSourceDocument } from "./source-document";

export interface PortableRagIndexEntry {
  content: string;
  pageLabel: string | null;
  sectionTitle: string;
}

const portableRagIndex: PortableRagIndexEntry[] = [
  {
    content:
      "The NASA logotype is the primary identifying element in the graphics system. The manual treats it as the agency's routine visual signature and expects it to be used consistently across approved communications.",
    pageLabel: null,
    sectionTitle: "The NASA Logotype",
  },
  {
    content:
      "The logotype should keep strong contrast and controlled color use. The sample system emphasizes NASA red, black, and white as core identity colors, with the logotype kept clear of busy backgrounds.",
    pageLabel: null,
    sectionTitle: "The NASA Logotype: Use of Color",
  },
  {
    content:
      "The NASA seal has a narrower role than the logotype. It is reserved for formal, ceremonial, and official contexts, while the logotype is the regular identifier for publications, signage, and day-to-day communications.",
    pageLabel: null,
    sectionTitle: "Seal and Logotype Usage",
  },
  {
    content:
      "The core visual system combines the NASA logotype, the agency color palette, typography, layout discipline, and clear reproduction rules so that public materials feel consistent across many formats.",
    pageLabel: null,
    sectionTitle: "Core Visual System",
  },
];

const wordPattern = /[a-z0-9]+/g;
const stopWords = new Set([
  "a",
  "about",
  "and",
  "be",
  "does",
  "how",
  "in",
  "is",
  "it",
  "manual",
  "of",
  "say",
  "should",
  "summarize",
  "the",
  "this",
  "to",
  "used",
  "what",
]);

function tokenize(value: string): string[] {
  return [...value.toLowerCase().matchAll(wordPattern)]
    .map((match) => match[0])
    .filter((token) => !stopWords.has(token));
}

function scorePortableEntry(queryTokens: string[], entry: PortableRagIndexEntry) {
  const searchableText = `${entry.sectionTitle} ${entry.content}`.toLowerCase();
  const matchedTokens = queryTokens.filter((token) =>
    searchableText.includes(token)
  );

  return matchedTokens.length / Math.max(queryTokens.length, 1);
}

export function getPortableRagIndexResourceCount(): number {
  return 1;
}

export function findPortableRagMatches(query: string) {
  const queryTokens = tokenize(query);

  return portableRagIndex
    .map((entry) => ({
      content: entry.content,
      documentUrl: ragChatbotSourceDocument.documentUrl,
      pageLabel: entry.pageLabel,
      sectionTitle: entry.sectionTitle,
      similarity: scorePortableEntry(queryTokens, entry),
      title: ragChatbotSourceDocument.title,
    }))
    .filter((match) => match.similarity > 0)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 4);
}
