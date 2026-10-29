import {
  ArrowSquareOutIcon,
  FilmStripIcon,
} from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@workspace/ui/components/button";
import Link from "next/link";
import { PageText } from "@/components/page-copy";

export function ShipwordsVideoCallout() {
  return (
    <section className="flex flex-col justify-between gap-5 border border-status-warning-500/25 bg-status-warning-500/5 px-4 py-5 sm:flex-row sm:items-center">
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-muted-foreground text-xs">
          <FilmStripIcon />
          <PageText>UI slice · Adapted from ShipWords</PageText>
        </p>
        <h2 className="font-medium text-2xl tracking-tight">
          <PageText>Cast a Tiny Desk video</PageText>
        </h2>
        <p className="max-w-2xl text-muted-foreground text-sm/relaxed">
          <PageText>
            A standalone video tool UI with photo casting, seat swapping, and
            generation state previews. MIT source attribution included.
          </PageText>
        </p>
      </div>
      <Link
        className={buttonVariants({ className: "shrink-0 gap-2", size: "sm" })}
        href="/tools/shipwords-video"
      >
        <PageText>Open video UI slice</PageText>
        <ArrowSquareOutIcon />
      </Link>
    </section>
  );
}
