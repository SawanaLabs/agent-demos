"use client";

import { FilmStripIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { PageText, usePageCopy } from "@/components/page-copy";
import { shipwordsSample } from "../source";
import type { VideoCastController } from "./use-video-cast";

function PreviewContent({ cast }: { cast: VideoCastController }) {
  const copy = usePageCopy();
  if (cast.state === "running") {
    return (
      <div className="space-y-5 px-7 text-center" role="status">
        <SpinnerGapIcon
          aria-hidden="true"
          className="mx-auto size-10 motion-safe:animate-spin"
        />
        <h3 className="font-serif text-3xl">
          <PageText>Setting the stage.</PageText>
        </h3>
        <p className="text-muted-foreground text-sm/relaxed">
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
      <div className="space-y-4 px-7 text-center" role="status">
        <p className="font-mono text-status-warning-300 text-xs uppercase tracking-widest">
          <PageText>Video unavailable</PageText>
        </p>
        <h3 className="font-serif text-3xl">
          <PageText>One more take?</PageText>
        </h3>
        <p className="text-muted-foreground text-sm/relaxed">
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
    <div className="space-y-5 px-7 text-center">
      <FilmStripIcon
        aria-hidden="true"
        className="mx-auto size-12 text-status-warning-300"
        weight="thin"
      />
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
        9:16 · <PageText>YOUR SESSION</PageText>
      </p>
      <h3 className="font-serif text-4xl leading-tight">
        <PageText>A small stage. A big moment.</PageText>
      </h3>
      <p className="text-muted-foreground text-sm/relaxed">
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
      className="mx-auto w-full max-w-sm scroll-mt-4 space-y-4 lg:max-w-none"
      id="session-preview"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em]">
          <span className="size-2 rounded-full bg-status-danger-500" />
          <PageText>Session preview</PageText>
        </span>
        <span className="text-muted-foreground">
          <PageText>Test mode</PageText>
        </span>
      </div>
      <div className="grid aspect-[9/16] place-items-center overflow-hidden rounded-2xl border border-status-warning-500/25 bg-muted/20 text-foreground shadow-xl">
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
          Every test returns the same sample. No AI generation or credits are
          used.
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
    </aside>
  );
}
