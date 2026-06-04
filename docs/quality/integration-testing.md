---
title: Integration Testing
description: General conventions for repository integration tests, including Vercel Sandbox-backed contract tests.
updateAt: 2026-06-04
---

# Integration Testing

## Scope

- Covers repository-wide integration-test conventions.
- Covers tests that cross module boundaries, runtime providers, external services, or sandbox-backed execution.
- Covers the initial Vercel Sandbox integration-test direction for the `skills-agent` and Ultra Chatbot Agent demos.
- Main current surfaces: `apps/web/vitest.config.ts`, `apps/web/vitest.integration.config.ts`, `scripts/smoke/demos-production.mjs`, `apps/web/features/shared/vercel-sandbox/server/integration-test.ts`, `apps/web/features/shared/vercel-sandbox/server/session.ts`, `apps/web/features/skills-agent/server/*`, `apps/web/features/ultra-chatbot-agent/server/sandbox-tools.integration.test.ts`, and `.agents/skills/skill-creator`.

## Domain Language

- **Unit test**: A fast local test for a small interface, module contract, parser, gate, or state transition with no real external provider usage.
- **Integration test harness**: The opt-in test configuration and helper layer used for tests that need real runtime providers or cross-module behavior.
- **Sandbox integration test**: An integration test that creates a real Vercel Sandbox and verifies sandbox-backed behavior through the application server modules.
- **Deterministic integration scenario**: A scenario that avoids LLM sampling, browser timing, and UI rendering so the test verifies one runtime contract with low flake risk.
- **Release-gate integration test**: A higher-cost integration test that should run before declaring a sandbox-backed Agent Demo ready for release, and when code changes touch its runtime contract.
- **Toolbox-level integration test**: A server-side integration test that assembles an app feature's toolset and calls those tools directly, without entering through the LLM chat route.
- **Vercel Sandbox OIDC auth**: The default authentication mode for sandbox-backed tests and Vercel-hosted production; local runs use `vercel env pull`, while Vercel production receives platform-managed OIDC credentials automatically.
- **E2E test**: A Codex/Computer Use-driven user-flow verification that operates the app through the browser or desktop surface.
- **Production demo smoke test**: A production-server route check that renders every top-level demo page after `next build` and fails when the AI Gateway setup state leaks into configured runtime HTML.

## Current Subdomain Docs

