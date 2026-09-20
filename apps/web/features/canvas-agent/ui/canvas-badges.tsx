import { Badge } from "@workspace/ui/components/badge";
import {
  FileTextIcon,
  FilmIcon,
  ImageIcon,
  MonitorIcon,
  SparklesIcon,
} from "lucide-react";
import type { CanvasNode } from "../model/graph";
import type { CanvasContentType, connectedInputs } from "../model/inputs";

export const canvasNodeIcons = {
  text: SparklesIcon,
  image: SparklesIcon,
  reference: ImageIcon,
  prompt: FileTextIcon,
  gif: FilmIcon,
  output: MonitorIcon,
} satisfies Record<CanvasNode["kind"], typeof ImageIcon>;

export function CanvasTypeBadge({ type }: { type: CanvasContentType }) {
  const Icon = type === "text" ? FileTextIcon : ImageIcon;
  return (
    <Badge variant="secondary">
      <Icon aria-hidden="true" />
      {type === "text" ? "文本" : "图片"}
    </Badge>
  );
}

export function CanvasInputBadges({
  inputs,
}: {
  inputs: ReturnType<typeof connectedInputs>;
}) {
  if (!inputs.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {inputs.map((input) => {
        const Icon = input.type === "text" ? FileTextIcon : ImageIcon;
        const label = `${input.type === "text" ? "文本" : "图片"}输入：${input.label}${input.ready ? "" : `（${input.pending}）`}`;
        return (
          <Badge
            aria-label={label}
            className="max-w-full"
            key={input.id}
            title={label}
            variant="outline"
          >
            <Icon aria-hidden="true" className="shrink-0" />
            <span className="truncate">{input.label}</span>
            {input.ready ? null : (
              <span className="shrink-0 text-muted-foreground">
                · {input.pending}
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
