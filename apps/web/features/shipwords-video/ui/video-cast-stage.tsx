"use client";

import { ArrowsLeftRightIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { PageText, usePageCopy } from "@/components/page-copy";
import { castPresets, type SeatId, seats } from "../model/cast";
import type { VideoCastController } from "./use-video-cast";

function CastSeat({
  seat,
  cast,
}: {
  seat: (typeof seats)[number];
  cast: VideoCastController;
}) {
  const copy = usePageCopy();
  const photo = cast.photos[seat.id];
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${seat.x}%`, top: `${seat.y}%`, width: `${seat.size}%` }}
    >
      <button
        aria-label={`${copy("Choose photo for")} ${copy(seat.label)}`}
        className={`relative grid aspect-square w-full place-items-center rounded-full border-2 border-dashed bg-background/80 text-status-warning-300 shadow-lg outline-offset-4 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-status-warning-300 ${cast.highlighted.includes(seat.id) ? "border-status-warning-300 ring-4 ring-status-warning-500/15" : "border-foreground/40"}`}
        draggable={Boolean(photo)}
        onClick={() => cast.pickPhoto(seat.id)}
        onDragOver={(event) => event.preventDefault()}
        onDragStart={(event) =>
          event.dataTransfer.setData("application/x-shipwords-seat", seat.id)
        }
        onDrop={(event) => {
          event.preventDefault();
          const from = event.dataTransfer.getData(
            "application/x-shipwords-seat"
          ) as SeatId;
          if (seats.some((item) => item.id === from)) {
            cast.movePhoto(from, seat.id);
          } else if (event.dataTransfer.files[0]) {
            void cast.addPhoto(event.dataTransfer.files[0], seat.id);
          }
        }}
        type="button"
      >
        {photo ? (
          // biome-ignore lint/performance/noImgElement: local object URLs need native image decoding, not the Next image optimizer.
          <img
            alt={photo.name}
            className="size-full rounded-full object-cover"
            height={120}
            src={photo.url}
            width={120}
          />
        ) : (
          <PlusIcon aria-hidden="true" className="size-5 sm:size-7" />
        )}
      </button>
      {photo ? (
        <button
          aria-label={`${copy("Remove photo from")} ${copy(seat.label)}`}
          className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full border bg-background text-foreground shadow-sm"
          onClick={() => cast.removePhoto(seat.id)}
          type="button"
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
      <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-background/90 px-2 py-1 text-[10px] text-foreground sm:text-xs">
        <PageText>{seat.label}</PageText>
      </span>
    </div>
  );
}

export function VideoCastStage({ cast }: { cast: VideoCastController }) {
  const copy = usePageCopy();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {castPresets.map((preset) => (
          <Button
            key={preset.label}
            onClick={() => {
              cast.setHighlighted(preset.seats);
              cast.setSelected(preset.seats[0] ?? "lead");
            }}
            size="sm"
            variant={
              cast.highlighted.join() === preset.seats.join()
                ? "secondary"
                : "outline"
            }
          >
            <PageText>{preset.label}</PageText>
          </Button>
        ))}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp"
        aria-label={copy("Upload a cast photo")}
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            void cast.addPhoto(file, cast.selected);
          }
          event.currentTarget.value = "";
        }}
        ref={cast.input}
        type="file"
      />
      <fieldset
        aria-label={copy("Choose people on the stage")}
        className="relative isolate aspect-[1.1] overflow-hidden rounded-2xl border border-foreground/15 bg-muted/20"
      >
        {/* Original stage illustration replaces the third-party media excluded by ShipWords. */}
        {/* biome-ignore lint/performance/noImgElement: a static SVG stage diagram does not benefit from the image optimizer. */}
        <img
          alt=""
          className="absolute inset-0 size-full object-cover opacity-65"
          height={600}
          src="/shipwords-video/stage.svg"
          width={660}
        />
        {seats.map((seat) => (
          <CastSeat cast={cast} key={seat.id} seat={seat} />
        ))}
        <span className="absolute bottom-3 left-3 rounded bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
          <PageText>Illustrated stage</PageText>
        </span>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-status-warning-300">
          <span className="font-medium tabular-nums">
            {Object.keys(cast.photos).length}/5
          </span>{" "}
          <PageText>cast photos selected</PageText>
        </p>
        <p className="text-muted-foreground">
          <PageText>Tap to upload. Drag photos to swap seats.</PageText>
        </p>
      </div>
      {Object.keys(cast.photos).length ? (
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
          <ArrowsLeftRightIcon className="size-4" />
          <PageText>Move selected photo</PageText>
          <NativeSelect
            aria-label={copy("Photo to move")}
            onChange={(event) => cast.setSelected(event.target.value as SeatId)}
            value={cast.selected}
          >
            {seats.map((seat) => (
              <NativeSelectOption key={seat.id} value={seat.id}>
                {copy(seat.label)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={copy("Move photo to")}
            onChange={(event) => {
              if (event.target.value) {
                cast.movePhoto(cast.selected, event.target.value as SeatId);
              }
            }}
            value=""
          >
            <NativeSelectOption value="">
              {copy("Choose destination")}
            </NativeSelectOption>
            {seats
              .filter((seat) => seat.id !== cast.selected)
              .map((seat) => (
                <NativeSelectOption key={seat.id} value={seat.id}>
                  {copy(seat.label)}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </div>
      ) : null}
    </div>
  );
}
