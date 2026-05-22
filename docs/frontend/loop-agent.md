---
title: Loop Agent
description: Stable UI and reasoning-display conventions for the loop-agent support triage demo.
updateAt: 2026-05-23
---

# Loop Agent

## Scope

- Covers the `loop-agent` demo under `apps/web/features/loop-agent`.
- Covers the message rendering order, reasoning display, and loading-state treatment in `ui/loop-agent-workspace.tsx`.
- Covers demo-local backend expectations that exist only to support the visible reasoning flow.

## Domain Language

- **User-facing trace**: The visible reasoning and execution-chain layer shown above the assistant response body.
- **Developer trace**: The raw tool cards shown after the assistant response body for inspection and debugging.

## Current Subdomain Docs

- Keep `apps/web/features/loop-agent/README.md` as the feature-local overview and file map. Put durable UI conventions here in `docs/`, not only in the README.
- The assistant message order is: `Reasoning`, then `ChainOfThought`, then response body text, then raw `Tool` cards.
- Use AI Elements `Reasoning` with its native appearance. Do not add demo-local borders, background fills, or custom container styling around the reasoning block.
- Keep `ChainOfThought` separate from `Reasoning`. The chain explains discrete execution stages; the reasoning block reflects model reasoning output.
- When the assistant has no text part yet, show the body placeholder with AI Elements `Shimmer` using `Thinking...`. Do not use demo-local fallback copy such as `Waiting for visible output.`
- Treat the tool cards as a secondary developer surface. They stay below the response body even when the chain is visible above it.
- `apps/web/features/loop-agent/server/chat.ts` must request reasoning parts with `sendReasoning: true` and must pass explicit OpenAI reasoning provider options so GPT-5-family reasoning summaries are actually returned.
- `apps/web/features/loop-agent/server/model.ts` resolves the loop-agent default chat model. The current default is `openai/gpt-5-mini` because this demo expects reasoning-capable output.

## Update Triggers

- Update this file when the loop-agent message order changes.
- Update this file when the demo switches reasoning model, reasoning transport, or loading-state component.
- Update this file when reasoning, chain, and tool-card responsibilities are redistributed across the UI.
