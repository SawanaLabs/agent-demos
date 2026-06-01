import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  checkRegistryProjection,
  checkSharedRegistryAssetProjection,
  readProjectionManifest,
  readSharedRegistryAssetManifest,
  resolveProjectionManifests,
  writeRegistryProjection,
  writeSharedRegistryAssetProjection,
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

async function withSharedAssetFixture(run) {
  const repoRoot = await mkdtemp(
    path.join(os.tmpdir(), "registry-shared-sync-")
  );

  try {
    fs.mkdirSync(
      path.join(repoRoot, "apps/web/features/shared/ai-gateway/server"),
      { recursive: true }
    );
    fs.mkdirSync(path.join(repoRoot, "apps/web/components"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "registry/public-demo/lib/ai-gateway"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "registry/public-demo/components"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "registry/private-demo/lib/ai-gateway"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(repoRoot, "scripts/registry-sync"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(
        repoRoot,
        "apps/web/features/shared/ai-gateway/server/contract.ts"
      ),
      "export const sharedGatewayContract = 'current';\n"
    );
    fs.writeFileSync(
      path.join(repoRoot, "registry/public-demo/lib/ai-gateway/contract.ts"),
      "export const sharedGatewayContract = 'current';\n"
    );
    fs.writeFileSync(
      path.join(repoRoot, "registry/private-demo/lib/ai-gateway/contract.ts"),
      "stale\n"
    );
    fs.writeFileSync(
      path.join(repoRoot, "apps/web/components/demo-workspace-shell.tsx"),
      "export function DemoWorkspaceShell() { return null; }\n"
    );
    fs.writeFileSync(
      path.join(
        repoRoot,
        "registry/public-demo/components/demo-workspace-shell.tsx"
      ),
      "export function DemoWorkspaceShell() { return null; }\n"
    );

    for (const slug of ["public-demo", "private-demo"]) {
      const files = [
        {
          path: "lib/ai-gateway/contract.ts",
          target: "@lib/ai-gateway/contract.ts",
          type: "registry:lib",
        },
      ];

      if (slug === "public-demo") {
        files.push({
          path: "components/demo-workspace-shell.tsx",
          target: "@components/demo-workspace-shell.tsx",
          type: "registry:component",
        });
      }

      fs.writeFileSync(
        path.join(repoRoot, "registry", slug, "registry.json"),
        JSON.stringify(
          {
            $schema: "https://ui.shadcn.com/schema/registry.json",
            items: [
              {
                files,
                name: slug,
                type: "registry:block",
              },
            ],
          },
          null,
          2
        )
      );
    }

    fs.writeFileSync(
      path.join(repoRoot, "registry/registry-demos.json"),
      JSON.stringify(
        {
          demos: [
            {
              publicRegistry: true,
              registryPath: "registry/public-demo/registry.json",
              slug: "public-demo",
            },
            {
              publicRegistry: false,
              registryPath: "registry/private-demo/registry.json",
              slug: "private-demo",
            },
          ],
        },
        null,
        2
      )
    );

    const manifestPath = path.join(
      repoRoot,
      "scripts/registry-sync/shared-registry-assets.json"
    );
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          entries: [
            {
              name: "ai-gateway-contract",
              source: "apps/web/features/shared/ai-gateway/server/contract.ts",
              target: "lib/ai-gateway/contract.ts",
            },
            {
              demos: ["public-demo"],
              name: "demo-workspace-shell",
              source: "apps/web/components/demo-workspace-shell.tsx",
              target: "components/demo-workspace-shell.tsx",
            },
          ],
          registryDemos: "registry/registry-demos.json",
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

test("projects shared registry assets into global and selected registry demo source chunks", async () => {
  await withSharedAssetFixture(({ manifestPath, repoRoot }) => {
    const manifest = readSharedRegistryAssetManifest(manifestPath);

    assert.deepEqual(
      checkSharedRegistryAssetProjection({ manifest, repoRoot }),
      {
        changed: ["registry/private-demo/lib/ai-gateway/contract.ts"],
        unchanged: [
          "registry/public-demo/lib/ai-gateway/contract.ts",
          "registry/public-demo/components/demo-workspace-shell.tsx",
        ],
      }
    );
    assert.deepEqual(
      writeSharedRegistryAssetProjection({ manifest, repoRoot }),
      {
        changed: ["registry/private-demo/lib/ai-gateway/contract.ts"],
        unchanged: [
          "registry/public-demo/lib/ai-gateway/contract.ts",
          "registry/public-demo/components/demo-workspace-shell.tsx",
        ],
      }
    );
    assert.equal(
      fs.readFileSync(
        path.join(repoRoot, "registry/private-demo/lib/ai-gateway/contract.ts"),
        "utf8"
      ),
      "export const sharedGatewayContract = 'current';\n"
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
