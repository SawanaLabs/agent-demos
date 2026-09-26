/**
 * Package seam for Vercel's eve agent framework
 * (https://github.com/vercel/eve, Apache-2.0, beta).
 *
 * The package is loaded through a lazy, non-literal dynamic import so this
 * feature slice still typechecks, builds, and renders its setup state before
 * the dependency is installed. Once the published npm package name is
 * confirmed, run `pnpm --filter web add <name>` and keep
 * EVE_PACKAGE_SPECIFIER aligned with it.
 */
export const EVE_PACKAGE_SPECIFIER = "eve";

export interface EveAgentModule {
  [exportName: string]: unknown;
}

export type EveSupport =
  | { status: "ready"; module: EveAgentModule }
  | { status: "missing"; issue: string }
  | { status: "failed"; issue: string };

export const evePackageMissingIssue = `The ${EVE_PACKAGE_SPECIFIER} package is not installed. Confirm the published package name at https://github.com/vercel/eve, run \`pnpm --filter web add ${EVE_PACKAGE_SPECIFIER}\`, and keep EVE_PACKAGE_SPECIFIER in server/eve.ts aligned with it.`;

export class EvePackageUnavailableError extends Error {
  readonly issue: string;

  constructor(issue: string) {
    super(issue);
    this.name = "EvePackageUnavailableError";
    this.issue = issue;
  }
}

async function importEveModule(): Promise<EveAgentModule> {
  const specifier: string = EVE_PACKAGE_SPECIFIER;

  return (await import(specifier)) as EveAgentModule;
}

function isModuleNotFound(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;

  if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
    return true;
  }

  return (
    error instanceof Error &&
    /cannot find|not found/i.test(error.message) &&
    error.message.includes(EVE_PACKAGE_SPECIFIER)
  );
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function resolveEveSupport(
  importer: () => Promise<EveAgentModule> = importEveModule
): Promise<EveSupport> {
  try {
    return { module: await importer(), status: "ready" };
  } catch (error) {
    if (isModuleNotFound(error)) {
      return { issue: evePackageMissingIssue, status: "missing" };
    }

    return {
      issue: `The ${EVE_PACKAGE_SPECIFIER} package resolved but failed to load: ${describeError(error)}`,
      status: "failed",
    };
  }
}

export async function loadEveModule(): Promise<EveAgentModule> {
  const support = await resolveEveSupport();

  if (support.status !== "ready") {
    throw new EvePackageUnavailableError(support.issue);
  }

  return support.module;
}
