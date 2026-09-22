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
          <DialogTitle>保留当前工作流？</DialogTitle>
          <DialogDescription>{file.confirmation?.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => file.closeConfirmation(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button
            onClick={() => file.closeConfirmation(true)}
            variant="secondary"
          >
            继续
          </Button>
          <Button
            onClick={() => {
              file.save();
              file.closeConfirmation(true);
            }}
          >
            保存到本地并继续
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
