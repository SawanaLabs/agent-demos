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
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Crosshair, Loader2, Send } from "lucide-react";
import { ElementPicker } from "./element-picker";
import styles from "./feedback-mobile.module.css";
import { ScreenshotEditor } from "./screenshot-editor";
import type { FeedbackCaptureController } from "./use-feedback-capture";
import { useFeedbackViewport } from "./use-feedback-viewport";

export function FeedbackCapture({
  controller: c,
  enabled,
  launcherLabel = "Feedback",
  launcherLocale = "en",
}: {
  controller: FeedbackCaptureController;
  enabled: boolean;
  launcherLabel?: string;
  launcherLocale?: string;
}) {
  const busy = c.phase === "submitting";
  const viewportStyle = useFeedbackViewport(c.phase === "composing" || busy);
  return (
    <>
      {c.phase === "closed" ? (
        <Button
          className="fixed top-1/2 right-0 z-40 h-auto -translate-y-1/2 rounded-r-none px-2 py-4 shadow-lg [@media(max-width:480px)]:hidden [@media(pointer:coarse)]:hidden"
          data-feedback-ui="launcher"
          disabled={!enabled}
          onClick={c.open}
        >
          <span
            className="[text-orientation:mixed] [writing-mode:sideways-lr] [&:is(:lang(zh),:lang(ja),:lang(ko))]:[writing-mode:vertical-rl]"
            dir="auto"
            lang={launcherLocale}
          >
            {launcherLabel}
          </span>
        </Button>
      ) : null}
      {c.phase === "selecting" || c.phase === "capturing" ? (
        <ElementPicker
          capturing={c.phase === "capturing"}
          error={c.error}
          onCancel={c.close}
          onSelect={c.select}
        />
      ) : null}
      <Dialog
        onOpenChange={(open) => {
          if (!(open || busy)) {
            c.close();
          }
        }}
        open={c.phase === "composing" || busy}
      >
        <DialogContent
          className={`${styles.composer} max-h-[90dvh] min-w-0 overflow-y-auto max-[481px]:translate-x-0 max-[481px]:translate-y-0 sm:max-w-xl`}
          data-feedback-ui="composer"
          showCloseButton={!busy}
          style={viewportStyle}
        >
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Describe what should change. Review the captured page before
              sending.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              c.submit();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {c.capture?.annotation?.targetName ?? "Whole page"}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {c.capture?.annotation?.targetSelector ?? "Current viewport"}
                </p>
              </div>
              <Button
                disabled={busy}
                onClick={c.retake}
                size="sm"
                type="button"
                variant="outline"
              >
                <Crosshair size={14} />
                Reselect
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-description">What should change?</Label>
              <Textarea
                autoFocus
                disabled={busy}
                id="feedback-description"
                maxLength={8000}
                onChange={(event) => c.setDescription(event.target.value)}
                placeholder="What happened, and what did you expect?"
                required
                rows={3}
                value={c.description}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="feedback-screenshot">
                  Include screenshot{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <p className="mt-1 text-muted-foreground text-xs">
                  Turn off before sending private content.
                </p>
              </div>
              <Switch
                checked={c.includeScreenshot}
                disabled={busy}
                id="feedback-screenshot"
                onCheckedChange={c.setIncludeScreenshot}
              />
            </div>
            {c.includeScreenshot && c.capture ? (
              <ScreenshotEditor
                capture={c.capture}
                disabled={busy}
                onPaths={c.setPaths}
                paths={c.paths}
              />
            ) : null}
            {c.error ? (
              <p className="text-destructive text-sm" role="alert">
                {c.error}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={busy}
                onClick={c.close}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  busy ||
                  !c.description.trim() ||
                  (c.includeScreenshot && !c.capture?.preview)
                }
                type="submit"
              >
                {busy ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {busy ? "Sending…" : "Send feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
