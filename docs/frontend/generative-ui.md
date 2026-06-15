---
title: Generative UI
description: Stable conventions for the Generative UI Agent Demo.
updateAt: 2026-06-15
---

# Generative UI

## Scope

- Covers `apps/web/features/generative-ui`.
- Covers the AI SDK UI Generative User Interfaces source core.
- Covers the OpenAI hosted `web_search` boundary used as an auxiliary data source.

## Product Boundary

- The demo is a **Generative UI Agent Demo** under the `generative-ui` **Agent Pattern**.
- The primary visible outputs are model-selected UI components inside the assistant message stream.
- The preferred interaction is **Streaming Generative UI**: ordinary turns can remain normal streaming chat, while UI-tool turns should let the selected component incrementally materialize inside the same assistant message.
- OpenAI hosted `web_search` is available when current public information materially improves the answer.
- Search output is supporting evidence for the selected UI component, not the product identity of the demo.
- The first component set is intentionally small:
  - `showFeatureComparison` renders a comparison matrix.
  - `showPlanRecommendation` renders a recommendation card.

## Source Core

- Preserve the AI SDK UI generative interface path:
  - `streamText`
  - `tool({ inputSchema })`
  - `convertToModelMessages`
  - `toUIMessageStreamResponse`
  - frontend projection from `UIMessage.parts`
  - `input-streaming` tool parts with partial component props
  - `tool-showFeatureComparison` / `tool-showPlanRecommendation` custom rendering
- Keep OpenAI hosted `web_search` behind the same Gateway-compatible provider path used by `trace-eval-agent`.
- Keep the two UI tool schemas domain-neutral but strongly structured so the slice can answer broad comparison and recommendation prompts.
- Treat tool input as the component-props stream for UI tools. Tool output should finalize or validate the selected UI component instead of being the first moment the component becomes visible.

## UX Contract

- The workspace may show short assistant prose, but the comparison matrix or recommendation card should carry the main answer when a UI tool is selected.
- UI tool components should render meaningful partial content while `part.state` is `input-streaming` when the provider emits tool-call deltas. If deltas are unavailable, the UI may degrade to appearing when complete.
- Partial UI should fill the final component structure naturally instead of introducing a separate ordering layer. Render stable sections as soon as their required fields are present, and let later fields complete the same component.
- Both first-slice UI tools, `showFeatureComparison` and `showPlanRecommendation`, should support partial rendering so the pattern applies to more than one component shape.
- During partial rendering, missing fields mean the model has not produced that content yet. Show lightweight skeleton affordances for missing content, and reserve contract errors for final `output-available` validation failures.
- When tool input is complete but final output has not arrived, keep rendering the generated input version with a lightweight validating state instead of returning to a loading placeholder.
- Once final output is available, render the component as clean production UI without preserving generation-process traces.
- Search citations should render from message-level source data through AI Elements `Sources`/`Source`, outside the comparison matrix and recommendation card contracts. The projection accepts AI SDK `source-url` parts and OpenAI hosted `web_search` `output.sources` URL entries.
- Do not add teaching copy inside the workspace to explain `UIMessage.parts`; keep mechanism explanation in README/docs.
- Starter prompts should cover:
  - search-backed comparison
  - search-backed recommendation
  - durable-knowledge comparison
  - durable-knowledge recommendation
- Browser verification should include desktop and mobile widths because comparison matrices can overflow when cells are not constrained.

## Registry

- `generative-ui` is expected to ship as a public registry demo.
- Registry source must include the demo-owned UI components, server runtime, UI contract, thin route entries, shared demo shell, shared chat controller, and AI Gateway contract.
- The registry item should keep `AI_GATEWAY_API_KEY` as the only required credential. `GENERATIVE_UI_CHAT_MODEL` is an optional feature-specific override.
