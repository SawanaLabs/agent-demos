"use client";

import {
  FilmStripIcon,
  SpinnerGapIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { useRef } from "react";
import { PageText, usePageCopy } from "@/components/page-copy";
import type { PreviewState } from "../model/cast";
import type { VideoCastController } from "./use-video-cast";

const previewStates = [
  ["ready", "Ready"],
  ["running", "Generating"],
  ["completed", "Result"],
  ["failed", "Error"],
] as const;

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
            Generation state preview. Switch to Result below to explore the
            finished layout.
          </PageText>
        </p>
        <Button
          onClick={() => cast.setState("ready")}
          size="sm"
          variant="outline"
        >
          <PageText>Back to casting</PageText>
        </Button>
      </div>
    );
  }
  if (cast.state === "failed") {
    return (
      <div className="space-y-4 px-7 text-center" role="status">
        <p className="font-mono text-status-warning-300 text-xs uppercase tracking-widest">
          <PageText>Error preview</PageText>
        </p>
        <h3 className="font-serif text-3xl">
          <PageText>One more take?</PageText>
        </h3>
        <p className="text-muted-foreground text-sm/relaxed">
          <PageText>
            A failed job should keep your cast so you can try again.
          </PageText>
        </p>
        <Button
          onClick={() => cast.setState("ready")}
          size="sm"
          variant="outline"
        >
          <PageText>Back to casting</PageText>
        </Button>
      </div>
    );
  }
  if (cast.clip) {
    return (
      <video
        aria-label={copy("Local sample video")}
        className="size-full object-contain"
        controls
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
        <PageText>
          {cast.state === "completed"
            ? "Your encore goes here."
            : "A small stage. A big moment."}
        </PageText>
      </h3>
      <p className="text-muted-foreground text-sm/relaxed">
        <PageText>
          Add a sample video below to preview playback and download.
        </PageText>
      </p>
    </div>
  );
}

export function VideoPreview({ cast }: { cast: VideoCastController }) {
  const copy = usePageCopy();
  const input = useRef<HTMLInputElement>(null);
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
          <PageText>Local media</PageText>
        </span>
      </div>
      <div className="grid aspect-[9/16] place-items-center overflow-hidden rounded-2xl border border-status-warning-500/25 bg-muted/20 text-foreground shadow-xl">
        <PreviewContent cast={cast} />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <NativeSelect
          aria-label={copy("Preview state")}
          className="w-full"
          onChange={(event) =>
            cast.setState(event.target.value as PreviewState)
          }
          value={cast.state}
        >
          {previewStates.map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {copy(label)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          onClick={() => input.current?.click()}
          size="sm"
          variant="outline"
        >
          <UploadSimpleIcon />
          <PageText>Sample video</PageText>
        </Button>
        <input
          accept="video/*"
          aria-label={copy("Load a local sample video")}
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              cast.loadClip(file);
            }
            event.currentTarget.value = "";
          }}
          ref={input}
          type="file"
        />
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
          <PageText>Download sample video</PageText>
        </a>
      ) : null}
      <p className="text-muted-foreground text-xs/relaxed">
        <PageText>
          UI preview only. No generation service is connected. Your files stay
          in this browser.
        </PageText>
      </p>
    </aside>
  );
}
