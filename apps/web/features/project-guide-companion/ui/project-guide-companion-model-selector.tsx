"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@workspace/ui/components/ai-elements/model-selector";
import { ChevronDown } from "lucide-react";

import type { ProjectGuideCompanionModel } from "../model-catalog";

export function ProjectGuideCompanionModelSelector({
  isOpen,
  models,
  onModelChange,
  onOpenChange,
  selectedChatModel,
  selectedModel,
}: {
  isOpen: boolean;
  models: readonly ProjectGuideCompanionModel[];
  onModelChange: (modelId: string) => void;
  onOpenChange: (open: boolean) => void;
  selectedChatModel: string;
  selectedModel: ProjectGuideCompanionModel | undefined;
}) {
  return (
    <ModelSelector onOpenChange={onOpenChange} open={isOpen}>
      <ModelSelectorTrigger className="inline-flex h-7 max-w-[13rem] items-center gap-2 border border-input px-2 text-xs">
        <ModelSelectorLogo provider={selectedModel?.provider ?? "zai"} />
        <span className="min-w-0 truncate">
          {selectedModel?.name ?? selectedChatModel}
        </span>
        <ChevronDown className="size-3 shrink-0" />
      </ModelSelectorTrigger>
      <ModelSelectorContent className="sm:max-w-md" title="Select model">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          <ModelSelectorGroup heading="Available models">
            {models.map((model) => (
              <ModelSelectorItem
                key={model.id}
                onSelect={() => {
                  onModelChange(model.id);
                  onOpenChange(false);
                }}
                value={`${model.name} ${model.id}`}
              >
                <ModelSelectorLogo provider={model.provider} />
                <ModelSelectorName>{model.name}</ModelSelectorName>
                <span className="text-muted-foreground text-xs">
                  {model.kind}
                </span>
              </ModelSelectorItem>
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
