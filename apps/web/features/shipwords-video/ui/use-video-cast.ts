"use client";

import { useEffect, useRef, useState } from "react";
import { usePageCopy } from "@/components/page-copy";
import {
  type Cast,
  type CastPhoto,
  moveCastPhoto,
  type PreviewState,
  type SeatId,
  validateCast,
} from "../model/cast";
import { generateMockVideo } from "../model/mock-generation";

export function useVideoCast() {
  const copy = usePageCopy();
  const [photos, setPhotos] = useState<Cast<CastPhoto>>({});
  const [selected, setSelected] = useState<SeatId>("lead");
  const [highlighted, setHighlighted] = useState<SeatId[]>(["lead"]);
  const [permission, setPermission] = useState(false);
  const [state, setState] = useState<PreviewState>("ready");
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<string | null>(null);
  const [clipName, setClipName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const generation = useRef<AbortController | null>(null);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      generation.current?.abort();
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function remember(file: Blob) {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  }

  function cancelGeneration() {
    generation.current?.abort();
    generation.current = null;
    setState("ready");
  }

  function clearResult() {
    cancelGeneration();
    if (clip) {
      URL.revokeObjectURL(clip);
      objectUrls.current.delete(clip);
    }
    setClip(null);
    setClipName("");
  }

  async function addPhoto(file: File, seat: SeatId) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError(copy("Choose a PNG, JPEG, or WebP photo."));
      return;
    }
    let image: ImageBitmap;
    try {
      image = await createImageBitmap(file);
    } catch {
      setError(copy("This photo could not be opened. Choose another image."));
      return;
    }
    const tooSmall = Math.min(image.width, image.height) < 160;
    image.close();
    if (tooSmall) {
      setError(
        copy("Choose a clearer photo, at least 160 pixels on each side.")
      );
      return;
    }
    const photo = { name: file.name, url: remember(file) };
    clearResult();
    setPhotos((current) => ({ ...current, [seat]: photo }));
  }

  function pickPhoto(seat: SeatId) {
    setSelected(seat);
    input.current?.click();
  }

  function removePhoto(seat: SeatId) {
    clearResult();
    setPhotos((current) => {
      const next = { ...current };
      delete next[seat];
      return next;
    });
  }

  function movePhoto(from: SeatId, to: SeatId) {
    clearResult();
    setPhotos((current) => moveCastPhoto(current, from, to));
    setSelected(to);
  }

  async function completeGeneration(controller: AbortController) {
    try {
      const video = await generateMockVideo(controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setClip(remember(video));
      setClipName("shipwords-test-dog-band.mp4");
      setState("completed");
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      setError(copy("The test video could not be loaded. Try again."));
      setState("failed");
    } finally {
      if (generation.current === controller) {
        generation.current = null;
      }
    }
  }

  function startGeneration() {
    const issue = validateCast(photos, permission);
    if (issue === "photo-required") {
      pickPhoto("lead");
      return false;
    }
    if (issue) {
      setError(copy("Confirm you have permission to use these photos."));
      return false;
    }
    clearResult();
    setError(null);
    setState("running");
    const controller = new AbortController();
    generation.current = controller;
    completeGeneration(controller);
    return true;
  }

  function reset() {
    cancelGeneration();
    for (const url of objectUrls.current) {
      URL.revokeObjectURL(url);
    }
    objectUrls.current.clear();
    setPhotos({});
    setPermission(false);
    setState("ready");
    setError(null);
    setClip(null);
    setClipName("");
    setSelected("lead");
    setHighlighted(["lead"]);
  }

  function reportPlaybackError() {
    setError(copy("The test video could not be loaded. Try again."));
    setState("failed");
  }

  return {
    addPhoto,
    cancelGeneration,
    clip,
    clipName,
    error,
    highlighted,
    input,
    movePhoto,
    permission,
    photos,
    pickPhoto,
    removePhoto,
    reportPlaybackError,
    reset,
    selected,
    setHighlighted,
    setPermission,
    setSelected,
    startGeneration,
    state,
  };
}

export type VideoCastController = ReturnType<typeof useVideoCast>;
