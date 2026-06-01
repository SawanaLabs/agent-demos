import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkRegistryProjection,
  readProjectionManifest,
  resolveProjectionManifests,
  writeRegistryProjection,
} from "./registry-projection.mjs";

const expectedMatchPattern = /expected 2 match/;
const missingTargetPattern = /missing target file/;
const missingRegistryItemFilePattern =
  /registry item files\[\] does not include lib\/demo\/runtime\.ts/;

async function withFixture(run) {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "registry-sync-"));

  try {
    fs.mkdirSync(path.join(repoRoot, "apps/web/features/demo"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "registry/demo/lib/demo"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "scripts/registry-sync"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(repoRoot, "apps/web/features/demo/runtime.ts"),
      'import { env } from "@/env";\nexport const source = env.VALUE;\n'
    );
    fs.writeFileSync(
      path.join(repoRoot, "registry/demo/lib/demo/runtime.ts"),
      "export const source = process.env.VALUE;\n"
    );
    fs.writeFileSync(
      path.join(repoRoot, "registry/demo/registry.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema/registry.json",
          items: [
            {
              files: [
                {
                  path: "lib/demo/runtime.ts",
                  target: "@lib/demo/runtime.ts",
                  type: "registry:lib",
                },
              ],
              name: "demo",
              type: "registry:block",
            },
          ],
        },
        null,
        2
      )
    );

    const manifestPath = path.join(
      repoRoot,
      "scripts/registry-sync/demo.manifest.json"
    );
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          demo: "demo",
          entries: [
            {
              source: "apps/web/features/demo/runtime.ts",
              target: "registry/demo/lib/demo/runtime.ts",
              transforms: [
                {
                  expectedMatches: 1,
                  from: 'import { env } from "@/env";\n',
                  to: "",
                },
                {
                  expectedMatches: 1,
                  from: "env.VALUE",
                  to: "process.env.VALUE",
                },
              ],
              forbidPatternsAfterTransform: ['from "@/env"', "source = env"],
            },
          ],
        },
        null,
        2
      )
    );

    await run({ manifestPath, repoRoot });
  } finally {
    await rm(repoRoot, { force: true, recursive: true });
  }
}

test("checks a clean projection manifest", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const manifest = readProjectionManifest(manifestPath);

    assert.deepEqual(checkRegistryProjection({ manifest, repoRoot }), {
      changed: [],
      unchanged: ["registry/demo/lib/demo/runtime.ts"],
    });
  });
});

test("writes drifted projection targets", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const targetPath = path.join(repoRoot, "registry/demo/lib/demo/runtime.ts");
    fs.writeFileSync(targetPath, "stale\n");
    const manifest = readProjectionManifest(manifestPath);

    assert.deepEqual(writeRegistryProjection({ manifest, repoRoot }), {
      changed: ["registry/demo/lib/demo/runtime.ts"],
      unchanged: [],
    });
    assert.equal(
      fs.readFileSync(targetPath, "utf8"),
      "export const source = process.env.VALUE;\n"
    );
  });
});

test("writes newly projected targets", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const targetPath = path.join(repoRoot, "registry/demo/lib/demo/runtime.ts");
    fs.unlinkSync(targetPath);
    const manifest = readProjectionManifest(manifestPath);

    assert.throws(
      () => checkRegistryProjection({ manifest, repoRoot }),
      missingTargetPattern
    );
    assert.deepEqual(writeRegistryProjection({ manifest, repoRoot }), {
      changed: ["registry/demo/lib/demo/runtime.ts"],
      unchanged: [],
    });
    assert.equal(
      fs.readFileSync(targetPath, "utf8"),
      "export const source = process.env.VALUE;\n"
    );
  });
});

test("fails when a projected target is missing from registry item files", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const registryPath = path.join(repoRoot, "registry/demo/registry.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    registry.items[0].files = [];
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    const manifest = readProjectionManifest(manifestPath);

    assert.throws(
      () => checkRegistryProjection({ manifest, repoRoot }),
      missingRegistryItemFilePattern
    );
  });
});

test("allows manifest entries that explicitly skip registry item files", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const registryPath = path.join(repoRoot, "registry/demo/registry.json");
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    registry.items[0].files = [];
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    const manifest = readProjectionManifest(manifestPath);
    manifest.entries[0].registryItemFile = false;

    assert.deepEqual(checkRegistryProjection({ manifest, repoRoot }), {
      changed: [],
      unchanged: ["registry/demo/lib/demo/runtime.ts"],
    });
  });
});

test("fails on transform mismatch before writing", async () => {
  await withFixture(({ manifestPath, repoRoot }) => {
    const manifest = readProjectionManifest(manifestPath);
    manifest.entries[0].transforms[0].expectedMatches = 2;

    assert.throws(
      () => checkRegistryProjection({ manifest, repoRoot }),
      expectedMatchPattern
    );
  });
});

test("resolves all manifests in stable order", async () => {
  await withFixture(({ repoRoot }) => {
    const syncRoot = path.join(repoRoot, "scripts/registry-sync");
    fs.writeFileSync(path.join(syncRoot, "z-demo.manifest.json"), "{}");
    fs.writeFileSync(path.join(syncRoot, "a-demo.manifest.json"), "{}");

    assert.deepEqual(
      resolveProjectionManifests({ repoRoot }).map((filePath) =>
        path.basename(filePath)
      ),
      ["a-demo.manifest.json", "demo.manifest.json", "z-demo.manifest.json"]
    );
  });
});
