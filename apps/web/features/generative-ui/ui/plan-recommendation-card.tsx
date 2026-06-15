"use client";

import { Badge } from "@workspace/ui/components/badge";
import { CheckCircle2Icon, ListChecksIcon } from "lucide-react";

import type {
  PlanRecommendationInput,
  PlanRecommendationOutput,
} from "../model/ui-contract";
import {
  type GenerativeUiToolPart,
  planRecommendationToolPartType,
} from "./message-parts";
import {
  getGeneratedString,
  isRecord,
  SkeletonLine,
} from "./partial-rendering";

interface PlanRecommendationCardProps {
  part: GenerativeUiToolPart;
}

type PartialPlanRecommendation = Partial<PlanRecommendationInput> & {
  alternatives?: Partial<PlanRecommendationInput["alternatives"][number]>[];
  rationale?: Partial<PlanRecommendationInput["rationale"][number]>[];
  recommendedOption?: Partial<PlanRecommendationInput["recommendedOption"]>;
  risks?: Partial<PlanRecommendationInput["risks"][number]>[];
};

type RecommendationRenderState = "final" | "streaming" | "validating";

function isPlanRecommendationOutput(
  value: unknown
): value is PlanRecommendationOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const output = value as PlanRecommendationOutput;

  return (
    output.kind === "plan-recommendation" &&
    typeof output.decision === "string" &&
    Array.isArray(output.alternatives) &&
    Array.isArray(output.nextSteps) &&
    Array.isArray(output.rationale) &&
    Array.isArray(output.risks) &&
    typeof output.recommendedOption?.name === "string"
  );
}

function renderPendingRecommendation() {
  return (
    <section className="not-prose overflow-hidden rounded-md border border-foreground/10 bg-muted/20">
      <div className="flex items-center justify-between gap-3 border-foreground/10 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ListChecksIcon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">Preparing recommendation</span>
        </div>
        <Badge variant="outline">Working</Badge>
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-20 rounded bg-muted/70" />
      </div>
    </section>
  );
}

function renderRecommendationError() {
  return (
    <section className="not-prose rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
      Recommendation output could not be finalized.
    </section>
  );
}

function getPlanRecommendationDraft(part: GenerativeUiToolPart) {
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
      data: part.input as PartialPlanRecommendation,
      renderState:
        part.state === "input-available"
          ? ("validating" as const)
          : ("streaming" as const),
    };
  }

  return;
}

function getBadgeLabel(renderState: RecommendationRenderState) {
  if (renderState === "streaming") {
    return "Generating";
  }

  if (renderState === "validating") {
    return "Validating";
  }

  return "Recommendation generated";
}

function renderRiskMitigation(
  mitigation: unknown,
  renderState: RecommendationRenderState
) {
  const generatedMitigation = getGeneratedString(mitigation);

  if (generatedMitigation) {
    return (
      <p className="mt-1 text-muted-foreground text-sm">
        {generatedMitigation}
      </p>
    );
  }

  if (renderState === "final") {
    return null;
  }

  return (
    <div className="mt-1">
      <SkeletonLine className="w-3/4" />
    </div>
  );
}

function renderRecommendationContent(
  output: PartialPlanRecommendation,
  renderState: RecommendationRenderState
) {
  const decision = getGeneratedString(output.decision);
  const recommendedName = getGeneratedString(output.recommendedOption?.name);
  const recommendedSummary = getGeneratedString(
    output.recommendedOption?.summary
  );
  const rationale = Array.isArray(output.rationale) ? output.rationale : [];
  const alternatives = Array.isArray(output.alternatives)
    ? output.alternatives
    : [];
  const risks = Array.isArray(output.risks) ? output.risks : [];
  const nextSteps = Array.isArray(output.nextSteps) ? output.nextSteps : [];

  return (
    <section className="not-prose overflow-hidden rounded-md border border-foreground/10 bg-background">
      <div className="space-y-3 border-foreground/10 border-b px-4 py-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ListChecksIcon className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="min-w-0 flex-1 truncate font-medium text-sm">
              {decision ?? <SkeletonLine className="w-48 max-w-full" />}
            </h3>
          </div>
          <Badge variant="outline">{getBadgeLabel(renderState)}</Badge>
        </div>
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="w-full space-y-1">
              <p className="font-medium">
                {recommendedName ?? <SkeletonLine className="w-40" />}
              </p>
              <div className="text-muted-foreground text-sm">
                {recommendedSummary ?? <SkeletonLine className="w-2/3" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Rationale
          </p>
          <div className="space-y-2">
            {rationale.length > 0 ? (
              rationale.map((item, index) => (
                <div
                  className="rounded-md border border-foreground/10 p-3"
                  key={getGeneratedString(item.label) ?? `rationale-${index}`}
                >
                  <p className="font-medium text-sm">
                    {getGeneratedString(item.label) ?? (
                      <SkeletonLine className="w-28" />
                    )}
                  </p>
                  <div className="mt-1 text-muted-foreground text-sm">
                    {getGeneratedString(item.detail) ?? (
                      <SkeletonLine className="w-4/5" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <SkeletonLine className="h-16 w-full" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Alternatives
          </p>
          <div className="space-y-2">
            {alternatives.length > 0 ? (
              alternatives.map((alternative, index) => (
                <div
                  className="rounded-md border border-foreground/10 p-3"
                  key={
                    getGeneratedString(alternative.name) ??
                    `alternative-${index}`
                  }
                >
                  <p className="font-medium text-sm">
                    {getGeneratedString(alternative.name) ?? (
                      <SkeletonLine className="w-28" />
                    )}
                  </p>
                  <div className="mt-1 text-muted-foreground text-sm">
                    {getGeneratedString(alternative.tradeoff) ?? (
                      <SkeletonLine className="w-4/5" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <SkeletonLine className="h-16 w-full" />
            )}
          </div>
        </div>

        {risks.length > 0 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Risks
            </p>
            <div className="space-y-2">
              {risks.map((risk, index) => (
                <div
                  className="rounded-md border border-foreground/10 p-3"
                  key={getGeneratedString(risk.risk) ?? `risk-${index}`}
                >
                  <p className="font-medium text-sm">
                    {getGeneratedString(risk.risk) ?? (
                      <SkeletonLine className="w-32" />
                    )}
                  </p>
                  {renderRiskMitigation(risk.mitigation, renderState)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Next steps
          </p>
          <ol className="space-y-2">
            {nextSteps.length > 0 ? (
              nextSteps.map((step, index) => (
                <li className="flex gap-2 text-sm" key={step}>
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-[11px]">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))
            ) : (
              <li className="flex gap-2 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-[11px]">
                  1
                </span>
                <span className="flex-1 pt-1">
                  <SkeletonLine className="w-3/4" />
                </span>
              </li>
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function PlanRecommendationCard({ part }: PlanRecommendationCardProps) {
  if (part.type !== planRecommendationToolPartType) {
    return null;
  }

  if (part.state === "output-error") {
    return renderRecommendationError();
  }

  const draft = getPlanRecommendationDraft(part);

  if (!draft) {
    return renderPendingRecommendation();
  }

  if (draft.renderState === "final") {
    if (!isPlanRecommendationOutput(draft.data)) {
      return renderRecommendationError();
    }

    return renderRecommendationContent(draft.data, draft.renderState);
  }

  return renderRecommendationContent(draft.data, draft.renderState);
}
