"use client";

import { FilmStripIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { PageText, usePageCopy } from "@/components/page-copy";
import { shipwordsSample } from "../source";
import type { VideoCastController } from "./use-video-cast";

function PreviewContent({ cast }: { cast: VideoCastController }) {
  const copy = usePageCopy();
  if (cast.state === "running") {
    return (
      <div className="space-y-4 px-6 text-center" role="status">
        <SpinnerGapIcon
          aria-hidden="true"
          className="mx-auto size-8 text-muted-foreground motion-safe:animate-spin"
        />
        <p className="text-muted-foreground text-xs/relaxed">
          <PageText>
            Loading the fixed test video. Your result will appear here.
          </PageText>
        </p>
        <Button onClick={cast.cancelGeneration} size="sm" variant="outline">
          <PageText>Cancel</PageText>
        </Button>
      </div>
    );
  }
  if (cast.state === "failed") {
    return (
      <div className="space-y-4 px-6 text-center" role="status">
        <h3 className="font-medium text-destructive text-sm">
          <PageText>Video unavailable</PageText>
        </h3>
        <p className="text-muted-foreground text-xs/relaxed">
          <PageText>The test video could not be loaded. Try again.</PageText>
        </p>
        <Button onClick={cast.startGeneration} size="sm" variant="outline">
          <PageText>Try again</PageText>
        </Button>
      </div>
    );
  }
  if (cast.clip) {
    return (
      <video
        aria-label={copy("Fixed test video")}
        className="size-full object-contain"
        controls
        onError={() => cast.reportPlaybackError()}
        playsInline
        preload="metadata"
        src={cast.clip}
      >
        <track kind="captions" />
      </video>
    );
  }
  return (
    <div className="space-y-4 px-6 text-center">
      <FilmStripIcon
        aria-hidden="true"
        className="mx-auto size-9 text-muted-foreground"
        weight="thin"
      />
      <p className="text-muted-foreground text-xs/relaxed">
        <PageText>
          Add a photo, then generate a test video to try playback and download.
        </PageText>
      </p>
    </div>
  );
}

export function VideoPreview({ cast }: { cast: VideoCastController }) {
  return (
    <aside
      aria-labelledby="preview-title"
      className="min-w-0 scroll-mt-4"
      id="session-preview"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="preview-title">
              <PageText>Session preview</PageText>
            </h2>
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <PageText>Test mode</PageText>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mx-auto grid aspect-[9/16] w-full max-w-xs place-items-center overflow-hidden border border-border bg-muted/30 text-foreground">
            <PreviewContent cast={cast} />
          </div>
          {cast.clip && cast.state === "completed" ? (
            <a
              className={buttonVariants({
                className: "w-full",
                variant: "secondary",
              })}
              download={cast.clipName}
              href={cast.clip}
            >
              <PageText>Download test video</PageText>
            </a>
          ) : null}
          <p className="text-muted-foreground text-xs/relaxed">
            <PageText>
              Every test returns the same sample. No AI generation or credits
              are used.
            </PageText>{" "}
            <a
              className="underline underline-offset-4"
              href={shipwordsSample.source}
              rel="noreferrer"
              target="_blank"
            >
              <PageText>Sample video source</PageText>
            </a>
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