- Keep unit tests and integration tests separate. Normal quality gates should keep running fast tests by default; provider-backed tests should require explicit opt-in.
- Treat integration tests as complements to unit tests. If behavior can be fully verified with a unit or narrow module contract test, keep it there; integration tests should add evidence that unit tests cannot provide, such as real provider auth, sandbox lifecycle, file I/O, command execution, or cross-process behavior.
- Use Vitest for server-side integration tests unless the test must verify browser behavior. The current integration config is `apps/web/vitest.integration.config.ts`, and it includes only `features/**/*.integration.test.ts`.
- Integration tests should fail early with explicit setup errors. Do not silently skip a provider-backed test after the integration command has been explicitly requested.
- Require the explicit `VERCEL_SANDBOX_INTEGRATION=1` environment gate for real provider usage so local agents and CI do not create paid resources by accident.
- Authenticate Vercel Sandbox integration tests with `VERCEL_OIDC_TOKEN`; the integration readiness helper should reject token-only setup so this suite proves the OIDC path. Local runs should refresh the token with `vercel link` plus `vercel env pull`; Vercel-hosted production uses automatic OIDC. Use the `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID` access-token trio only for external CI/CD or non-Vercel hosting where `VERCEL_OIDC_TOKEN` is unavailable. See [Vercel Sandbox authentication](https://vercel.com/docs/vercel-sandbox/concepts/authentication) and [Vercel OIDC federation](https://vercel.com/docs/oidc).
- Keep Vercel Sandbox test sessions distinct from production demo sessions. Production `skills-agent` chat sandboxes stay persistent and chat-id named; test sandboxes should use unique names and `persistent: false`.
- Right-size sandbox test resources. Start Vercel Sandbox integration tests with `resources: { vcpus: 1 }`, no exposed ports unless the scenario needs one, and the shortest timeout that still allows bootstrap and cleanup.
- Always stop sandbox sessions in `finally`. If the SDK exposes deletion for the created resource, cleanup helpers may delete non-persistent test sandboxes after stopping them.
- Treat sandbox creation, active CPU, provisioned memory, network transfer, and snapshot storage as the cost drivers. Package downloads during cold bootstrap can dominate the cost of small tests, so avoid unnecessary dependency installs.
- Retry likely network-dependent sandbox bootstrap failures once, then surface the error. This follows the repository's general network retry convention without hiding broken contracts.
- Do not put LLM calls in the first sandbox integration layer. LLM-backed route tests are a separate, higher-cost layer because model output, gateway availability, and streaming timing add flake risk.
- Treat Codex App browser-harness failures separately from application failures. The in-app Browser can have Codex App-scoped localhost access, so prefer dev servers started from inside Codex App when using it. If it cannot reach the server, the webview cannot attach, or input automation fails because the virtual clipboard is unavailable, retry with normal Chrome, Computer Use, CDP, or browser-independent HTTP/API evidence before recording an app QA defect.
- Keep production demo smoke checks provider-safe. `pnpm smoke:demos:production` starts `next start` against the existing `.next` build with a synthetic AI Gateway key when no key is already present, renders pages only, and does not submit chat requests or call model providers.

## Recommended Layers

- **Default tests**: Run during ordinary development and normal quality checks. These are unit or narrow module tests with no external provider usage.
- **Sandbox smoke integration**: Creates a Vercel Sandbox, runs a trivial command, verifies file write/read, and stops the sandbox. This validates provider credentials, SDK wiring, lifecycle, and cleanup at the lowest cost.
- **Toolbox-level integration**: Assembles a feature's server-side toolset and calls the tools directly. Use this when the route, approval gate, or model orchestration is already covered by unit tests, and the missing evidence is whether the real provider-backed tools can execute.
- **Ultra Agent sandbox bash readiness**: Assembles `createUltraChatbotAgentSandboxToolbox`, calls the exposed `bash` tool directly, and runs `uv run python -c ...` to prove Ultra's real sandbox bash path can execute uv-backed Python without entering the LLM route.
- **Skills Agent deterministic integration**: Creates a Vercel Sandbox, activates `skill-creator`, runs its script through `uv`, reads the generated skill artifact, validates it, and cleans up. The first implementation lives at `apps/web/features/skills-agent/server/skill-builder.integration.test.ts`.
- **Codex/Computer Use E2E**: Runs only when specifically needed to verify user-facing streaming, UI behavior, desktop/browser interaction, or model-tool coordination. This layer should not be the first release gate for sandbox runtime correctness.
- **Production demo page smoke**: Runs after `pnpm build` to verify every top-level `/demos/*` page returns HTTP 200, no configured AI Gateway page renders `AI_GATEWAY_API_KEY is missing`, and `/demos/foundation-chat` remains a no-store dynamic production response. Use this after Turbo env, demo page rendering, or AI Gateway setup-state changes.

## Skills Agent First Scenario

- The first `skills-agent` sandbox integration scenario should verify the Skill Builder path without using an LLM.
- Use the repository-local `.agents/skills/skill-creator` as the skill source.
- Create a sandbox-backed session through the same server session modules used by the demo, then load `skill-creator` into `/vercel/sandbox/project/.agents/skills/skill-creator`.
- Run `.agents/skills/skill-creator/scripts/init_skill.py` inside the sandbox with `uv run python`.
- Read the generated `artifacts/<skill-name>/SKILL.md` from the sandbox and assert that the expected skill name and frontmatter exist.
- Run `.agents/skills/skill-creator/scripts/quick_validate.py` with `uv run --with pyyaml python` so the validation dependency is explicit.
- Keep the scenario deterministic: no chat route, no model call, no browser automation, and no dev-server port exposure for the first version.

## Ultra Agent Sandbox Bash Scenario

- The first Ultra Chatbot Agent sandbox integration scenario should verify the toolbox-level `bash` tool, not the LLM route or HITL approval flow.
- Use `createUltraChatbotAgentSandboxToolbox` as the public server interface for this layer.
- Inject a test-scoped sandbox session registry so the integration does not use the production shared registry singleton.
- Create a real Vercel Sandbox through the same `skills-agent` sandbox bootstrap that Ultra reuses, then call `toolbox.tools.bash.execute(...)`.
- Run `uv run python -c 'print(...)'` inside the sandbox and assert stdout includes a readiness marker, `python=3.13`, and `venv=.venv`.
- Keep this scenario deterministic: no chat route, no model call, no browser automation, no HITL approval, and no dev-server port exposure.

## Current Commands

- Run the provider-backed integration suite from the repo root with `pnpm test:integration:sandbox`.
- Run it from `apps/web` with `pnpm test:integration:sandbox`.
- The explicit sandbox command sources root and app `.env`, `.env.local`, and `.env.development.local` files, then sets `VERCEL_SANDBOX_INTEGRATION=1` before running Vitest.
- The lower-level form still works from either location with `VERCEL_SANDBOX_INTEGRATION=1 pnpm test:integration`.
- Running the integration command without `VERCEL_SANDBOX_INTEGRATION=1` is expected to fail fast before creating any sandbox.
- Run the local production demo smoke after a build with `pnpm smoke:demos:production`; the command starts and stops `next start` itself.
- Run the same smoke against a deployed URL with `DEMO_SMOKE_BASE_URL=https://<deployment-host> pnpm smoke:demos:production`.

## Run Policy

- Do not run real Vercel Sandbox integration tests on every code edit by default.
- Run the sandbox smoke integration after introducing or changing the integration harness, Vercel Sandbox credentials, sandbox factory options, or cleanup logic.
- Run the production demo smoke after changing Turbo env config, AI Gateway env contracts, `apps/web/app/demos/*/page.tsx` rendering mode, or production deployment settings that affect demo page runtime env.
- Run the Skills Agent deterministic integration when changing `apps/web/features/shared/vercel-sandbox`, `apps/web/features/skills-agent/server`, `.agents/skills/skill-creator`, or the Skill Builder artifact contract.
- Run the Ultra Agent sandbox bash readiness scenario when changing `apps/web/features/ultra-chatbot-agent/server/sandbox-tools.ts`, the shared Vercel Sandbox session layer, or the skills-agent sandbox bootstrap that Ultra reuses.
- Run the sandbox-backed integration suite before marking the `skills-agent` or Ultra Chatbot Agent sandbox demos release-ready, and before merging changes that materially alter sandbox lifecycle, toolchain bootstrap, skill activation, generated artifact handling, or Ultra sandbox tool exposure.
- If the sandbox suite becomes stable and cheap enough, add a scheduled or pre-release CI job first. Do not add it to every default PR run until observed runtime, cost, and flake rate justify that.

## Update Triggers

- Update this file when integration test scripts are added, renamed, or moved.
- Update this file when the repository changes its default test runner or integration config layout.
- Update this file when Vercel Sandbox pricing, limits, default resources, or cleanup capabilities materially change.
- Update this file when the `skills-agent` sandbox runtime, `uv` bootstrap, skill activation, or Skill Builder artifact contract changes.
- Update this file when LLM-backed or browser-backed integration tests become part of the release gate.
