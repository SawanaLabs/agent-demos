import {
  assertSupportedNodeRuntime as assertContractSupportedNodeRuntime,
  MINIMUM_NODE_VERSION as CONTRACT_MINIMUM_NODE_VERSION,
  getNodeMajor as getContractNodeMajor,
  parseNodeVersion as parseContractNodeVersion,
} from "./contract";

export const MINIMUM_NODE_VERSION = CONTRACT_MINIMUM_NODE_VERSION;

export function parseNodeVersion(version: string) {
  return parseContractNodeVersion(version);
}

export function getNodeMajor(version: string): number {
  return getContractNodeMajor(version);
}

export function assertSupportedNodeRuntime(version = process.version): number {
  return assertContractSupportedNodeRuntime(version);
}
