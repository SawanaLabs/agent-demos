---
title: Skills Agent
description: Stable source-core, sandbox lifecycle, runtime toolchain, and UI conventions for the shipped skills-agent demo.
updateAt: 2026-06-01
---

# Skills Agent

## Scope

- Covers the shipped `skills-agent` demo under `apps/web/features/skills-agent`.
- Covers which official AI SDK guide defines the source core for this demo.
- Covers the execution-environment choice, skill source, and first implementation slice.

## Domain Language

- **Skill catalog**: The startup-time list of available skills containing only lightweight metadata such as skill name and description.
- **Activated skill**: A skill whose full `SKILL.md` content has been loaded during an agent run because the model decided it was relevant.
- **Sandbox runtime**: The isolated execution environment that provides filesystem and command capabilities to the skills-agent demo.
- **Sandbox project root**: `/vercel/sandbox/project`, the default bash working directory and the directory containing `AGENTS.md`.
- **Sandbox toolchain**: The merged user-facing environment in the sandbox project root: Node 24 from the Vercel `node24` image plus Python 3.13 managed through `uv`.
- **Chat session id**: The AI SDK chat `id`, used as the single source of truth for one sandbox-backed conversation session.
- **Configured tools**: The official user-facing tool surface exposed to the agent and shown in the runtime panel: `skill`, `bash`, `readFile`, and `writeFile`.

## Current Subdomain Docs

