export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getGeneratedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export function SkeletonLine({ className = "w-full" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-3 rounded bg-muted ${className}`}
    />
  );
}
