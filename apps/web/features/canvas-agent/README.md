# Canvas Agent

An independent Agent Demo at `/demos/canvas-agent`. Natural-language requests edit
an executable graph on an infinite canvas. Text, reference images, and generated
images can branch and merge. The floating conversation keeps running when folded;
its composer remains available.

The toolbar exposes **生成图片**, **生成文本**, **图片输入**, **提示词**,
and **输出**. Text materials pass literal prompts without model calls. Multiple
materials can feed one generator. Image and generated text results appear as separate draggable
cards with outgoing connections; rerunning replaces that result. A manual output
node (预览输出) displays all connected text and images without invoking a model.
Both result cards and preview outputs offer image downloads and UTF-8 TXT downloads. It is a
terminal display; continue workflows from the original material or result card.

Use **新建** to start with an empty canvas and conversation. The Agent defaults to **允许 AI 生成** and executes only requested generation. Switch to **仅编排** to create and revise the workflow without generation. Use
**运行工作流** to recompute all nodes, or the node button to run a target while
reusing valid upstream results. Its label is **运行此节点** when upstream results
and materials are ready (including nodes without inputs), or **运行到这里** when
upstream content is missing. **允许 AI 生成** enables the execution tool for
explicit generation requests. **用于下一步** adds a connected image node while
preserving the existing result. Uploaded and generated content can be saved and
opened as a workflow JSON file. Refreshing without saving loses the workspace.

```text
canvas-agent/
├── demo-meta.ts
├── model/graph.ts          # graph schema, DAG validation, invalidation
├── server/env.ts           # existing AI Gateway configuration
├── server/runner.ts        # dependency execution and multimodal inputs
├── server/handler.ts       # agent tool set and streamed progress
└── ui/                    # canvas, nodes, floating chat, run-stream consumer
```

Uses the existing `AI_GATEWAY_API_KEY`, optional `AI_GATEWAY_BASE_URL`,
`AI_GATEWAY_CHAT_MODEL`, and `AI_GATEWAY_IMAGE_MODEL` configuration. The image
model defaults to `openai/gpt-image-2` with `quality: "low"` through
`generateImage`; reference images are passed as image inputs. Overrides must
support the image-generation API. The shared default for other demos is unchanged.
Both API routes are
wrapped by the host usage gate. One agent turn can run at most one graph with
at most 20 nodes. No workflow, upload, or result is stored on the server.

This canvas currently executes text and image generation. Video generation,
GIF assembly, and depth extraction are not graph node types. The existing
`/tools/depth-video` tool remains available independently.

Reference research: the supplied 78-second Bilibili video
`BV1Uuen64E2J` was inspected from the user's local MP4 at six-second intervals.
It demonstrates source-video branching into a first frame and depth reference,
then merging visual references into a video generation node. The second supplied
example demonstrates reusing generated results for subsequent image edits and
GIF assembly. This implementation provides the branching and reuse interaction;
it does not claim those video or GIF operations are connected.
