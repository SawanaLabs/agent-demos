"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import type { UIMessage } from "ai";
import { isTextUIPart, isToolUIPart } from "ai";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";

import {
  extractProjectGuideCompanionToolLine,
  getProjectGuideCompanionSourceDisplayLabel,
  getProjectGuideCompanionTextContent,
  type ProjectGuideCompanionDemoResult,
  type ProjectGuideCompanionToolPart,
} from "./project-guide-companion-model";

export function ProjectGuideCompanionMessageList({
  isBusy,
  messages,
  onDemoNavigate,
}: {
  isBusy: boolean;
  messages: UIMessage[];
  onDemoNavigate: () => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <ProjectGuideCompanionMessage
          key={message.id}
          message={message}
          onDemoNavigate={onDemoNavigate}
        />
      ))}
      {isBusy && messages.at(-1)?.role === "user" ? (
        <Shimmer className="text-sm">Thinking....</Shimmer>
      ) : null}
    </div>
  );
}

function ProjectGuideCompanionMessage({
  message,
  onDemoNavigate,
}: {
  message: UIMessage;
  onDemoNavigate: () => void;
}) {
  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent className="max-w-[88%] rounded-none border border-primary bg-primary px-3 py-2 text-primary-foreground text-sm">
          <MessageResponse>
            {getProjectGuideCompanionTextContent(message)}
          </MessageResponse>
        </MessageContent>
      </Message>
    );
  }

  const textParts = message.parts
    .filter(isTextUIPart)
    .filter((part) => part.text.trim());
  const toolEntries = message.parts.filter(isToolUIPart).map((part, index) => {
    const toolPart = part as ProjectGuideCompanionToolPart;

    return {
      key: part.toolCallId ?? `tool-${index}`,
      part: toolPart,
      toolLine: hasProjectGuideCompanionToolError(toolPart)
        ? null
        : extractProjectGuideCompanionToolLine(toolPart),
    };
  });

  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent className="max-w-[92%] space-y-2 text-sm">
        {toolEntries.map(({ key, part, toolLine }) => (
          <ProjectGuideCompanionToolLine
            key={key}
            part={part}
            toolLine={toolLine}
          />
        ))}
        {textParts.map((part, index) => (
          <MessageResponse key={`text-${index}`}>{part.text}</MessageResponse>
        ))}
        {toolEntries.map(({ key, toolLine }) =>
          toolLine ? (
            <ProjectGuideCompanionDemoResults
              key={`${key}-demo-results`}
              onDemoNavigate={onDemoNavigate}
              results={toolLine.demoResults}
            />
          ) : null
        )}
      </MessageContent>
    </Message>
  );
}

function ProjectGuideCompanionToolLine({
  part,
  toolLine,
}: {
  part: ProjectGuideCompanionToolPart;
  toolLine: ReturnType<typeof extractProjectGuideCompanionToolLine> | null;
}) {
  if (!toolLine) {
    return null;
  }

  const sources = [...toolLine.visibleSources, ...toolLine.hiddenSources];
  const hasInput = part.input !== undefined;
  const hasOutput = part.output !== undefined;

  return (
    <Collapsible className="group">
      <CollapsibleTrigger className="flex min-h-6 w-full items-start gap-1.5 text-left text-muted-foreground text-xs">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="shrink-0">
            {toolLine.isPending ? (
              <Shimmer as="span">{toolLine.label}</Shimmer>
            ) : (
              toolLine.label
            )}
          </span>
          {sources.map((source) => (
            <Badge
              className="min-w-0 max-w-48 justify-start rounded-none px-1.5 py-0 font-normal"
              key={`${source.label}-${source.line ?? ""}`}
              title={source.label}
              variant="outline"
            >
              <span className="truncate">
                {getProjectGuideCompanionSourceDisplayLabel(source)}
              </span>
            </Badge>
          ))}
        </span>
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-transform group-data-[state=open]:rotate-180">
          <ChevronDown className="size-3" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-1.5 pl-3 text-[11px]">
        {hasInput ? (
          <ProjectGuideCompanionToolDetail label="Input" value={part.input} />
        ) : null}
        {hasOutput ? (
          <ProjectGuideCompanionToolDetail label="Output" value={part.output} />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

const maxVisibleDemoResults = 4;

function ProjectGuideCompanionDemoResults({
  onDemoNavigate,
  results,
}: {
  onDemoNavigate: () => void;
  results: ProjectGuideCompanionDemoResult[];
}) {
  if (results.length === 0) {
    return null;
  }

  const visibleResults = results.slice(0, maxVisibleDemoResults);
  const hiddenResultCount = results.length - visibleResults.length;

  return (
    <div className="mt-2 space-y-2">
      {visibleResults.map((result) => (
        <ProjectGuideCompanionDemoResultCard
          key={result.href ?? result.slug ?? result.title}
          onDemoNavigate={onDemoNavigate}
          result={result}
        />
      ))}
      {hiddenResultCount > 0 ? (
        <p className="text-muted-foreground text-xs">
          {hiddenResultCount} more demos are available in tool details.
        </p>
      ) : null}
    </div>
  );
}

function ProjectGuideCompanionDemoResultCard({
  onDemoNavigate,
  result,
}: {
  onDemoNavigate: () => void;
  result: ProjectGuideCompanionDemoResult;
}) {
  const content = (
    <Card
      className="gap-2 border border-border bg-muted/20 py-2 ring-0 transition-colors group-hover/demo:bg-muted/40"
      size="sm"
    >
      <CardHeader className="gap-1 px-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate">{result.title}</span>
        </CardTitle>
        {result.href ? (
          <CardAction>
            <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover/demo:text-foreground" />
          </CardAction>
        ) : null}
        <CardDescription className="flex flex-wrap gap-1">
          {getProjectGuideCompanionDemoMeta(result).map((label) => (
            <Badge
              className="rounded-none px-1.5 py-0 font-normal"
              key={label}
              variant="outline"
            >
              {label}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      {result.summary ? (
        <CardContent className="px-3">
          <p className="line-clamp-2 text-muted-foreground text-xs/relaxed">
            {result.summary}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );

  if (!result.href) {
    return content;
  }

  return (
    <Link
      className="group/demo block outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      href={result.href}
      onClick={onDemoNavigate}
      prefetch={false}
    >
      {content}
    </Link>
  );
}

function getProjectGuideCompanionDemoMeta(
  result: ProjectGuideCompanionDemoResult
) {
  return [result.status, result.pattern, result.source].filter(
    (label): label is string => Boolean(label)
  );
}

function hasProjectGuideCompanionToolError(
  part: ProjectGuideCompanionToolPart
) {
  return Boolean(part.errorText) || part.state === "output-error";
}

function ProjectGuideCompanionToolDetail({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-muted-foreground uppercase">{label}</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words border border-border/70 bg-muted/20 p-2 text-foreground">
        {formatProjectGuideCompanionToolDetail(value)}
      </pre>
    </div>
  );
}

function formatProjectGuideCompanionToolDetail(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}
