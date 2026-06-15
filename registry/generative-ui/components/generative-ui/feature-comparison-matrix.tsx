"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Table2Icon } from "lucide-react";

import type {
  FeatureComparisonInput,
  FeatureComparisonOutput,
} from "@/lib/generative-ui/ui-contract";
import {
  featureComparisonToolPartType,
  type GenerativeUiToolPart,
} from "./message-parts";
import {
  getGeneratedString,
  isRecord,
  SkeletonLine,
} from "./partial-rendering";

interface FeatureComparisonMatrixProps {
  part: GenerativeUiToolPart;
}

type PartialComparisonCriterion = Partial<
  FeatureComparisonInput["criteria"][number]
> & {
  scores?: Partial<
    FeatureComparisonInput["criteria"][number]["scores"][number]
  >[];
};

type PartialFeatureComparison = Partial<FeatureComparisonInput> & {
  criteria?: PartialComparisonCriterion[];
  options?: Partial<FeatureComparisonInput["options"][number]>[];
};

type ComparisonRenderState = "final" | "streaming" | "validating";

const ratingLabels: Record<string, string> = {
  best: "Best",
  mixed: "Mixed",
  strong: "Strong",
  weak: "Weak",
};

const ratingClassNames: Record<string, string> = {
  best: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  mixed:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  strong: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  weak: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

function isFeatureComparisonOutput(
  value: unknown
): value is FeatureComparisonOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const output = value as FeatureComparisonOutput;

  return (
    output.kind === "feature-comparison" &&
    typeof output.subject === "string" &&
    typeof output.summary === "string" &&
    Array.isArray(output.options) &&
    Array.isArray(output.criteria)
  );
}

function renderPendingComparison() {
  return (
    <section className="not-prose overflow-hidden rounded-md border border-foreground/10 bg-muted/20">
      <div className="flex items-center justify-between gap-3 border-foreground/10 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2Icon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">Preparing comparison</span>
        </div>
        <Badge variant="outline">Working</Badge>
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-16 rounded bg-muted/70" />
      </div>
    </section>
  );
}

function renderComparisonError() {
  return (
    <section className="not-prose rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
      Comparison output could not be finalized.
    </section>
  );
}

function getFeatureComparisonDraft(part: GenerativeUiToolPart) {
  if (part.state === "output-available") {
    return {
      data: part.output,
      renderState: "final" as const,
    };
  }

  if (
    (part.state === "input-streaming" || part.state === "input-available") &&
    isRecord(part.input)
  ) {
    return {
      data: part.input as PartialFeatureComparison,
      renderState:
        part.state === "input-available"
          ? ("validating" as const)
          : ("streaming" as const),
    };
  }

  return;
}

function getBadgeLabel(renderState: ComparisonRenderState) {
  if (renderState === "streaming") {
    return "Generating";
  }

  if (renderState === "validating") {
    return "Validating";
  }

  return "Comparison generated";
}

function getRatingLabel(rating: unknown) {
  const ratingValue = getGeneratedString(rating);

  return ratingValue ? ratingLabels[ratingValue] : undefined;
}

function renderScoreCell(
  score: Partial<
    FeatureComparisonInput["criteria"][number]["scores"][number]
  > | null,
  renderState: ComparisonRenderState
) {
  if (!score) {
    return renderState === "final" ? (
      <span className="text-muted-foreground">No score</span>
    ) : (
      <SkeletonLine className="w-3/4" />
    );
  }

  const rating = getGeneratedString(score.rating);
  const ratingLabel = getRatingLabel(score.rating);
  const summary = getGeneratedString(score.summary);

  return (
    <div className="space-y-2">
      {ratingLabel ? (
        <Badge
          className={cn("rounded-full", rating && ratingClassNames[rating])}
          variant="outline"
        >
          {ratingLabel}
        </Badge>
      ) : (
        <SkeletonLine className="w-20" />
      )}
      <div className="text-muted-foreground">
        {summary ?? <SkeletonLine className="w-4/5" />}
      </div>
    </div>
  );
}

function renderComparisonContent(
  output: PartialFeatureComparison,
  renderState: ComparisonRenderState
) {
  const subject = getGeneratedString(output.subject);
  const summary = getGeneratedString(output.summary);
  const options = Array.isArray(output.options) ? output.options : [];
  const criteria = Array.isArray(output.criteria) ? output.criteria : [];
  const visibleOptions = options.length > 0 ? options : [undefined];
  const visibleCriteria = criteria.length > 0 ? criteria : [undefined];

  return (
    <section className="not-prose overflow-hidden rounded-md border border-foreground/10 bg-background">
      <div className="space-y-2 border-foreground/10 border-b px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Table2Icon className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="min-w-0 flex-1 truncate font-medium text-sm">
              {subject ?? <SkeletonLine className="w-48 max-w-full" />}
            </h3>
          </div>
          <Badge variant="outline">{getBadgeLabel(renderState)}</Badge>
        </div>
        <div className="text-muted-foreground text-sm">
          {summary ?? <SkeletonLine className="w-2/3" />}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table className="min-w-[42rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-44 whitespace-normal break-words">
                Criterion
              </TableHead>
              {visibleOptions.map((option, index) => {
                const optionName = getGeneratedString(option?.name);
                const optionSummary = getGeneratedString(option?.summary);

                return (
                  <TableHead
                    className="whitespace-normal break-words"
                    key={optionName ?? `option-${index}`}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {optionName ?? <SkeletonLine className="w-28" />}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {optionSummary ?? <SkeletonLine className="w-32" />}
                      </div>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCriteria.map((criterion, criterionIndex) => (
              <TableRow
                key={
                  getGeneratedString(criterion?.label) ??
                  `criterion-${criterionIndex}`
                }
              >
                <TableCell className="whitespace-normal break-words align-top font-medium text-sm">
                  {getGeneratedString(criterion?.label) ?? (
                    <SkeletonLine className="w-28" />
                  )}
                </TableCell>
                {visibleOptions.map((option, optionIndex) => {
                  const optionName = getGeneratedString(option?.name);
                  const scores = Array.isArray(criterion?.scores)
                    ? criterion.scores
                    : [];
                  const score =
                    scores.find((item) => item.option === optionName) ??
                    scores[optionIndex] ??
                    null;

                  return (
                    <TableCell
                      className="min-w-48 whitespace-normal break-words align-top text-sm"
                      key={optionName ?? `score-${optionIndex}`}
                    >
                      {renderScoreCell(score, renderState)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function FeatureComparisonMatrix({
  part,
}: FeatureComparisonMatrixProps) {
  if (part.type !== featureComparisonToolPartType) {
    return null;
  }

  if (part.state === "output-error") {
    return renderComparisonError();
  }

  const draft = getFeatureComparisonDraft(part);

  if (!draft) {
    return renderPendingComparison();
  }

  if (draft.renderState === "final") {
    if (!isFeatureComparisonOutput(draft.data)) {
      return renderComparisonError();
    }

    return renderComparisonContent(draft.data, draft.renderState);
  }

  return renderComparisonContent(draft.data, draft.renderState);
}
