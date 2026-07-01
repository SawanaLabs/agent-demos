import { Skeleton } from "@workspace/ui/components/skeleton";

const guideSectionKeys = [
  "requirements",
  "install",
  "configure",
  "verify",
] as const;

export default function Loading() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-5 border border-foreground/10 bg-background px-4 py-5">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full max-w-3xl" />
            <Skeleton className="h-20 w-full max-w-4xl" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {guideSectionKeys.map((key) => (
            <div
              className="space-y-3 border border-foreground/10 bg-background p-4"
              key={key}
            >
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
