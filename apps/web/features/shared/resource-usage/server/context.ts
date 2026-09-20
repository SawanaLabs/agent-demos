import { AsyncLocalStorage } from "node:async_hooks";

/** Portable execution hook. Hosts can enforce a budget without coupling demos to billing. */
export type ResourceOperation =
  | "image_generation"
  | "text_generation"
  | "rag_search"
  | "sandbox_start";

const execution = new AsyncLocalStorage<
  (operation: ResourceOperation, count?: number) => Promise<void>
>();

export interface ResourceUsageDenial {
  remainingUnits: number;
  requiredUnits: number;
  resetAt: string;
}

export class ResourceUsageDeniedError extends Error {
  readonly details?: ResourceUsageDenial;
  constructor(message: string, details?: ResourceUsageDenial) {
    super(message);
    this.details = details;
  }
}

export function withResourceUsage<T>(
  consume: (operation: ResourceOperation, count?: number) => Promise<void>,
  run: () => T
): T {
  return execution.run(consume, run);
}

export async function consumeResource(
  operation: ResourceOperation,
  count?: number
) {
  if (count !== undefined && (!Number.isSafeInteger(count) || count < 1)) {
    throw new Error("Resource count must be a positive integer.");
  }
  const consume = execution.getStore();
  if (count === undefined) {
    await consume?.(operation);
  } else {
    await consume?.(operation, count);
  }
}
