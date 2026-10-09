import { describe, expect, it } from "vitest";

import { explorerCorpusNotes } from "./corpus";
import {
  createExplorerTools,
  readCorpusNote,
  searchCorpusNotes,
} from "./tools";

describe("multi-agent explorer corpus tools", () => {
  it("ranks notes by title, tag, then body relevance deterministically", () => {
    const results = searchCorpusNotes("orchestrator fan-out subagents", 3);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.noteId).toBe("explorer-fanout-research");
    expect(results).toEqual(
      searchCorpusNotes("orchestrator fan-out subagents", 3)
    );
    expect(results.map((result) => result.score)).toEqual(
      [...results.map((result) => result.score)].sort(
        (left, right) => right - left
      )
    );
  });

  it("returns a matching note for a topical query and honors the limit", () => {
    const results = searchCorpusNotes("pipeline", 3);

    expect(results[0]?.noteId).toBe("sequential-pipeline");
    expect(results.length).toBeLessThanOrEqual(3);
    expect(searchCorpusNotes("pipeline", 1)).toHaveLength(1);
  });

  it("returns no results for terms outside the corpus", () => {
    expect(searchCorpusNotes("quantum chromodynamics")).toEqual([]);
    expect(searchCorpusNotes("")).toEqual([]);
  });

  it("reads notes by id and misses cleanly", () => {
    const note = readCorpusNote("synthesis-report-patterns");

    expect(note?.title).toBe("Synthesis and report patterns");
    expect(readCorpusNote("missing-note")).toBeUndefined();
  });

  it("exposes exactly the two narrow explorer tools", () => {
    const tools = createExplorerTools();

    expect(Object.keys(tools)).toEqual(["read_note", "search_notes"]);
    expect(explorerCorpusNotes.length).toBeGreaterThanOrEqual(8);
  });
});
