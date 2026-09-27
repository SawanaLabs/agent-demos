/**
 * A small deterministic knowledge base about multi-agent design patterns.
 *
 * Explorer subagents query these notes through the `search_notes` and
 * `read_note` tools. Keeping the corpus in-repo makes the demo reproducible:
 * no external search dependency, no network calls, and every run can be
 * replayed against the same evidence.
 */
export interface ExplorerCorpusNote {
  body: string;
  noteId: string;
  tags: string[];
  title: string;
}

export const explorerCorpusNotes: ExplorerCorpusNote[] = [
  {
    body: "The orchestrator-worker pattern puts one lead model in charge of decomposition and delegation. The lead breaks an open-ended task into independent subtasks, hands each to a worker subagent with a narrow brief, then merges the results. Workers run their own tool loop and return compact findings instead of raw transcripts. The pattern shines when subtasks are independent enough to run concurrently.",
    noteId: "orchestrator-workers-overview",
    tags: ["delegation", "fan-out", "lead", "orchestration", "workers"],
    title: "Orchestrator-worker overview",
  },
  {
    body: "In the explorer fan-out pattern the lead agent turns a research question into two to four focused subtopics. Each subtopic is delegated to an explorer subagent that searches, reads, and summarizes evidence in isolation. Explorers run concurrently, so wall-clock time tracks the slowest subagent rather than the sum of all subagents. The lead never duplicates the explorers' retrieval work; it only plans and synthesizes.",
    noteId: "explorer-fanout-research",
    tags: ["explorer", "fan-out", "parallel", "research", "subagent"],
    title: "Explorer fan-out for research",
  },
  {
    body: "A sequential pipeline processes work through ordered stages where each stage's output becomes the next stage's input. It is easy to reason about and debug because there is exactly one path of execution. The trade-off is latency: stages cannot overlap, so total time is the sum of every stage. Pipelines fit tasks with true dependencies between stages, not embarrassingly parallel work.",
    noteId: "sequential-pipeline",
    tags: ["latency", "pipeline", "sequential", "stages"],
    title: "Sequential pipeline pattern",
  },
  {
    body: "The evaluator-optimizer pattern pairs a generator with a critic. One agent produces a draft, a second agent scores it against explicit criteria, and the loop repeats until quality passes a threshold or a budget is exhausted. It adds latency and cost but reliably improves artifacts that benefit from critique, like reports or code. Without concrete acceptance criteria the loop tends to churn without converging.",
    noteId: "evaluator-optimizer",
    tags: ["critic", "evaluation", "iteration", "loop", "quality"],
    title: "Evaluator-optimizer loop",
  },
  {
    body: "Parallel voting runs the same task through several agents at once and reconciles their outputs. Aggregation can be majority voting, a judge model, or a merge prompt run by the lead. It is the cheapest way to raise confidence on ambiguous tasks, though it multiplies token spend. Use it when a single answer is often wrong and errors are independent across runs.",
    noteId: "parallel-voting-aggregation",
    tags: ["aggregation", "confidence", "parallel", "redundancy", "voting"],
    title: "Parallel voting and aggregation",
  },
  {
    body: "Subagents get their own context window instead of sharing the lead's transcript. Only a short brief goes in and a compact findings summary comes back, which keeps the lead's context small even when explorers read long documents. Isolation also makes failures local: a crashed explorer loses one subtopic, not the whole run. The cost is that subagents cannot see each other's intermediate reasoning.",
    noteId: "context-isolation-subagents",
    tags: ["context", "isolation", "memory", "subagent", "window"],
    title: "Context isolation for subagents",
  },
  {
    body: "Subagent tools should be narrow, deterministic, and cheap. A good explorer tool does one thing, like searching a corpus or reading one document, and returns structured output the model can cite. Wide tools with side effects or unbounded results make subagent behavior hard to predict and audit. Give each subagent only the tools its brief actually needs.",
    noteId: "narrow-tool-contracts",
    tags: ["contracts", "design", "deterministic", "subagent", "tools"],
    title: "Narrow tool contracts for subagents",
  },
  {
    body: "Multi-agent systems fail in characteristic ways: the lead under-decomposes and explorers overlap, findings get duplicated, or synthesis over-weights whichever explorer wrote the most. Token spend multiplies roughly by subagent count, so cost surprises are common. Error propagation matters too, so decide early whether one failed subagent aborts the run or degrades the report. Logging each agent boundary is the only reliable way to debug.",
    noteId: "multi-agent-failure-modes",
    tags: ["cost", "debugging", "errors", "failure", "reliability"],
    title: "Multi-agent failure modes",
  },
  {
    body: "A single agent with tools wins when the task needs tight feedback between steps, when subtasks share heavy context, or when coordination overhead dwarfs the work itself. Multi-agent decomposition pays off only when subtasks are genuinely independent and large enough to amortize the planning and synthesis calls. Forcing fan-out on a small task makes it slower, more expensive, and harder to follow.",
    noteId: "single-agent-when-better",
    tags: ["simplicity", "single-agent", "trade-offs", "when-not-to"],
    title: "When a single agent is better",
  },
  {
    body: "Lead synthesis works best when explorer outputs carry provenance. The synthesis prompt should ask for a direct answer first, evidence grouped by subtopic with attribution, then contradictions and open questions. Passing raw explorer transcripts into the lead wastes context; pass the compact findings each explorer produced. A good report makes it possible to trace every claim back to one explorer's notes.",
    noteId: "synthesis-report-patterns",
    tags: ["aggregation", "lead", "provenance", "report", "synthesis"],
    title: "Synthesis and report patterns",
  },
];
