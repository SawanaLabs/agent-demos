import Image from "next/image";
import type { GatewayReceipt, GatewayResult } from "@/lib/cloudflare-ai-gateway/contract";

function Receipt({ receipt }: { receipt: GatewayReceipt }) {
  let cost = `Cost: unavailable (${receipt.costLookup.status}).`;
  if (receipt.costLookup.reportedUsd !== null) {
    cost = `Vercel generation cost: $${receipt.costLookup.reportedUsd.toFixed(6)}.`;
  } else if (receipt.costLookup.estimateUsd !== null) {
    cost = `Cloudflare log estimate: $${receipt.costLookup.estimateUsd.toFixed(6)}.`;
  }
  return (
    <details className="border-border border-t pt-4 text-sm">
      <summary className="cursor-pointer font-medium">
        Request receipt and cost
      </summary>
      <div className="mt-3 space-y-2 text-muted-foreground">
        <p>Actual charge: unavailable. {cost}</p>
        <p>
          {receipt.gateway === "cloudflare"
            ? "Cloudflare log costs are estimates. "
            : ""}
          Confirm charges in your billing dashboard.
        </p>
        <pre className="overflow-x-auto bg-muted p-3 text-xs">
          {JSON.stringify(receipt, null, 2)}
        </pre>
      </div>
    </details>
  );
}

export function GatewayResults({
  result,
  busy,
  error,
  receipt,
}: {
  result: GatewayResult | null;
  busy: boolean;
  error: string | null;
  receipt: GatewayReceipt | null;
}) {
  return (
    <section
      aria-busy={busy}
      aria-label="Generated images"
      className="flex min-h-96 min-w-0 flex-col gap-4 overflow-y-auto border border-border bg-card p-5"
    >
      <h2 className="font-medium text-lg">Result</h2>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {busy ? (
        <p className="text-muted-foreground text-sm" role="status">
          Creating your image. This can take a minute.
        </p>
      ) : null}
      {result || busy || error ? null : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div
            aria-hidden="true"
            className="grid size-24 place-items-center border border-border border-dashed text-4xl text-muted-foreground"
          >
            +
          </div>
          <p className="max-w-sm text-muted-foreground text-sm">
            Start with a prompt. Add reference photos to edit an existing image
            or guide the result.
          </p>
        </div>
      )}
      {result?.images.map((image, index) => {
        const url = `data:${image.mediaType};base64,${image.base64}`;
        const extension = image.mediaType.split("/")[1];
        return (
          <figure
            className="space-y-3"
            key={`${index}-${image.base64.slice(0, 32)}`}
          >
            <Image
              alt={`Generated result ${index + 1}`}
              className="h-auto max-h-[70vh] w-full object-contain"
              height={1024}
              src={url}
              unoptimized
              width={1024}
            />
            <figcaption>
              <a
                className="inline-flex border border-border px-4 py-2 text-sm hover:bg-muted"
                download={`${result.receipt.gateway}-image-${index + 1}.${extension}`}
                href={url}
              >
                Download image {result.images.length > 1 ? index + 1 : ""}
              </a>
            </figcaption>
          </figure>
        );
      })}
      {result ? <Receipt receipt={result.receipt} /> : null}
      {receipt ? <Receipt receipt={receipt} /> : null}
    </section>
  );
}
