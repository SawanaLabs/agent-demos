"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import Image from "next/image";

import type { ImageResultNode } from "../model/workflow-engine";

export function ImageWorkflowAgentMobileResult({
  resultNode,
}: {
  resultNode: ImageResultNode;
}) {
  return (
    <Card className="lg:hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Latest image</CardTitle>
        <span className="text-muted-foreground text-xs uppercase tracking-wide">
          {resultNode.data.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {resultNode.data.image ? (
          <Image
            alt="Latest generated result"
            className="aspect-[4/3] w-full rounded-md border border-border object-cover"
            height={768}
            src={resultNode.data.image.dataUrl}
            unoptimized
            width={1024}
          />
        ) : (
          <div className="rounded-md border border-border border-dashed bg-muted/30 px-4 py-8 text-center text-muted-foreground text-sm">
            No image yet.
          </div>
        )}
        {resultNode.data.errorMessage ? (
          <p className="text-destructive text-sm">
            {resultNode.data.errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
