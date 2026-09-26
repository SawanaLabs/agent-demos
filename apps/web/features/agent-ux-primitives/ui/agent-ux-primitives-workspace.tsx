"use client";

import { Card } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

import { UxApprovalCard } from "./components/ux-approval-card";
import { UxChat } from "./components/ux-chat";
import { UxCodeBlock } from "./components/ux-code-block";
import { UxContextCards } from "./components/ux-context-cards";
import { UxDiffTable } from "./components/ux-diff-table";
import { UxFilterTable } from "./components/ux-filter-table";
import { UxFineTuneCard } from "./components/ux-fine-tune-card";
import { UxInsightCards } from "./components/ux-insight-cards";
import { UxLoadingState } from "./components/ux-loading-state";
import { UxPromptBar } from "./components/ux-prompt-bar";
import { UxRecommendationCard } from "./components/ux-recommendation-card";
import { UxRecordsTable } from "./components/ux-records-table";
import { UxSearch } from "./components/ux-search";
import { UxSelectionActions } from "./components/ux-selection-actions";
import { UxSidebarNav } from "./components/ux-sidebar-nav";
import { UxStreamingText } from "./components/ux-streaming-text";
import { UxTaskRows } from "./components/ux-task-rows";
import { UxThinkingTrace } from "./components/ux-thinking-trace";
import { UxToolChips } from "./components/ux-tool-chips";

interface PrimitiveSection {
  description: string;
  id: string;
  render: () => React.ReactNode;
  title: string;
  wide?: boolean;
}

const sections: PrimitiveSection[] = [
  {
    description:
      "Composer with @-mention source picker, /-command picker, model selector, and dictation slot. Enter submits; picked sources and commands pin as removable chips.",
    id: "prompt-bar",
    render: () => <UxPromptBar />,
    title: "Prompt Bar",
    wide: true,
  },
  {
    description:
      "Pixel-grid loader for long-running work — drive (chevron), dots, and orbit variants on a shared wavefront, plus a shimmering label and a live elapsed timer.",
    id: "loading-state",
    render: () => (
      <div className="flex flex-col items-start gap-3">
        <UxLoadingState label="Churning" variant="drive" />
        <UxLoadingState label="Indexing" variant="dots" />
        <UxLoadingState label="Syncing" variant="orbit" />
      </div>
    ),
    title: "Loading State",
  },
  {
    description:
      "Expandable chain-of-thought rows: each step has a status icon, elapsed time, and a nested detail. Click a row to open it; a live run autoplays the steps.",
    id: "thinking-trace",
    render: () => <UxThinkingTrace />,
    title: "Thinking Trace",
  },
  {
    description:
      "A paragraph that streams itself in character-by-character with a blinking caret. Play / pause / reset controls show the lifecycle states.",
    id: "streaming-text",
    render: () => <UxStreamingText />,
    title: "Streaming Text",
  },
  {
    description:
      "Compact chips representing tool calls with pending / running / done / error status. Click a chip to expand its input and output preview.",
    id: "tool-chips",
    render: () => <UxToolChips />,
    title: "Tool Chips",
  },
  {
    description:
      "Agent task rows enter staggered; the active row expands to detail steps mid-run while the last walks pending → failed → done. Every row stays expandable.",
    id: "task-rows",
    render: () => <UxTaskRows />,
    title: "Task Rows",
  },
  {
    description:
      "Fixed-height tabbed chat panel — the user bubble slides in, then reasoning replies arrive one at a time with source · tool · elapsed labels. Composer is a stub.",
    id: "chat",
    render: () => <UxChat />,
    title: "Chat",
    wide: true,
  },
  {
    description:
      "A card where the agent pauses and asks a yes / no / edit question before acting. Buttons resolve the card in place and record the verdict.",
    id: "approval-card",
    render: () => <UxApprovalCard />,
    title: "Approval Card",
  },
  {
    description:
      "Recommendation with a 3-bar confidence meter and a single CTA. Alternatives opens an in-card drawer that promotes a different option in place.",
    id: "recommendation-card",
    render: () => <UxRecommendationCard />,
    title: "Recommendation Card",
  },
  {
    description:
      "Retrieved knowledge chunks with character counts and PDF / CSV source badges — the citation chips pop in a beat after the cards land.",
    id: "context-cards",
    render: () => <UxContextCards />,
    title: "Context Cards",
  },
  {
    description:
      "Generated code streams in line-by-line behind a block caret — hand-tinted tokens, line numbers, and a live copy button that confirms in place.",
    id: "code-block",
    render: () => <UxCodeBlock />,
    title: "Code Block",
  },
  {
    description:
      "A proposed table edit plays once: red flash, then strikethrough removal and a green added row. The table rests on the completed diff.",
    id: "diff-table",
    render: () => <UxDiffTable />,
    title: "Diff Table",
  },
  {
    description:
      "Compact CRM grid — select-all checkbox with indeterminate state, sortable headers, connection-strength dots, real links, footer count and New property.",
    id: "records-table",
    render: () => <UxRecordsTable />,
    title: "Records Table",
    wide: true,
  },
  {
    description:
      "A filter input and status chips compose to show and hide task rows; hidden rows collapse with a transition instead of popping out.",
    id: "filter-table",
    render: () => <UxFilterTable />,
    title: "Filter Table",
    wide: true,
  },
  {
    description:
      "Mini workspace nav — a sliding pill tracks hover and active items, and the Suppliers group expands into nested rows.",
    id: "sidebar-nav",
    render: () => <UxSidebarNav />,
    title: "Sidebar Nav",
  },
  {
    description:
      "Command-style search with live filtering, highlighted match text, a clear affordance, and an empty state.",
    id: "search",
    render: () => <UxSearch />,
    title: "Search",
  },
  {
    description:
      "Headline metrics with signed deltas and hand-drawn SVG sparklines — the trend shape does the talking, no chart dependency.",
    id: "insight-cards",
    render: () => <UxInsightCards />,
    title: "Insight Cards",
  },
  {
    description:
      "Inspector card — Radius and Opacity sliders scrub a live preview chip; the header flags the edited state and offers reset.",
    id: "fine-tune-card",
    render: () => <UxFineTuneCard />,
    title: "Fine-Tune Card",
  },
  {
    description:
      "Hover or focus a row to float a pill action bar — copy link, comment (expands an inline input), and an overflow menu.",
    id: "selection-actions",
    render: () => <UxSelectionActions />,
    title: "Selection Actions",
  },
];

export function AgentUxPrimitivesWorkspace() {
  return (
    <div className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
      {sections.map((section) => (
        <section
          className={cn("flex flex-col gap-3", section.wide && "md:col-span-2")}
          id={section.id}
          key={section.id}
        >
          <header className="space-y-1">
            <h2 className="font-medium text-foreground text-sm tracking-tight">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {section.description}
            </p>
          </header>
          <Card className="flex min-h-[180px] flex-col items-stretch justify-center gap-3 border-border/80 bg-card p-4">
            {section.render()}
          </Card>
        </section>
      ))}

      <footer className="text-muted-foreground text-xs md:col-span-2">
        Interaction patterns inspired by{" "}
        <a
          className="underline underline-offset-2 hover:text-foreground"
          href="https://www.beautifului.dev/"
          rel="noreferrer"
          target="_blank"
        >
          beautifului.dev
        </a>
        . Implemented from scratch on our shadcn + ai-elements primitives — no
        source copied.
      </footer>
    </div>
  );
}
