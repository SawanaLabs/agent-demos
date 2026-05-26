"use client";

import type { DeepPartial } from "ai";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { ContentReviewRecord } from "@/lib/content-review/record";
import type { ContentReviewResult } from "@/lib/content-review/schema";

type ReviewCardStatus = "streaming" | "ready" | "error" | "stopped";

interface ContentReviewResultCardProps {
  errorMessage?: string | null;
  record?: ContentReviewRecord | null;
  result: DeepPartial<ContentReviewResult> | undefined;
  status: ReviewCardStatus;
}

function compactList<T>(items: ReadonlyArray<T | undefined> | undefined): T[] {
  return Array.isArray(items)
    ? items.filter((item): item is T => item !== undefined)
    : [];
}

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDecisionVariant(
  decision: ContentReviewResult["decision"] | undefined
): "default" | "secondary" | "destructive" | "outline" {
  switch (decision) {
    case "approved":
      return "default";
    case "needs_review":
      return "secondary";
    case "blocked":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusCopy(status: ReviewCardStatus) {
  switch (status) {
    case "streaming":
      return "Streaming object";
    case "ready":
      return "Object ready";
    case "stopped":
      return "Generation stopped";
    case "error":
      return "Generation failed";
  }
}

function getRecordStatusCopy(status: ContentReviewRecord["status"]) {
  switch (status) {
    case "pending":
      return "Recording final object";
    case "ready":
      return "Final object recorded";
    case "error":
      return "Record failed";
  }
}

export function ContentReviewResultCard({
  errorMessage,
  record,
  result,
  status,
}: ContentReviewResultCardProps) {
  const categories = compactList(result?.categories);
  const evidence = compactList(result?.evidence);
  const findings = compactList(result?.findings);
  const openQuestions = compactList(result?.openQuestions);
  const riskScore =
    typeof result?.riskScore === "number"
      ? Math.max(0, Math.min(100, result.riskScore))
      : null;

  return (
    <div className="space-y-4 border border-foreground/10 bg-background px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{getStatusCopy(status)}</Badge>
        {result?.decision ? (
          <Badge variant={getDecisionVariant(result.decision)}>
            {toTitleCase(result.decision)}
          </Badge>
        ) : null}
        {riskScore !== null ? (
          <Badge variant="outline">Risk {riskScore}/100</Badge>
        ) : null}
      </div>

      {riskScore !== null ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span>Risk score</span>
            <span className="ml-auto text-muted-foreground tabular-nums">
              {riskScore}
            </span>
          </div>
          <Progress value={riskScore} />
        </div>
      ) : null}

      {record ? (
        <section className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Recorded output
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{getRecordStatusCopy(record.status)}</Badge>
            <Badge variant="outline">Record {record.id.slice(0, 8)}</Badge>
            {record.recordedAt ? (
              <Badge variant="outline">
                {new Date(record.recordedAt).toLocaleTimeString()}
              </Badge>
            ) : null}
            {record.usage?.inputTokens !== undefined ? (
              <Badge variant="outline">Input {record.usage.inputTokens}</Badge>
            ) : null}
            {record.usage?.outputTokens !== undefined ? (
              <Badge variant="outline">Output {record.usage.outputTokens}</Badge>
            ) : null}
            {record.usage?.totalTokens !== undefined ? (
              <Badge variant="outline">Total {record.usage.totalTokens}</Badge>
            ) : null}
            {record.usage?.reasoningTokens !== undefined ? (
              <Badge variant="outline">
                Reasoning {record.usage.reasoningTokens}
              </Badge>
            ) : null}
            {record.usage?.cachedInputTokens !== undefined ? (
              <Badge variant="outline">
                Cache {record.usage.cachedInputTokens}
              </Badge>
            ) : null}
          </div>
          <p
            className={cn(
              "text-sm/relaxed",
              record.status === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {record.errorMessage ??
              "Stored the final object snapshot and token usage for replay, audit, and cost review."}
          </p>
        </section>
      ) : null}

      {result?.summary ? (
        <section className="space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Summary
          </p>
          <p className="text-sm/relaxed">{result.summary}</p>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge
                className="h-auto max-w-full whitespace-normal py-1 text-left"
                key={`${category.label ?? "category"}-${index}`}
                variant="outline"
              >
                <span className="font-medium">{category.label ?? "Category"}</span>
                {category.severity ? ` · ${toTitleCase(category.severity)}` : ""}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {findings.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Findings
          </p>
          <div className="space-y-2">
            {findings.map((finding, index) => (
              <div
                className="border border-foreground/10 px-3 py-3"
                key={`${finding.title ?? "finding"}-${index}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sm">{finding.title ?? "Finding"}</p>
                  {finding.severity ? (
                    <Badge variant="outline">{toTitleCase(finding.severity)}</Badge>
                  ) : null}
                  {finding.policyLabel ? (
                    <Badge variant="outline">{finding.policyLabel}</Badge>
                  ) : null}
                </div>
                {finding.details ? (
                  <p className="mt-2 text-muted-foreground text-sm/relaxed">
                    {finding.details}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {evidence.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Evidence
          </p>
          <div className="space-y-2">
            {evidence.map((item, index) => (
              <div
                className="border border-foreground/10 px-3 py-3"
                key={`${item.quote ?? "evidence"}-${index}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {item.sourceType ? toTitleCase(item.sourceType) : "Source"}
                  </Badge>
                  {item.filename ? (
                    <span className="text-muted-foreground text-xs">
                      {item.filename}
                    </span>
                  ) : null}
                </div>
                {item.quote ? (
                  <p className="mt-2 text-sm/relaxed">"{item.quote}"</p>
                ) : null}
                {item.rationale ? (
                  <p className="mt-2 text-muted-foreground text-xs/relaxed">
                    {item.rationale}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {result?.recommendedAction ? (
        <section className="space-y-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Recommended action
          </p>
          <p className="text-sm/relaxed">{result.recommendedAction}</p>
        </section>
      ) : null}

      {openQuestions.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Open questions
          </p>
          <ul className="space-y-2 text-sm/relaxed">
            {openQuestions.map((question, index) => (
              <li
                className="border border-foreground/10 px-3 py-2"
                key={`${question}-${index}`}
              >
                {question}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!result?.summary &&
      categories.length === 0 &&
      findings.length === 0 &&
      evidence.length === 0 &&
      !result?.recommendedAction &&
      openQuestions.length === 0 ? (
        <p
          className={cn(
            "text-sm/relaxed",
            status === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {errorMessage ??
            "Waiting for the structured object to accumulate fields."}
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p className="text-destructive text-xs/relaxed">{errorMessage}</p>
      ) : null}
    </div>
  );
}
