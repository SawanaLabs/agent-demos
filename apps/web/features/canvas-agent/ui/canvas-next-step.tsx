"use client";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ChevronDownIcon, ImageIcon, TextIcon } from "lucide-react";

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
        用于下一步
        <ChevronDownIcon className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="nodrag nowheel min-w-36">
        <DropdownMenuItem onClick={() => onSelect("image")}>
          <ImageIcon />
          生成图片
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("text")}>
          <TextIcon />
          生成文本
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
