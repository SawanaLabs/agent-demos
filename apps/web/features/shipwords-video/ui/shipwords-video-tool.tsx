"use client";

import { ArrowLeftIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { PageText } from "@/components/page-copy";
import { shipwordsSource } from "../source";
import { useVideoCast } from "./use-video-cast";
import { VideoCastPanel } from "./video-cast-panel";
import { VideoPreview } from "./video-preview";

export function ShipwordsVideoTool() {
  const cast = useVideoCast();
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="space-y-4 border border-border bg-background px-4 py-5">
          <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pr-24 text-xs">
            <Link
              className="inline-flex items-center gap-2 text-muted-foreground outline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              href="/"
            >
              <ArrowLeftIcon />
              <PageText>Agent Demos</PageText>
            </Link>
            <a
              className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href={shipwordsSource.code}
              rel="noreferrer"
              target="_blank"
            >
              <PageText>Adapted from ShipWords</PageText>
              <ArrowSquareOutIcon />
            </a>
          </nav>
          <div className="space-y-2">
            <h1 className="font-medium text-2xl tracking-tight">
              <PageText>Cast a Tiny Desk video</PageText>
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                Put your people in the band. Pick a seat, add a photo, and make
                the stage yours.
              </PageText>
            </p>
          </div>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
          <VideoCastPanel cast={cast} />
          <VideoPreview cast={cast} />
        </div>
        <footer className="space-y-3 border-border border-t pt-4 pb-6 text-muted-foreground text-xs/relaxed">
          <p>
            <PageText>
              Video tool UI adapted from the Tiny Desk AI example in ShipWords,
              by shipwords contributors.
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
    </main>
  );
}
