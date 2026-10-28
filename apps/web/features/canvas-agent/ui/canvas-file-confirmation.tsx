"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { PageText } from "@/components/page-copy";
import type { useWorkflowFile } from "./use-workflow-file";

export function CanvasFileConfirmation({
  file,
}: {
  file: ReturnType<typeof useWorkflowFile>;
}) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          file.closeConfirmation(false);
        }
      }}
      open={!!file.confirmation}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <PageText>{"保留当前工作流？"}</PageText>
          </DialogTitle>
          <DialogDescription>{file.confirmation?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => file.closeConfirmation(false)}
            variant="outline"
          >
            <PageText>{"取消"}</PageText>
          </Button>
          <Button
            onClick={() => file.closeConfirmation(true)}
            variant="secondary"
          >
            <PageText>{"继续"}</PageText>
          </Button>
          <Button
            onClick={() => {
              file.save();
              file.closeConfirmation(true);
            }}
          >
            <PageText>{"保存到本地并继续"}</PageText>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
