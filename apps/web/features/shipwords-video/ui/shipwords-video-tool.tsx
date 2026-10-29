"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import Link from "next/link";
import { PageText } from "@/components/page-copy";
import { shipwordsSource } from "../source";
import { useVideoCast } from "./use-video-cast";
import { VideoCastStage } from "./video-cast-stage";
import { VideoPreview } from "./video-preview";

export function ShipwordsVideoTool() {
  const cast = useVideoCast();
  return (
    <main className="dark min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <nav className="mb-8 flex min-h-20 flex-col items-start justify-between gap-4 border-foreground/15 border-b pb-5 text-xs sm:mb-10 sm:min-h-0 sm:flex-row sm:items-center">
          <Link
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            href="/"
          >
            <ArrowLeftIcon />
            <PageText>Agent Demos</PageText>
          </Link>
          <a
            className="inline-flex items-center gap-2 text-status-warning-300 underline-offset-4 hover:underline"
            href={shipwordsSource.code}
            rel="noreferrer"
            target="_blank"
          >
            <PageText>Adapted from ShipWords</PageText>
            <ArrowSquareOutIcon />
          </a>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <div className="space-y-8">
            <header className="space-y-5">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] text-status-warning-300 uppercase tracking-[0.2em]">
                <span className="size-1.5 rounded-full bg-status-warning-300" />
                <PageText>THE TINY DESK VIDEO SLICE</PageText>
              </p>
              <h1 className="max-w-xl font-serif text-5xl leading-[1.03] tracking-tight sm:text-7xl">
                <PageText>Your people.</PageText>
                <br />
                <span className="text-status-warning-300 italic">
                  <PageText>Their headline set.</PageText>
                </span>
              </h1>
              <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
                <PageText>
                  Put your people in the band. Pick a seat, add a photo, and
                  make the stage yours.
                </PageText>
              </p>
            </header>
            <section
              aria-labelledby="cast-title"
              className="space-y-5 rounded-2xl border border-foreground/15 bg-muted/10 p-4 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    <PageText>01 / CAST THE SESSION</PageText>
                  </p>
                  <h2 className="mt-1 font-serif text-2xl" id="cast-title">
                    <PageText>Who's playing?</PageText>
                  </h2>
                </div>
                <Button onClick={cast.reset} size="sm" variant="ghost">
                  <ArrowCounterClockwiseIcon />
                  <PageText>Reset</PageText>
                </Button>
              </div>
              <VideoCastStage cast={cast} />
              <label
                className="flex cursor-pointer items-start gap-3 border-foreground/10 border-t pt-5 text-muted-foreground text-xs/relaxed"
                htmlFor="cast-permission"
              >
                <Checkbox
                  checked={cast.permission}
                  id="cast-permission"
                  onCheckedChange={cast.setPermission}
                />
                <PageText>I have permission to use these photos.</PageText>
              </label>
              {cast.error ? (
                <p className="text-destructive text-sm" role="alert">
                  {cast.error}
                </p>
              ) : null}
              <Button
                className="h-12 w-full rounded-lg bg-status-warning-300 font-medium text-primary-foreground hover:bg-status-warning-300"
                disabled={cast.state === "running"}
                onClick={() => {
                  if (cast.startGeneration()) {
                    document
                      .getElementById("session-preview")
                      ?.scrollIntoView({ block: "start" });
                  }
                }}
              >
                <PlayIcon weight="fill" />
                <PageText>Generate test video</PageText>
              </Button>
              <p className="text-center text-status-warning-300 text-xs/relaxed">
                <PageText>
                  Test mode returns a fixed dog band video. Your photos stay in
                  this browser and do not change the result.
                </PageText>
              </p>
              <p className="text-center text-[11px] text-muted-foreground">
                <PageText>
                  PNG, JPEG or WebP · One clear face per photo
                </PageText>
              </p>
            </section>
            <footer className="space-y-3 text-muted-foreground text-xs/relaxed">
              <p>
                <PageText>
                  Video tool UI adapted from the Tiny Desk AI example in
                  ShipWords, by shipwords contributors.
                </PageText>
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <a
                  className="underline underline-offset-4"
                  href={shipwordsSource.code}
                  rel="noreferrer"
                  target="_blank"
                >
                  <PageText>Original source</PageText>
                </a>
                <a
                  className="underline underline-offset-4"
                  href={shipwordsSource.license}
                  rel="noreferrer"
                  target="_blank"
                >
                  <PageText>MIT license</PageText>
                </a>
                <a
                  className="underline underline-offset-4"
                  href={shipwordsSource.live}
                  rel="noreferrer"
                  target="_blank"
                >
                  <PageText>Original live site</PageText>
                </a>
              </div>
            </footer>
          </div>
          <VideoPreview cast={cast} />
        </div>
      </div>
    </main>
  );
}