- Treat `https://ai-sdk.dev/cookbook/guides/agent-skills` as the canonical public source route for this demo's source core. Re-verify the stable public route before implementation starts.
- Preserve the guide's core behavior: discover skills, expose the discovered skill catalog to the agent, load full skill instructions on demand, and run the agent with a sandbox-backed capability layer.
- Prefer the official `bash-tool` + `experimental_createSkillTool` combination for the sandbox capability layer. Add repo-local wrapping only for capability gaps in the current package, such as runtime skill discovery inside the active sandbox.
- Use the current stable `ToolLoopAgent` interface for implementation. In this repository's current `ai` version, the stable methods are `generate()` and `stream()`. Do not build the web demo around an assumed `run()` method.
- Use `@vercel/sandbox` as the sandbox runtime for this demo. Do not introduce a separate local execution model for the first implementation.
- Keep Vercel Sandbox on the `node24` base runtime. Treat Python 3.13 as an additional bootstrap-managed toolchain, not as the base sandbox runtime, unless a future live benchmark proves the Python-first runtime is materially faster for this demo.
- Use the AI SDK chat `id` as the sandbox session key. Do not mint a second application-level session id for the same conversation.
- Use the AI SDK chat `id` as the Vercel Sandbox `name`. Reconnect or recreate sandbox sessions through that single identifier.
- Keep one sandbox singleton per chat session. Do not create a new sandbox on every request or every retry.
- Keep sandbox persistence enabled. Do not force `persistent: false` for this demo's named sandboxes.
- Let any sandbox-backed tool lazily create or resume the sandbox. Do not gate sandbox access on prior skill activation.
- Reconnect to an existing named sandbox with `Sandbox.get({ name: chatId })` before creating a fresh one for that same chat id.
- Let Vercel Sandbox own timeout-based session shutdown. Do not add an application-level idle timer that calls `sandbox.stop()` in the background.
- Use the official `experimental_createSkillTool` metadata, schema, and description as the base for the user-facing `skill` tool. The execution wrapper must refresh the active sandbox catalog from `/vercel/sandbox/project/.agents/skills` before each load so skills installed during the current chat can be activated.
- Treat skill activation as skill-context loading and active-directory selection for relative sandbox paths. Keep the session-lifecycle layer thin and private; the user-facing tool surface should still expose `skill`, `bash`, `readFile`, and `writeFile`.
- Programmatically inject visible skill metadata into the agent call options from the repo-local `.agents/skills` catalog. Include `name`, `description`, and `path`; do not hand-maintain a parallel skill list in the system prompt.
- Keep the `skills-agent` server seam deep. `chat.ts` should assemble the agent, while a dedicated workspace module should own `AGENTS.md` loading, visible catalog formatting, official tool construction, sandbox roots, and session acquisition.
- Keep skill routing description-driven. Do not hardcode per-skill trigger rules like `rough ideas -> grill-with-docs` in the system prompt when the skill descriptions already cover that choice.
- Seed a new sandbox project root with the thinnest setup environment that still supports repo-local skills, runtime-installed skills, and Python-backed skill workflows: `AGENTS.md`, `.agents/skills/`, `artifacts/`, `pyproject.toml`, `.python-version`, and `.venv/`. Copy repo-local skill directories into `.agents/skills/` on activation, and let newly installed skill directories remain discoverable from that same sandbox root.
- Install `uv` as a sandbox-level tool in `/usr/local/bin/uv`, then use `uv` to install Python 3.13 and initialize the sandbox root as a bare Python project. Do not hand-write Python environment files when the `uv` CLI can create them.
- Keep Python command usage uv-first. User and agent commands should use `uv add`, `uv run python`, `uv run pytest`, or `uv run --with ...`; do not inject `VIRTUAL_ENV`, `UV_CACHE_DIR`, or `.venv/bin` into runtime shell commands just to make bare `python`, `pip`, or `pytest` work.
- Treat `pyproject.toml`, `.python-version`, `.venv/`, and `uv.lock` as sandbox project state. Keep them readable and editable in the sandbox root, but do not surface them as generated artifacts in the artifacts panel.
- Keep tool traces focused on the original agent command. Hide internal bootstrap commands and any runtime toolchain setup details from the visible trace.
- Treat repo-local skill scripts as activation-scoped sandbox files. A direct `bash` command may see an empty `.agents/skills/` directory before a skill is activated; after the agent calls `skill` for `skill-creator`, scripts such as `.agents/skills/skill-creator/scripts/init_skill.py` must be available to `bash` and runnable through `uv run python`.
- Retry sandbox creation once when the provider bootstrap fails, then surface the error. Do not cache a failed sandbox-creation promise for the rest of the chat session.
- Keep the sandbox integration explicit in runtime state and setup messaging. Missing Vercel Sandbox credentials or project binding must surface as setup errors in the demo workspace.
- The current demo does not persist the AI SDK chat `id` across full page refreshes. Persistence guarantees apply to a stable page/chat lifecycle for now; cross-refresh thread restoration is future work.
- Use the repository-local `.agents/skills` directory as the first skill source. The first implementation should focus on the existing engineering-workflow skills instead of inventing synthetic demo-only skills.
- The first implementation slice should position the demo as an idea-to-skill workspace: the agent challenges a rough idea, drafts durable project context, and can then generate a reusable skill scaffold from that aligned context.
- Start with two repo-local skills that preserve the guide's runtime-loading behavior without shrinking the capability model: `grill-with-docs` and `skill-creator`.
- Do not proactively narrow the guide's capability surface just to simplify the demo. Preserve filesystem access, load-on-demand skill activation, sandbox-backed command execution, and visible generated artifacts. Use the official tool descriptions and capability contracts before inventing repo-local variants.
- Treat generated `CONTEXT` and `SKILL.md` content as first-class demo artifacts. The demo workspace should make it obvious which skill is active, what file or draft is being produced, and what low-level sandbox actions happened underneath.
- Keep the user-facing message flow consistent with the shipped workspace order: `Reasoning`, `Activated skills`, `Draft artifacts`, tool-call cards, then the assistant body.
- In the right-side runtime panel, show both `Available skills` and `Configured tools` so the demo exposes skill inventory and actual tool surface separately. Also show a compact environment label, currently `Node 24 + uv Python 3.13`, without exposing bootstrap internals.

## Manual E2E Smoke

- Open `/demos/skills-agent` and confirm the workspace is `Ready` with the runtime label `Node 24 + uv Python 3.13`.
- First chat turn: force a `bash` call that runs `pwd`, checks `AGENTS.md`, and prints a sentinel such as `SANDBOX_OK`. The expected project root is `/vercel/sandbox/project`.
- Second chat turn: force a `bash` call that runs `uv --version`, `uv run python --version`, writes a tiny Python file, and runs it with `uv run python`. The expected success marker is application-level output from that script, not just a tool-call completion badge.
- Skill-script smoke: ask the agent to call `skill` for `skill-creator`, then run `.agents/skills/skill-creator/scripts/init_skill.py` through `uv run python` and confirm it creates a skill directory under `artifacts/`.

## Update Triggers

- Update this file when the canonical AI SDK source route changes.
- Update this file when the sandbox provider changes away from `@vercel/sandbox`.
- Update this file when the sandbox runtime, toolchain bootstrap, or Python usage contract changes.
- Update this file when the initial skill source or the first exposed skill set changes.
- Update this file when the primary artifact shifts away from `CONTEXT` or `SKILL.md` generation.
- Update this file when the demo stops using `ToolLoopAgent` as its source-core implementation.
