"use client";

import { ArrowCounterClockwiseIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { PageText } from "@/components/page-copy";
import type { VideoCastController } from "./use-video-cast";
import { VideoCastStage } from "./video-cast-stage";

export function VideoCastPanel({ cast }: { cast: VideoCastController }) {
  return (
    <Card aria-labelledby="cast-title" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="cast-title">
            <PageText>Who's playing?</PageText>
          </h2>
        </CardTitle>
        <CardDescription>
          <PageText>PNG, JPEG or WebP · One clear face per photo</PageText>
        </CardDescription>
        <CardAction>
          <Button onClick={cast.reset} size="sm" variant="ghost">
            <ArrowCounterClockwiseIcon />
            <PageText>Reset</PageText>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        <VideoCastStage cast={cast} />
        <label
          className="flex cursor-pointer items-start gap-3 border-border border-t pt-4 text-muted-foreground text-xs/relaxed"
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
          className="w-full"
          disabled={cast.state === "running"}
          onClick={() => {
            if (cast.startGeneration()) {
              document
                .getElementById("session-preview")
                ?.scrollIntoView({ block: "start" });
            }
          }}
          size="lg"
        >
          <PlayIcon weight="fill" />
          <PageText>Generate test video</PageText>
        </Button>
        <p className="text-muted-foreground text-xs/relaxed">
          <PageText>
            Test mode returns a fixed dog band video. Your photos stay in this
            browser and do not change the result.
          </PageText>
        </p>
      </CardContent>
    </Card>
  );
}
