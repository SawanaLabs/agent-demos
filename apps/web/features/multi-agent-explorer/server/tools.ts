import { tool } from "ai";
import { z } from "zod";

import { type ExplorerCorpusNote, explorerCorpusNotes } from "./corpus";

const queryTermPattern = /[a-z0-9]+/g;
const sentencePattern = /[^.!?]+[.!?]/g;

export const searchNotesInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("Maximum number of notes to return. Defaults to 3."),
  query: z
    .string()
    .trim()
    .min(1)
    .describe("Keywords describing the evidence to find."),
});

export const searchNotesOutputSchema = z.object({
  results: z.array(
    z.object({
      noteId: z.string(),
      score: z.number(),
      snippet: z.string(),
      title: z.string(),
    })
  ),
});

export const readNoteInputSchema = z.object({
  noteId: z
    .string()
    .trim()
    .min(1)
    .describe("The noteId returned by search_notes."),
});

export const readNoteOutputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({
    body: z.string(),
    noteId: z.string(),
    tags: z.array(z.string()),
    title: z.string(),
  }),
]);

export type ReadNoteInput = z.infer<typeof readNoteInputSchema>;
export type ReadNoteOutput = z.infer<typeof readNoteOutputSchema>;
export type SearchNotesInput = z.infer<typeof searchNotesInputSchema>;
export type SearchNotesOutput = z.infer<typeof searchNotesOutputSchema>;

function tokenize(text: string) {
  return text.toLowerCase().match(queryTermPattern) ?? [];
}

function scoreNote(note: ExplorerCorpusNote, terms: string[]) {
  const body = note.body.toLowerCase();
  const tags = note.tags.join(" ").toLowerCase();
  const title = note.title.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) {
      score += 3;
    }
    if (tags.includes(term)) {
      score += 2;
    }
    if (body.includes(term)) {
      score += 1;
    }
  }

  return score;
}

function createSnippet(note: ExplorerCorpusNote, terms: string[]) {
  const sentences = note.body.match(sentencePattern) ?? [note.body];
  const match = sentences.find((sentence) =>
    terms.some((term) => sentence.toLowerCase().includes(term))
  );

  return (match ?? sentences[0] ?? note.body).trim();
}

export function searchCorpusNotes(
  query: string,
  limit = 3
): SearchNotesOutput["results"] {
  const terms = [...new Set(tokenize(query))].filter((term) => term.length > 1);

  if (terms.length === 0) {
    return [];
  }

  return explorerCorpusNotes
    .map((note) => ({ note, score: scoreNote(note, terms) }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.note.noteId.localeCompare(right.note.noteId)
    )
    .slice(0, limit)
    .map(({ note, score }) => ({
      noteId: note.noteId,
      score,
      snippet: createSnippet(note, terms),
      title: note.title,
    }));
}

export function readCorpusNote(noteId: string): ExplorerCorpusNote | undefined {
  return explorerCorpusNotes.find((note) => note.noteId === noteId);
}

export function createExplorerTools() {
  return {
    read_note: tool({
      description:
        "Read the full body of one corpus note returned by search_notes.",
      execute: ({ noteId }) => {
        const note = readCorpusNote(noteId);

        return note ?? { error: `Unknown note id: ${noteId}.` };
      },
      inputSchema: readNoteInputSchema,
      outputSchema: readNoteOutputSchema,
    }),
    search_notes: tool({
      description:
        "Search the local agent-design corpus for notes relevant to the explorer's subtopic.",
      execute: ({ limit, query }) => ({
        results: searchCorpusNotes(query, limit),
      }),
      inputSchema: searchNotesInputSchema,
      outputSchema: searchNotesOutputSchema,
    }),
  };
}
