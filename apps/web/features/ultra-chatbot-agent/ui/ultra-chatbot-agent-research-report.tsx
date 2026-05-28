"use client";

import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentResearchReportResult } from "./ultra-chatbot-agent-message-parts";

function ReportSection({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
        {title}
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li className="leading-relaxed" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UltraChatbotAgentResearchReport({
  report,
}: {
  report: UltraChatbotAgentResearchReportResult;
}) {
  return (
    <article className="w-full space-y-5 border border-foreground/15 bg-background px-5 py-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Research report</Badge>
          <Badge variant="secondary">{report.sources.length} sources</Badge>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
            {report.topic}
          </p>
          <h3 className="mt-2 text-balance font-medium text-xl">
            {report.title}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {report.executiveSummary}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ReportSection items={report.keyFindings} title="Key findings" />
        <ReportSection items={report.recommendations} title="Recommendations" />
      </div>

      <ReportSection items={report.risks} title="Risks" />

      {report.sources.length > 0 ? (
        <div className="space-y-2 border-foreground/10 border-t pt-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
            Resources
          </p>
          <div className="flex flex-wrap gap-2">
            {report.sources.map((source) => {
              const isExternalUrl =
                source.url.startsWith("http://") ||
                source.url.startsWith("https://");
              const className =
                "border border-foreground/15 px-2.5 py-1 text-xs transition-colors";

              return isExternalUrl ? (
                <a
                  className={`${className} hover:bg-accent`}
                  href={source.url}
                  key={`${source.url}-${source.title}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.title}
                </a>
              ) : (
                <span
                  className={className}
                  key={`${source.url}-${source.title}`}
                >
                  {source.title}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
