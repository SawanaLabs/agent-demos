type DemoStatus = "ready" | "roadmap";

interface DemoCatalogAvailabilityEntry {
  href?: `/demos/${string}`;
  slug: string;
  status: DemoStatus;
  title: string;
}

interface RegistryDemoManifestEntry {
  mainline?: boolean;
  publicRegistry: boolean;
  registryPath: string;
  setup: string;
  slug: string;
  title: string;
}

interface OmittedReadyDemoManifestEntry {
  reason: string;
  slug: string;
}

interface RegistryAvailabilityManifest {
  demos: RegistryDemoManifestEntry[];
  omittedReadyDemos?: OmittedReadyDemoManifestEntry[];
}

export interface RegistryAvailabilityOmission
  extends OmittedReadyDemoManifestEntry {
  catalogEntry: DemoCatalogAvailabilityEntry;
}

export interface RegistryAvailability {
  mainlineRegistryDemo: RegistryDemoManifestEntry;
  omittedReadyDemos: RegistryAvailabilityOmission[];
  privateRegistryDemos: RegistryDemoManifestEntry[];
  publicRegistryDemos: RegistryDemoManifestEntry[];
  registryDemos: RegistryDemoManifestEntry[];
}

function assertNonEmptyString(
  value: unknown,
  field: string
): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${field} to be a non-empty string.`);
  }
}

function assertBoolean(
  value: unknown,
  field: string
): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Expected ${field} to be a boolean.`);
  }
}

function catalogEntriesBySlug(entries: DemoCatalogAvailabilityEntry[]) {
  const entriesBySlug = new Map<string, DemoCatalogAvailabilityEntry>();

  for (const entry of entries) {
    assertNonEmptyString(entry.slug, "demoCatalogEntry.slug");
    assertNonEmptyString(entry.title, `${entry.slug}.title`);

    if (entry.status !== "ready" && entry.status !== "roadmap") {
      throw new Error(`Unsupported demo catalog status for ${entry.slug}.`);
    }

    if (entriesBySlug.has(entry.slug)) {
      throw new Error(`Duplicate demo catalog slug: ${entry.slug}.`);
    }

    entriesBySlug.set(entry.slug, entry);
  }

  return entriesBySlug;
}

function registryDemosBySlug(demos: RegistryDemoManifestEntry[]) {
  if (!Array.isArray(demos) || demos.length === 0) {
    throw new Error("Expected registryManifest.demos to contain entries.");
  }

  const demosBySlug = new Map<string, RegistryDemoManifestEntry>();

  for (const demo of demos) {
    assertNonEmptyString(demo.slug, "registryDemo.slug");
    assertNonEmptyString(demo.title, `${demo.slug}.title`);
    assertNonEmptyString(demo.registryPath, `${demo.slug}.registryPath`);
    assertNonEmptyString(demo.setup, `${demo.slug}.setup`);
    assertBoolean(demo.publicRegistry, `${demo.slug}.publicRegistry`);

    if (demosBySlug.has(demo.slug)) {
      throw new Error(`Duplicate registry demo slug: ${demo.slug}.`);
    }

    demosBySlug.set(demo.slug, demo);
  }

  return demosBySlug;
}

function assertRegistryDemosExistInCatalog({
  catalogBySlug,
  registryDemos,
}: {
  catalogBySlug: Map<string, DemoCatalogAvailabilityEntry>;
  registryDemos: RegistryDemoManifestEntry[];
}) {
  for (const registryDemo of registryDemos) {
    const catalogEntry = catalogBySlug.get(registryDemo.slug);

    if (!catalogEntry) {
      throw new Error(
        `Registry demo missing catalog entry: ${registryDemo.slug}.`
      );
    }

    if (catalogEntry.status !== "ready") {
      throw new Error(
        `Registry demo must reference a ready catalog entry: ${registryDemo.slug}.`
      );
    }
  }
}

