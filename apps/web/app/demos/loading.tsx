import { Skeleton } from "@workspace/ui/components/skeleton";

export default function DemosLoading() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Agent Demos
            </p>
            <h1 className="font-medium text-2xl tracking-tight">
              Opening demo
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              The demo workspace is loading. This can take a little longer on
              slow mobile networks.
            </p>
          </div>
          <Skeleton className="h-7 w-32" />
        </header>

        <section className="grid gap-4 border border-foreground/10 bg-background p-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-4/5" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </section>
      </div>
    </main>
  );
}
