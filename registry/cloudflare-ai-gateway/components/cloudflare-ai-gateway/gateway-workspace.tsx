"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import type { GatewaySetup } from "@/lib/cloudflare-ai-gateway/contract";
import { GatewayResults } from "./gateway-results";
import { useGatewayWorkspace } from "./use-gateway-workspace";

const selectClassName =
  "h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function GatewayWorkspace({ setup }: { setup: GatewaySetup }) {
  const state = useGatewayWorkspace(setup);
  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <form
        className="flex min-h-0 flex-col gap-5 overflow-y-auto border border-border bg-card p-5"
        onSubmit={state.generate}
      >
        <div className="space-y-2">
          <Label htmlFor="gateway-model">Model</Label>
          <select
            className={selectClassName}
            disabled={state.busy}
            id="gateway-model"
            name="model"
            onChange={(event) =>
              state.setModel(event.target.value as typeof state.model)
            }
            value={state.model}
          >
            <option value="gpt-image-2">OpenAI GPT Image 2</option>
            <option value="gemini-3.1-flash-image">
              Google Gemini 3.1 Flash Image
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gateway-prompt">Prompt</Label>
          <Textarea
            className="min-h-36"
            dir="auto"
            disabled={state.busy}
            id="gateway-prompt"
            maxLength={5000}
            name="prompt"
            onChange={(event) => state.setPrompt(event.target.value)}
            placeholder="Describe an image, or the change to make to your reference photos."
            required
            value={state.prompt}
          />
          <Button
            disabled={state.busy}
            onClick={() =>
              state.setPrompt(
                "A small red ceramic mug on a wooden table, soft daylight, product photography."
              )
            }
            type="button"
            variant="ghost"
          >
            Use example prompt
          </Button>
        </div>
        {state.model === "gpt-image-2" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gateway-quality">Quality</Label>
              <select
                className={selectClassName}
                defaultValue="low"
                disabled={state.busy}
                id="gateway-quality"
                name="quality"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-size">Size</Label>
              <select
                className={selectClassName}
                defaultValue="1024x1024"
                disabled={state.busy}
                id="gateway-size"
                name="size"
              >
                <option>1024x1024</option>
                <option>1024x1536</option>
                <option>1536x1024</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gateway-image-size">Resolution</Label>
              <select
                className={selectClassName}
                defaultValue="1K"
                disabled={state.busy}
                id="gateway-image-size"
                name="imageSize"
              >
                <option>1K</option>
                <option>2K</option>
                <option>4K</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-aspect-ratio">Aspect ratio</Label>
              <select
                className={selectClassName}
                defaultValue="1:1"
                disabled={state.busy}
                id="gateway-aspect-ratio"
                name="aspectRatio"
              >
                <option>1:1</option>
                <option>2:3</option>
                <option>3:2</option>
                <option>9:16</option>
                <option>16:9</option>
              </select>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="gateway-reference">Reference photos (optional)</Label>
          <Input
            accept="image/png,image/jpeg,image/webp"
            disabled={state.busy || state.preparing}
            id="gateway-reference"
            multiple
            onChange={state.selectReferences}
            type="file"
          />
          <p className="text-muted-foreground text-xs">
            Up to 4 photos, 3 MB total. Describe the edits in your prompt.
          </p>
          {state.references.length > 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto">
                {state.referenceUrls.map((url, index) => (
                  <Image
                    alt={`Reference ${index + 1}`}
                    className="size-20 shrink-0 object-cover"
                    height={80}
                    key={url}
                    src={url}
                    unoptimized
                    width={80}
                  />
                ))}
              </div>
              <Button
                disabled={state.busy}
                onClick={() => state.setReferences([])}
                type="button"
                variant="ghost"
              >
                Clear references
              </Button>
            </div>
          ) : null}
        </div>
        {state.selectedSetup.available ? null : (
          <p className="break-words text-muted-foreground text-sm">
            Server setup required: {state.selectedSetup.missing.join(", ")}.
          </p>
        )}
        <Button
          className="mt-auto"
          disabled={
            !state.selectedSetup.available ||
            state.busy ||
            state.preparing ||
            !state.prompt.trim()
          }
          type="submit"
        >
          {state.busy ? "Generating image…" : "Generate image"}
        </Button>
      </form>
      <GatewayResults
        busy={state.busy}
        error={state.error}
        receipt={state.failureReceipt}
        result={state.result}
      />
    </div>
  );
}
