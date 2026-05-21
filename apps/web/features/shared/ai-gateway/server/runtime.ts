export const MINIMUM_NODE_MAJOR = 20;
const nodeMajorPattern = /^v?(?<major>\d+)/;

export function getNodeMajor(version: string): number {
  const match = nodeMajorPattern.exec(version);
  const major = Number(match?.groups?.major);

  if (!Number.isInteger(major)) {
    throw new Error(`Unable to parse Node.js version: "${version}".`);
  }

  return major;
}

export function assertSupportedNodeRuntime(version = process.version): number {
  const major = getNodeMajor(version);

  if (major < MINIMUM_NODE_MAJOR) {
    throw new Error(
      `Node.js ${version} is unsupported. This demo workspace requires Node.js >=${MINIMUM_NODE_MAJOR}.`
    );
  }

  return major;
}
