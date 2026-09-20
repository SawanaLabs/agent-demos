import { AsyncLocalStorage } from "node:async_hooks";

/** Portable execution hook. Hosts can enforce a budget without coupling demos to billing. */
export type ResourceOperation =
  | "image_generation"
  | "text_generation"
  | "rag_search"
  | "sandbox_start";

const execution = new AsyncLocalStorage<
  (operation: ResourceOperation) => Promise<void>
>();

export class ResourceUsageDeniedError extends Error {}

export function withResourceUsage<T>(
  consume: (operation: ResourceOperation) => Promise<void>,
  run: () => T
): T {
  return execution.run(consume, run);
}

export async function consumeResource(operation: ResourceOperation) {
  await execution.getStore()?.(operation);
}
