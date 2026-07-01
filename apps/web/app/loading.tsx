import { Skeleton } from "@workspace/ui/components/skeleton";

const gallerySkeletonKeys = [
  "recommended-demo",
  "registry-demo",
  "langgraph-demo",
  "openai-demo",
  "rag-demo",
  "sandbox-demo",
] as const;

export default function Loading() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-6 border border-foreground/10 bg-background px-4 py-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Agent Demos
            </p>
            <Skeleton className="h-10 w-full max-w-2xl" />
            <Skeleton className="h-16 w-full max-w-3xl" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="space-y-3 border border-foreground/10 bg-muted/40 p-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-28 w-full" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gallerySkeletonKeys.map((key) => (
            <div
              className="space-y-4 border border-foreground/10 bg-background p-4"
              key={key}
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="aspect-video w-full" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
