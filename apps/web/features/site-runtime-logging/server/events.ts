export const runtimeErrorEventCatalog = [
  "demo.provider_failed",
  "demo.runtime_failed",
  "demo.storage_failed",
  "demo.tool_failed",
  "client.runtime_failed",
] as const;

export const runtimeErrorEvents = {
  demoProviderFailed: runtimeErrorEventCatalog[0],
  demoRuntimeFailed: runtimeErrorEventCatalog[1],
  demoStorageFailed: runtimeErrorEventCatalog[2],
  demoToolFailed: runtimeErrorEventCatalog[3],
  clientRuntimeFailed: runtimeErrorEventCatalog[4],
} as const;

export type RuntimeErrorEvent = (typeof runtimeErrorEventCatalog)[number];
