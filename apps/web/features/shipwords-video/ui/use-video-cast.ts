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

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function remember(file: File) {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
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
    setPhotos((current) => ({ ...current, [seat]: photo }));
    setState("ready");
  }

  function pickPhoto(seat: SeatId) {
    setSelected(seat);
    input.current?.click();
  }

  function removePhoto(seat: SeatId) {
    setPhotos((current) => {
      const next = { ...current };
      delete next[seat];
      return next;
    });
    setState("ready");
  }

  function movePhoto(from: SeatId, to: SeatId) {
    setPhotos((current) => moveCastPhoto(current, from, to));
    setSelected(to);
    setState("ready");
  }

  function startPreview() {
    const issue = validateCast(photos, permission);
    if (issue === "photo-required") {
      pickPhoto("lead");
      return false;
    }
    if (issue) {
      setError(copy("Confirm you have permission to use these photos."));
      return false;
    }
    setError(null);
    setState("running");
    return true;
  }

  function loadClip(file: File) {
    setClip(remember(file));
    setClipName(file.name);
  }

  function reset() {
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

  return {
    addPhoto,
    clip,
    clipName,
    error,
    highlighted,
    input,
    loadClip,
    movePhoto,
    permission,
    photos,
    pickPhoto,
    removePhoto,
    reset,
    selected,
    setHighlighted,
    setPermission,
    setSelected,
    setState,
    startPreview,
    state,
  };
}

export type VideoCastController = ReturnType<typeof useVideoCast>;
