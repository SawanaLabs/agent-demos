"use client";
import { useEffect, useRef, useState } from "react";
import { type Capture, capturePage } from "../client/capture";
import {
  newSubmissionIdentity,
  type SubmissionIdentity,
  submitCapture,
} from "../client/submit";
import type { Annotation } from "../upstream/types";

export function useFeedbackCapture(onSubmitted: (id: string) => void) {
  const [phase, setPhase] = useState<
    "closed" | "selecting" | "capturing" | "composing" | "submitting"
  >("closed");
  const [capture, setCapture] = useState<Capture | null>(null);
  const [description, setDescription] = useState("");
  const [paths, setPaths] = useState<string[]>([]);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [error, setError] = useState("");
  const identity = useRef<SubmissionIdentity | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    []
  );
  function changed() {
    identity.current = null;
    setError("");
  }
  function close() {
    generation.current += 1;
    setPhase("closed");
    setCapture(null);
  }
  function open() {
    changed();
    setDescription("");
    setPaths([]);
    setCapture(null);
    setIncludeScreenshot(true);
    setPhase("selecting");
  }
  async function select(annotation?: Annotation) {
    const version = ++generation.current;
    changed();
    setPaths([]);
    setPhase("capturing");
    try {
      const result = await capturePage(annotation);
      if (version !== generation.current) {
        return;
      }
      setCapture(result);
      setPhase("composing");
      if (!result.preview) {
        setError(
          "Screenshot could not be captured. Retake it or turn off Include screenshot."
        );
      }
    } catch (cause) {
      if (version !== generation.current) {
        return;
      }
      setError(cause instanceof Error ? cause.message : "Capture failed.");
      setPhase("selecting");
    }
  }
  async function submit() {
    if (!(capture && description.trim())) {
      return;
    }
    const version = generation.current;
    setError("");
    setPhase("submitting");
    identity.current ??= newSubmissionIdentity();
    try {
      const id = await submitCapture(
        capture,
        description.trim(),
        paths,
        includeScreenshot,
        identity.current
      );
      if (version !== generation.current) {
        return;
      }
      close();
      onSubmitted(id);
    } catch (cause) {
      if (version !== generation.current) {
        return;
      }
      setError(cause instanceof Error ? cause.message : "Submission failed.");
      setPhase("composing");
    }
  }
  return {
    phase,
    capture,
    description,
    paths,
    includeScreenshot,
    error,
    open,
    close,
    select,
    submit,
    retake: () => {
      changed();
      setPhase("selecting");
    },
    setDescription: (value: string) => {
      changed();
      setDescription(value);
    },
    setPaths: (value: string[]) => {
      changed();
      setPaths(value);
    },
    setIncludeScreenshot: (value: boolean) => {
      changed();
      setIncludeScreenshot(value);
    },
  };
}
export type FeedbackCaptureController = ReturnType<typeof useFeedbackCapture>;
