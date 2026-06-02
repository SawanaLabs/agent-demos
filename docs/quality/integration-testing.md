---
title: Integration Testing
description: General conventions for repository integration tests, including Vercel Sandbox-backed contract tests.
updateAt: 2026-06-02
---

# Integration Testing

## Scope

- Covers repository-wide integration-test conventions.
- Covers tests that cross module boundaries, runtime providers, external services, or sandbox-backed execution.
- Covers the initial Vercel Sandbox integration-test direction for the `skills-agent` demo.
- Main current surfaces: `apps/web/vitest.config.ts`, `apps/web/vitest.integration.config.ts`, `apps/web/features/shared/vercel-sandbox/server/integration-test.ts`, `apps/web/features/shared/vercel-sandbox/server/session.ts`, `apps/web/features/skills-agent/server/*`, and `.agents/skills/skill-creator`.

## Domain Language

- **Integration test harness**: The opt-in test configuration and helper layer used for tests that need real runtime providers or cross-module behavior.
- **Sandbox integration test**: An integration test that creates a real Vercel Sandbox and verifies sandbox-backed behavior through the application server modules.
- **Deterministic integration scenario**: A scenario that avoids LLM sampling, browser timing, and UI rendering so the test verifies one runtime contract with low flake risk.
- **Release-gate integration test**: A higher-cost integration test that should run before declaring a sandbox-backed Agent Demo ready for release, and when code changes touch its runtime contract.

## Current Subdomain Docs

- Keep unit tests and integration tests separate. Normal quality gates should keep running fast tests by default; provider-backed tests should require explicit opt-in.
- Use Vitest for server-side integration tests unless the test must verify browser behavior. The current integration config is `apps/web/vitest.integration.config.ts`, and it includes only `features/**/*.integration.test.ts`.
- Integration tests should fail early with explicit setup errors. Do not silently skip a provider-backed test after the integration command has been explicitly requested.
- Require the explicit `VERCEL_SANDBOX_INTEGRATION=1` environment gate for real provider usage so local agents and CI do not create paid resources by accident.
- Keep Vercel Sandbox test sessions distinct from production demo sessions. Production `skills-agent` chat sandboxes stay persistent and chat-id named; test sandboxes should use unique names and `persistent: false`.
- Right-size sandbox test resources. Start Vercel Sandbox integration tests with `resources: { vcpus: 1 }`, no exposed ports unless the scenario needs one, and the shortest timeout that still allows bootstrap and cleanup.
- Always stop sandbox sessions in `finally`. If the SDK exposes deletion for the created resource, cleanup helpers may delete non-persistent test sandboxes after stopping them.
- Treat sandbox creation, active CPU, provisioned memory, network transfer, and snapshot storage as the cost drivers. Package downloads during cold bootstrap can dominate the cost of small tests, so avoid unnecessary dependency installs.
- Retry likely network-dependent sandbox bootstrap failures once, then surface the error. This follows the repository's general network retry convention without hiding broken contracts.
- Do not put LLM calls in the first sandbox integration layer. LLM-backed route tests are a separate, higher-cost layer because model output, gateway availability, and streaming timing add flake risk.

## Recommended Layers

- **Default tests**: Run during ordinary development and normal quality checks. These are unit or narrow module tests with no external provider usage.
- **Sandbox smoke integration**: Creates a Vercel Sandbox, runs a trivial command, verifies file write/read, and stops the sandbox. This validates provider credentials, SDK wiring, lifecycle, and cleanup at the lowest cost.
- **Skills Agent deterministic integration**: Creates a Vercel Sandbox, activates `skill-creator`, runs its script through `uv`, reads the generated skill artifact, validates it, and cleans up. The first implementation lives at `apps/web/features/skills-agent/server/skill-builder.integration.test.ts`.
- **LLM or browser integration**: Runs only when specifically needed to verify user-facing streaming, UI behavior, or model-tool coordination. This layer should not be the first release gate for sandbox runtime correctness.

## Skills Agent First Scenario

- The first `skills-agent` sandbox integration scenario should verify the Skill Builder path without using an LLM.
- Use the repository-local `.agents/skills/skill-creator` as the skill source.
- Create a sandbox-backed session through the same server session modules used by the demo, then load `skill-creator` into `/vercel/sandbox/project/.agents/skills/skill-creator`.
- Run `.agents/skills/skill-creator/scripts/init_skill.py` inside the sandbox with `uv run python`.
- Read the generated `artifacts/<skill-name>/SKILL.md` from the sandbox and assert that the expected skill name and frontmatter exist.
- Run `.agents/skills/skill-creator/scripts/quick_validate.py` with `uv run --with pyyaml python` so the validation dependency is explicit.
- Keep the scenario deterministic: no chat route, no model call, no browser automation, and no dev-server port exposure for the first version.

## Current Commands

- Run the provider-backed integration suite from the repo root with `VERCEL_SANDBOX_INTEGRATION=1 pnpm test:integration`.
- Run it from `apps/web` with `VERCEL_SANDBOX_INTEGRATION=1 pnpm test:integration`.
- The `apps/web` script sources root and app `.env`, `.env.local`, and `.env.development.local` files before running Vitest.
- Running the integration command without `VERCEL_SANDBOX_INTEGRATION=1` is expected to fail fast before creating any sandbox.

## Run Policy

- Do not run real Vercel Sandbox integration tests on every code edit by default.
- Run the sandbox smoke integration after introducing or changing the integration harness, Vercel Sandbox credentials, sandbox factory options, or cleanup logic.
- Run the Skills Agent deterministic integration when changing `apps/web/features/shared/vercel-sandbox`, `apps/web/features/skills-agent/server`, `.agents/skills/skill-creator`, or the Skill Builder artifact contract.
- Run the sandbox-backed integration suite before marking the `skills-agent` demo release-ready, and before merging changes that materially alter sandbox lifecycle, toolchain bootstrap, skill activation, or generated artifact handling.
- If the sandbox suite becomes stable and cheap enough, add a scheduled or pre-release CI job first. Do not add it to every default PR run until observed runtime, cost, and flake rate justify that.

## Update Triggers

- Update this file when integration test scripts are added, renamed, or moved.
- Update this file when the repository changes its default test runner or integration config layout.
- Update this file when Vercel Sandbox pricing, limits, default resources, or cleanup capabilities materially change.
- Update this file when the `skills-agent` sandbox runtime, `uv` bootstrap, skill activation, or Skill Builder artifact contract changes.
- Update this file when LLM-backed or browser-backed integration tests become part of the release gate.
