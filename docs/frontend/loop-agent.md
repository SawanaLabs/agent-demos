---
title: Loop Agent
description: Stable UI, reasoning-display, and HITL conventions for the loop-agent support triage demo.
updateAt: 2026-05-24
---

# Loop Agent

## Scope

- Covers the `loop-agent` demo under `apps/web/features/loop-agent`.
- Covers the message rendering order, reasoning display, approval display, and loading-state treatment in `ui/loop-agent-workspace.tsx`.
- Covers demo-local backend expectations that exist only to support the visible reasoning flow.

## Domain Language

- **User-facing trace**: The visible reasoning and execution-chain layer shown above the assistant response body.
- **Developer trace**: The raw tool cards shown after the assistant response body for inspection and debugging.
- **Human approval checkpoint**: The AI SDK tool approval pause before the demo executes the high-priority support escalation.

## Current Subdomain Docs

- Keep `apps/web/features/loop-agent/README.md` as the feature-local overview and file map. Put durable UI conventions here in `docs/`, not only in the README.
- The assistant message order is: `Reasoning`, then `ChainOfThought`, then raw `Tool` cards, then response body text.
- If a tool part contains an approval request, render AI Elements `Confirmation` immediately before the matching raw `Tool` card.
- `requestHumanApproval` is the only current approval-gated tool. It uses the official AI SDK `needsApproval` field and must stay behind a reviewer decision.
- `useLoopAgentChat` wires `addToolApprovalResponse` together with `lastAssistantMessageIsCompleteWithApprovalResponses` so approval or rejection automatically continues the chat.
- Built-in suggestions should drive the inspectable loop. If a suggestion mentions parallel lookups, SLA, approval, or next action, phrase it as a triage request so the model calls tools and the UI shows chain plus raw tool output.
- Use AI Elements `Reasoning` with its native appearance. Do not add demo-local borders, background fills, or custom container styling around the reasoning block.
- Keep `ChainOfThought` separate from `Reasoning`. The chain explains discrete execution stages; the reasoning block reflects model reasoning output.
- When the assistant has no text part yet, show the body placeholder with AI Elements `Shimmer` using `Thinking...`. Do not use demo-local fallback copy such as `Waiting for visible output.`
- Treat the tool cards as a secondary developer surface. They stay below the chain and above the response body so QA can inspect execution before reading the summary.
- `apps/web/features/loop-agent/server/chat.ts` must request reasoning parts with `sendReasoning: true` and must pass explicit OpenAI reasoning provider options so GPT-5-family reasoning summaries are actually returned.
- `apps/web/features/loop-agent/server/model.ts` resolves the loop-agent default chat model. The current default is `openai/gpt-5-mini` because this demo expects reasoning-capable output.

## Update Triggers

- Update this file when the loop-agent message order changes.
- Update this file when the demo switches reasoning model, reasoning transport, or loading-state component.
- Update this file when reasoning, chain, and tool-card responsibilities are redistributed across the UI.
- Update this file when the approval-gated tool, approval component, or auto-submit approval behavior changes.
