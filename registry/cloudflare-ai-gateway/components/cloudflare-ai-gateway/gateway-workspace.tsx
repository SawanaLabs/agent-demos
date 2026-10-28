"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { DemoSessionResetButton } from "@/components/demo-session";
import { PageText, usePageCopy } from "@/components/page-copy";
import type { GatewaySetup } from "@/lib/cloudflare-ai-gateway/contract";
import { GatewayResults } from "./gateway-results";
import { useGatewayWorkspace } from "./use-gateway-workspace";

const selectClassName =
  "h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function GatewayWorkspace({ setup }: { setup: GatewaySetup }) {
  const pageCopy = usePageCopy();

  const state = useGatewayWorkspace(setup);
  return (
    <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
      <form
        className="flex min-h-0 flex-col gap-5 overflow-y-auto border border-border bg-card p-5"
        data-demo-session-workspace=""
        onSubmit={state.generate}
      >
        <div className="flex justify-end">
          <DemoSessionResetButton />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gateway-model">
            <PageText>{"Model"}</PageText>
          </Label>
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
            <option value="gpt-image-2">
              <PageText>{"OpenAI GPT Image 2"}</PageText>
            </option>
            <option value="gemini-3.1-flash-image">
              <PageText>{"Google Gemini 3.1 Flash Image"}</PageText>
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gateway-prompt">
            <PageText>{"Prompt"}</PageText>
          </Label>
          <Textarea
            className="min-h-36"
            dir="auto"
            disabled={state.busy}
            id="gateway-prompt"
            maxLength={5000}
            name="prompt"
            onChange={(event) => state.setPrompt(event.target.value)}
            placeholder={pageCopy(
              "Describe an image, or the change to make to your reference photos."
            )}
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
            <PageText>{"Use example prompt"}</PageText>
          </Button>
        </div>
        {state.model === "gpt-image-2" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gateway-quality">
                <PageText>{"Quality"}</PageText>
              </Label>
              <select
                className={selectClassName}
                defaultValue="low"
                disabled={state.busy}
                id="gateway-quality"
                name="quality"
              >
                <option value="low">
                  <PageText>{"Low"}</PageText>
                </option>
                <option value="medium">
                  <PageText>{"Medium"}</PageText>
                </option>
                <option value="high">
                  <PageText>{"High"}</PageText>
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-size">
                <PageText>{"Size"}</PageText>
              </Label>
              <select
                className={selectClassName}
                defaultValue="1024x1024"
                disabled={state.busy}
                id="gateway-size"
                name="size"
              >
                <option>
                  <PageText>{"1024x1024"}</PageText>
                </option>
                <option>
                  <PageText>{"1024x1536"}</PageText>
                </option>
                <option>
                  <PageText>{"1536x1024"}</PageText>
                </option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gateway-image-size">
                <PageText>{"Resolution"}</PageText>
              </Label>
              <select
                className={selectClassName}
                defaultValue="1K"
                disabled={state.busy}
                id="gateway-image-size"
                name="imageSize"
              >
                <option>
                  <PageText>{"1K"}</PageText>
                </option>
                <option>
                  <PageText>{"2K"}</PageText>
                </option>
                <option>
                  <PageText>{"4K"}</PageText>
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-aspect-ratio">
                <PageText>{"Aspect ratio"}</PageText>
              </Label>
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
          <Label htmlFor="gateway-reference">
            <PageText>{"Reference photos (optional)"}</PageText>
          </Label>
          <Input
            accept="image/png,image/jpeg,image/webp"
            disabled={state.busy || state.preparing}
            id="gateway-reference"
            multiple
            onChange={state.selectReferences}
            type="file"
          />
          <p className="text-muted-foreground text-xs">
            <PageText>
              {"Up to 4 photos, 3 MB total. Describe the edits in your prompt."}
            </PageText>
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
                <PageText>{"Clear references"}</PageText>
              </Button>
            </div>
          ) : null}
        </div>
        {state.selectedSetup.available ? null : (
          <p className="break-words text-muted-foreground text-sm">
            <PageText>{"Server setup required: "}</PageText>
            {state.selectedSetup.missing.join(", ")}.
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
          <PageText>
            {state.busy ? "Generating image…" : "Generate image"}
          </PageText>
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
