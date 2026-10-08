"use client";

import {
  type ChangeEvent,
  type SyntheticEvent,
  useEffect,
  useState,
} from "react";
import {
  type GatewayReceipt,
  type GatewayResult,
  type GatewaySetup,
  imageMediaTypes,
  maximumReferenceBytes,
  maximumReferences,
} from "@/lib/cloudflare-ai-gateway/contract";

export function useGatewayWorkspace(setup: GatewaySetup) {
  const [model, setModel] = useState(
    setup.models.find((entry) => entry.available)?.id ?? "gpt-image-2"
  );
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState<File[]>([]);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [result, setResult] = useState<GatewayResult | null>(null);
  const [failureReceipt, setFailureReceipt] = useState<GatewayReceipt | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const selectedSetup = setup.models.find((entry) => entry.id === model);
  if (!selectedSetup) {
    throw new Error("Missing model setup.");
  }

  useEffect(() => {
    const urls = references.map((file) => URL.createObjectURL(file));
    setReferenceUrls(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [references]);

  async function selectReferences(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);
    if (
      files.length > maximumReferences ||
      files.reduce((total, file) => total + file.size, 0) >
        maximumReferenceBytes ||
      files.some(
        (file) =>
          !imageMediaTypes.includes(
            file.type as (typeof imageMediaTypes)[number]
          )
      )
    ) {
      setError("Use up to 4 PNG, JPEG or WebP references, at most 3 MB total.");
      return;
    }
    setPreparing(true);
    try {
      // Snapshot selected bytes before preview/state work so provider-backed
      // Files cannot become unreadable before the request is sent.
      const snapshots = await Promise.all(
        files.map(
          async (file) =>
            new File([await file.arrayBuffer()], file.name, { type: file.type })
        )
      );
      setReferences(snapshots);
    } catch {
      setError("The reference could not be read. Select the file again.");
    } finally {
      setPreparing(false);
    }
  }

  async function generate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    for (const file of references) {
      form.append("reference", file);
    }
    setBusy(true);
    setError(null);
    setFailureReceipt(null);
    setResult(null);
    try {
      const response = await fetch("/api/demos/cloudflare-ai-gateway", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as GatewayResult & {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setFailureReceipt(body.receipt ?? null);
        throw new Error(
          body.error ??
            body.message ??
            `Generation failed (HTTP ${response.status}).`
        );
      }
      setResult(body);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Generation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    model,
    setModel,
    prompt,
    setPrompt,
    references,
    setReferences,
    referenceUrls,
    result,
    failureReceipt,
    error,
    busy,
    preparing,
    selectedSetup,
    selectReferences,
    generate,
  };
}
