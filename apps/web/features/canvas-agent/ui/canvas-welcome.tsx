"use client";
import { Button } from "@workspace/ui/components/button";

const scenarios = [
  "创作一张图片",
  "编辑我的照片",
  "做一组广告素材",
  "制作 GIF 动画",
];

export function CanvasWelcome({
  disabled,
  onChoose,
}: {
  disabled: boolean;
  onChoose: (text: string) => Promise<void>;
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <p className="font-medium">你想创作什么？</p>
      <p className="text-muted-foreground">
        说说你的想法，或上传图片一起聊。还没想好，也可以从这里开始。
      </p>
      <div className="grid grid-cols-2 gap-2">
        {scenarios.map((label) => (
          <Button
            className="h-auto whitespace-normal py-2 text-left"
            disabled={disabled}
            key={label}
            onClick={() =>
              onChoose(`我想${label}。请帮我明确具体需求，先不要生成。`)
            }
            variant="secondary"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
