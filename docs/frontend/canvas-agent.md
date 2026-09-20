---
title: Canvas Agent
description: Independent canvas workflow runtime and floating conversation contract.
updateAt: 2026-09-20
---

# Canvas Agent

- Route: `/demos/canvas-agent`; feature boundary: `apps/web/features/canvas-agent`.
- Reuse generic AI Elements Canvas/Node primitives. Keep workflow semantics feature-local; the older Image Workflow Agent retains its single-generator contract.
- `model/graph.ts` owns schema validation, acyclic dependency ordering, atomic definition changes, and descendant output invalidation. Position and label changes preserve generated results.
- Canvas image generation defaults to `openai/gpt-image-2` with `providerOptions.openai.quality: "low"` via `generateImage`. `AI_GATEWAY_IMAGE_MODEL` can override the model. Reference inputs use `prompt.images`. Output sizes are 1024×1024, 1536×864, and 864×1536 for the three canvas ratios.
- Agent tools and manual edits share this graph model. Agent requests carry the latest graph; image payloads are omitted from the agent's system context. Generation nodes receive connected text and images as multimodal inputs.
- Plan mode does not expose an execution tool. Execute mode permits one run per turn, and only on a generation request. Tool operations are serialized. Graphs have at most 20 nodes and 60 edges.
- Running the whole workflow recomputes all outputs. Running a target reuses valid upstream outputs and invalidates that target and its descendants. A failed run retains completed nodes and stops dependent execution.
- Manual execution streams NDJSON snapshots; agent execution streams transient `data-canvas` events through AI SDK. Closing the conversation view never unmounts its controller.
- All model-backed routes use host metering. Provider failure details stay server-side. Inputs and results live in browser state; manual JSON export/import persists a workflow. No automatic reload recovery or server persistence is claimed.
- Hide the host companion on this full-screen route to avoid overlapping the workflow composer. Keep the host theme toggle accessible beside the header.
- The catalog lists this Agent Demo as ready and explicitly omits registry export until its portable export is prepared.
- Video generation, GIF assembly, and depth extraction are not supported graph operations. `/tools/depth-video` is a separate browser tool.

- Node execution and input failures are stored by node ID in `graph.errors` and streamed with graph snapshots. Render them inside the feature node using the shared shadcn Alert; graph-level or transport failures remain in the conversation. Retrying clears errors for the run path; editing inputs clears affected node and descendant errors. Older exports default to an empty error map.

- Toolbar exposes image/text generators, image/text materials, and a terminal output display. `prompt` materials pass literal text unchanged; `reference` materials pass uploaded images. Neither calls a model. Generators may receive their prompt entirely from upstream text. `output` accepts multiple inputs and displays materials immediately and generated outputs as available; it has no outgoing edges and makes no model calls.
- Image and generated text outputs appear as separate draggable result cards via `model/presentation.ts`. Both result cards and terminal preview nodes display text/images and provide image downloads and UTF-8 TXT downloads. The toolbar calls the terminal display `预览输出`; its persisted kind remains `output`. These cards project the generator output, retaining the generator ID as the executable dependency; they do not duplicate assets or add executable nodes. View IDs are namespaced. Optional `node.resultPosition` persists result placement. Rerunning updates the same card; input edits invalidate stale results. Cards can connect to downstream generators or displays.
- Feature-local node styles override Card overflow and enlarge XYFlow handles so manual connections remain accessible.

- `整理画布` sits with zoom and fit-view controls at the top left. Dagre lays out the visible graph left-to-right using measured node sizes, including generated result cards and disconnected nodes. It changes only node/result positions, preserves content and connections, and fits the viewport after arranging. It is disabled during generation.
