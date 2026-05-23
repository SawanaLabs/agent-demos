---
title: Skills Agent
description: Stable source-core, sandbox lifecycle, and UI conventions for the shipped skills-agent demo.
updateAt: 2026-05-23
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
- **Chat session id**: The AI SDK chat `id`, used as the single source of truth for one sandbox-backed conversation session.
- **Configured tools**: The official user-facing tool surface exposed to the agent and shown in the runtime panel: `skill`, `bash`, `readFile`, and `writeFile`.

## Current Subdomain Docs

- Treat `https://ai-sdk.dev/cookbook/guides/agent-skills` as the canonical public source route for this demo's source core. Re-verify the stable public route before implementation starts.
- Preserve the guide's core behavior: discover skills, expose the discovered skill catalog to the agent, load full skill instructions on demand, and run the agent with a sandbox-backed capability layer.
- Prefer the official `bash-tool` + `experimental_createSkillTool` combination over repo-local tool wrappers when implementing the sandbox capability layer.
- Use the current stable `ToolLoopAgent` interface for implementation. In this repository's current `ai` version, the stable methods are `generate()` and `stream()`. Do not build the web demo around an assumed `run()` method.
- Use `@vercel/sandbox` as the sandbox runtime for this demo. Do not introduce a separate local execution model for the first implementation.
- Use the AI SDK chat `id` as the sandbox session key. Do not mint a second application-level session id for the same conversation.
- Use the AI SDK chat `id` as the Vercel Sandbox `name`. Reconnect or recreate sandbox sessions through that single identifier.
- Keep one sandbox singleton per chat session. Do not create a new sandbox on every request or every retry.
- Keep sandbox persistence enabled. Do not force `persistent: false` for this demo's named sandboxes.
- Let any sandbox-backed tool lazily create or resume the sandbox. Do not gate sandbox access on prior skill activation.
- Reconnect to an existing named sandbox with `Sandbox.get({ name: chatId })` before creating a fresh one for that same chat id.
- Let Vercel Sandbox own timeout-based session shutdown. Do not add an application-level idle timer that calls `sandbox.stop()` in the background.
- Use the official `experimental_createSkillTool` for the user-facing `skill` tool. In the current package version, that tool reads `SKILL.md` from the local workspace, while the session lifecycle mirrors `AGENTS.md` and the selected skill directory into the per-chat sandbox before sandbox-backed file or command tools run.
- Treat official skill activation as skill-context loading, not as the only sandbox lifecycle boundary. Keep the session-lifecycle layer thin and private; the user-facing tool surface should come from `experimental_createSkillTool` and `createBashTool`, not repo-local `loadSkill`, `pathExists`, `readFile`, or `writeFile` wrappers.
- Programmatically inject visible skill metadata into the agent call options from the repo-local `.agents/skills` catalog. Include `name`, `description`, and `path`; do not hand-maintain a parallel skill list in the system prompt.
- Keep skill routing description-driven. Do not hardcode per-skill trigger rules like `rough ideas -> grill-with-docs` in the system prompt when the skill descriptions already cover that choice.
- Seed a new sandbox with the thinnest setup environment that still supports repo-local skills: `AGENTS.md`, the discovered skill files uploaded by `createSkillTool`, and any explicit demo artifact roots required by `bash-tool`. Let the agent create `CONTEXT.md`, `docs/adr/`, and other follow-on files inside the sandbox when the skill requires them.
- Retry sandbox creation once when the provider bootstrap fails, then surface the error. Do not cache a failed sandbox-creation promise for the rest of the chat session.
- Keep the sandbox integration explicit in runtime state and setup messaging. Missing Vercel Sandbox credentials or project binding must surface as setup errors in the demo workspace.
- The current demo does not persist the AI SDK chat `id` across full page refreshes. Persistence guarantees apply to a stable page/chat lifecycle for now; cross-refresh thread restoration is future work.
- Use the repository-local `.agents/skills` directory as the first skill source. The first implementation should focus on the existing engineering-workflow skills instead of inventing synthetic demo-only skills.
- The first implementation slice should position the demo as an idea-to-skill workspace: the agent challenges a rough idea, drafts durable project context, and can then generate a reusable skill scaffold from that aligned context.
- Start with two repo-local skills that preserve the guide's runtime-loading behavior without shrinking the capability model: `grill-with-docs` and `skill-creator`.
- Do not proactively narrow the guide's capability surface just to simplify the demo. Preserve filesystem access, load-on-demand skill activation, sandbox-backed command execution, and visible generated artifacts. Use the official tool descriptions and capability contracts before inventing repo-local variants.
- Treat generated `CONTEXT` and `SKILL.md` content as first-class demo artifacts. The demo workspace should make it obvious which skill is active, what file or draft is being produced, and what low-level sandbox actions happened underneath.
- Keep the user-facing message flow consistent with the shipped workspace order: `Reasoning`, `Activated skills`, `Draft artifacts`, tool-call cards, then the assistant body.
- In the right-side runtime panel, show both `Available skills` and `Configured tools` so the demo exposes skill inventory and actual tool surface separately.

## Update Triggers

- Update this file when the canonical AI SDK source route changes.
- Update this file when the sandbox provider changes away from `@vercel/sandbox`.
- Update this file when the initial skill source or the first exposed skill set changes.
- Update this file when the primary artifact shifts away from `CONTEXT` or `SKILL.md` generation.
- Update this file when the demo stops using `ToolLoopAgent` as its source-core implementation.
