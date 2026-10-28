"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ChevronDownIcon, ImageIcon, TextIcon } from "lucide-react";
import { PageText } from "@/components/page-copy";

export type CanvasNextKind = "image" | "text";

export function CanvasNextStep({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (kind: CanvasNextKind) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="nodrag"
        disabled={disabled}
        openOnHover
        render={<Button size="sm" variant="outline" />}
      >
        <PageText>{"用于下一步"}</PageText>
        <ChevronDownIcon className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="nodrag nowheel min-w-36">
        <DropdownMenuItem onClick={() => onSelect("image")}>
          <ImageIcon />
          <PageText>{"生成图片"}</PageText>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("text")}>
          <TextIcon />
          <PageText>{"生成文本"}</PageText>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
