export const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern =
  /^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseNodeVersion(version: string): ParsedNodeVersion {
  const match = nodeVersionPattern.exec(version);
  const major = Number(match?.groups?.major);
  const minor = Number(match?.groups?.minor);
  const patch = Number(match?.groups?.patch);

  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Unable to parse Node.js version: "${version}".`);
  }

  return { major, minor, patch };
}

export function getNodeMajor(version: string): number {
  return parseNodeVersion(version).major;
}

function compareNodeVersions(
  left: ParsedNodeVersion,
  right: ParsedNodeVersion
): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

export function assertSupportedNodeRuntime(version = process.version): number {
  const parsedVersion = parseNodeVersion(version);
  const minimumVersion = parseNodeVersion(MINIMUM_NODE_VERSION);

  if (compareNodeVersions(parsedVersion, minimumVersion) < 0) {
    throw new Error(
      `Node.js ${version} is unsupported. This demo workspace requires Node.js >=${MINIMUM_NODE_VERSION}.`
    );
  }

  return parsedVersion.major;
}
