"use client";

import { Card } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

import { UxApprovalCard } from "./components/ux-approval-card";
import { UxPromptBar } from "./components/ux-prompt-bar";
import { UxStreamingText } from "./components/ux-streaming-text";
import { UxThinkingTrace } from "./components/ux-thinking-trace";
import { UxToolChips } from "./components/ux-tool-chips";

interface PrimitiveSection {
  description: string;
  id: string;
  render: () => React.ReactNode;
  title: string;
}

const sections: PrimitiveSection[] = [
  {
    description:
      "Composer with @-mention source picker, /-command picker, model selector, and dictation slot. Enter submits; picked sources and commands pin as removable chips.",
    id: "prompt-bar",
    render: () => <UxPromptBar />,
    title: "Prompt Bar",
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
      "A card where the agent pauses and asks a yes / no / edit question before acting. Buttons resolve the card in place and record the verdict.",
    id: "approval-card",
    render: () => <UxApprovalCard />,
    title: "Approval Card",
  },
];

export function AgentUxPrimitivesWorkspace() {
  return (
    <div className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
      {sections.map((section) => (
        <section
          className={cn(
            "flex flex-col gap-3",
            section.id === "prompt-bar" && "md:col-span-2"
          )}
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