function buildOmittedReadyDemos({
  catalogBySlug,
  omittedReadyDemos,
  registryBySlug,
}: {
  catalogBySlug: Map<string, DemoCatalogAvailabilityEntry>;
  omittedReadyDemos: OmittedReadyDemoManifestEntry[];
  registryBySlug: Map<string, RegistryDemoManifestEntry>;
}) {
  const seenSlugs = new Set<string>();

  return omittedReadyDemos.map((omission) => {
    assertNonEmptyString(omission.slug, "omittedReadyDemo.slug");
    assertNonEmptyString(omission.reason, `${omission.slug}.reason`);

    if (seenSlugs.has(omission.slug)) {
      throw new Error(`Duplicate omitted ready demo slug: ${omission.slug}.`);
    }
    seenSlugs.add(omission.slug);

    if (registryBySlug.has(omission.slug)) {
      throw new Error(
        `Ready demo cannot be both registry-exported and omitted: ${omission.slug}.`
      );
    }

    const catalogEntry = catalogBySlug.get(omission.slug);

    if (!catalogEntry || catalogEntry.status !== "ready") {
      throw new Error(
        `Omitted ready demo must reference a ready catalog entry: ${omission.slug}.`
      );
    }

    return {
      ...omission,
      catalogEntry,
    };
  });
}

function assertEveryReadyDemoClassified({
  catalogBySlug,
  omittedReadyDemos,
  registryBySlug,
}: {
  catalogBySlug: Map<string, DemoCatalogAvailabilityEntry>;
  omittedReadyDemos: RegistryAvailabilityOmission[];
  registryBySlug: Map<string, RegistryDemoManifestEntry>;
}) {
  const omittedBySlug = new Set(omittedReadyDemos.map((demo) => demo.slug));
  const missingSlugs = [...catalogBySlug.values()]
    .filter((entry) => entry.status === "ready")
    .map((entry) => entry.slug)
    .filter((slug) => !(registryBySlug.has(slug) || omittedBySlug.has(slug)));

  if (missingSlugs.length > 0) {
    throw new Error(
      `Ready demo missing registry availability classification: ${missingSlugs.join(
        ", "
      )}.`
    );
  }
}

function findMainlineRegistryDemo(
  publicRegistryDemos: RegistryDemoManifestEntry[]
) {
  const mainlineDemos = publicRegistryDemos.filter((demo) => demo.mainline);

  if (mainlineDemos.length !== 1 || !mainlineDemos[0]) {
    throw new Error("Expected exactly one public mainline registry demo.");
  }

  return mainlineDemos[0];
}

export function buildRegistryAvailability({
  demoCatalogEntries,
  registryManifest,
}: {
  demoCatalogEntries: DemoCatalogAvailabilityEntry[];
  registryManifest: RegistryAvailabilityManifest;
}): RegistryAvailability {
  const catalogBySlug = catalogEntriesBySlug(demoCatalogEntries);
  const registryBySlug = registryDemosBySlug(registryManifest.demos);
  const omittedReadyDemos = buildOmittedReadyDemos({
    catalogBySlug,
    omittedReadyDemos: registryManifest.omittedReadyDemos ?? [],
    registryBySlug,
  });

  assertRegistryDemosExistInCatalog({
    catalogBySlug,
    registryDemos: registryManifest.demos,
  });
  assertEveryReadyDemoClassified({
    catalogBySlug,
    omittedReadyDemos,
    registryBySlug,
  });

  const publicRegistryDemos = registryManifest.demos.filter(
    (demo) => demo.publicRegistry
  );

  if (publicRegistryDemos.length === 0) {
    throw new Error("At least one demo must be publicRegistry: true.");
  }

  return {
    mainlineRegistryDemo: findMainlineRegistryDemo(publicRegistryDemos),
    omittedReadyDemos,
    privateRegistryDemos: registryManifest.demos.filter(
      (demo) => !demo.publicRegistry
    ),
    publicRegistryDemos,
    registryDemos: registryManifest.demos,
  };
}
