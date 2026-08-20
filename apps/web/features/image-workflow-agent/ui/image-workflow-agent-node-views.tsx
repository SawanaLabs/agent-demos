"use client";

import {
  Node,
  NodeAction,
  NodeContent,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from "@workspace/ui/components/ai-elements/node";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef } from "react";

import type {
  ImageGeneratorNode,
  ImageResultNode,
  ReferenceImageNode,
} from "../model/workflow-engine";

interface ReferenceImageNodeViewProps {
  disabled: boolean;
  node: ReferenceImageNode;
  onClearImage: () => void;
  onDelete: () => void;
  onLabelCommit: () => void;
  onUpdateLabel: (label: string) => void;
  onUpload: (fileList: FileList | null) => Promise<void> | void;
}

export function ReferenceImageNodeView({
  disabled,
  node,
  onDelete,
  onUpload,
  onLabelCommit,
  onUpdateLabel,
  onClearImage,
}: ReferenceImageNodeViewProps) {
  const image = node.data.image;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const labelAtFocus = useRef(node.data.label);

  return (
    <Node className="w-[20rem]" handles={{ source: true, target: false }}>
      <NodeHeader>
        <div className="space-y-1">
          <NodeTitle>Reference Image</NodeTitle>
          <NodeDescription>Optional source material for edits.</NodeDescription>
        </div>
        <NodeAction>
          <Button
            disabled={disabled}
            onClick={onDelete}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </NodeAction>
      </NodeHeader>
      <NodeContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${node.id}-label`}>Label</Label>
          <Input
            disabled={disabled}
            id={`${node.id}-label`}
            onBlur={(event) => {
              if (event.target.value !== labelAtFocus.current) {
                onLabelCommit();
              }
            }}
            onChange={(event) => onUpdateLabel(event.target.value)}
            onFocus={(event) => {
              labelAtFocus.current = event.target.value;
            }}
            value={node.data.label}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${node.id}-upload`}>Image</Label>
            {image ? <Badge variant="outline">{image.mediaType}</Badge> : null}
          </div>
          {image ? (
            <Image
              alt={image.filename}
              className="aspect-[4/3] w-full rounded-md border border-border object-cover"
              height={768}
              src={image.dataUrl}
              unoptimized
              width={1024}
            />
          ) : (
            <div className="rounded-md border border-border border-dashed bg-muted/40 px-4 py-8 text-center text-muted-foreground text-sm">
              Upload one image up to 4 MiB.
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              accept="image/*"
              className="sr-only"
              disabled={disabled}
              id={`${node.id}-upload`}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onUpload(event.target.files)
              }
              ref={inputRef}
              type="file"
            />
            <Button
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <UploadIcon className="size-4" />
              Upload
            </Button>
            {image ? (
              <Button
                disabled={disabled}
                onClick={onClearImage}
                size="sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </NodeContent>
    </Node>
  );
}

interface ImageGeneratorNodeViewProps {
  disabled: boolean;
  imageModel: string;
  node: ImageGeneratorNode;
  onAspectRatioChange: (
    value: ImageGeneratorNode["data"]["aspectRatio"]
  ) => void;
  onPromptChange: (value: string) => void;
  onPromptCommit: () => void;
}

export function ImageGeneratorNodeView({
  disabled,
  imageModel,
  node,
  onAspectRatioChange,
  onPromptChange,
  onPromptCommit,
}: ImageGeneratorNodeViewProps) {
  const promptAtFocus = useRef(node.data.prompt);

  return (
    <Node className="w-[22rem]" handles={{ source: true, target: true }}>
      <NodeHeader>
        <div className="space-y-1">
          <NodeTitle>Image Generator</NodeTitle>
          <NodeDescription>Required prompt and aspect ratio.</NodeDescription>
        </div>
      </NodeHeader>
      <NodeContent className="space-y-4">
        <div className="space-y-2">
          <Label>Image model</Label>
          <Badge className="max-w-full truncate" variant="outline">
            {imageModel}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label>Aspect ratio</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => {
              if (value) {
                onAspectRatioChange(value);
              }
            }}
            value={node.data.aspectRatio}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${node.id}-prompt`}>Prompt</Label>
          <Textarea
            disabled={disabled}
            id={`${node.id}-prompt`}
            onBlur={(event) => {
              if (event.target.value !== promptAtFocus.current) {
                onPromptCommit();
              }
            }}
            onChange={(event) => onPromptChange(event.target.value)}
            onFocus={(event) => {
              promptAtFocus.current = event.target.value;
            }}
            placeholder="Describe the image to generate or the edit to apply."
            value={node.data.prompt}
          />
        </div>
      </NodeContent>
    </Node>
  );
}

export function ImageResultNodeView({ node }: { node: ImageResultNode }) {
  return (
    <Node className="w-[20rem]" handles={{ source: false, target: true }}>
      <NodeHeader>
        <div className="space-y-1">
          <NodeTitle>Image Result</NodeTitle>
          <NodeDescription>
            Latest workflow output and run state.
          </NodeDescription>
        </div>
        <NodeAction>
          <Badge variant="outline">{node.data.status}</Badge>
        </NodeAction>
      </NodeHeader>
      <NodeContent className="space-y-4">
        {node.data.prompt ? (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            {node.data.prompt}
          </div>
        ) : null}
        {node.data.errorMessage ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
            {node.data.errorMessage}
          </div>
        ) : null}
        {node.data.image ? (
          <Image
            alt="Generated workflow result"
            className="aspect-[4/3] w-full rounded-md border border-border object-cover"
            height={768}
            src={node.data.image.dataUrl}
            unoptimized
            width={1024}
          />
        ) : (
          <div className="rounded-md border border-border border-dashed bg-muted/40 px-4 py-10 text-center text-muted-foreground text-sm">
            {node.data.status === "running"
              ? "Generating the image."
              : "Run the workflow to produce the final image."}
          </div>
        )}
      </NodeContent>
    </Node>
  );
}
