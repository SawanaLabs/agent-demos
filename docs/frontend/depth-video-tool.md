---
title: Depth Video Tool
description: Product and runtime boundary for the browser-local depth video processor.
updateAt: 2026-09-20
---

# Depth video tool

## Scope

- Covers the `/tools/depth-video` route and
  `apps/web/features/depth-video-tool/` feature slice.
- Covers the reusable browser runtime that converts video frames into grayscale
  depth references for future image and video agents.

## Domain language

- **Depth video tool**: A site-level media utility that converts a short source
  clip into a temporally stabilized grayscale depth video.
  _Avoid_: Agent Demo, video Agent
- **Depth reference**: A grayscale control video where near pixels are light and
  distant pixels are dark, preserving motion, blocking, and camera movement.

## Current subdomain docs

- Keep the tool at `/tools/depth-video`. Do not add it to the Agent Demo catalog
  or wrap it in the Demo Workspace Shell.
- Keep the product limit at 15 seconds and present 5 seconds as the recommended
  working length.
- Run depth inference and encoding in the browser. Do not upload the source clip
  to the application server.
- Use Depth Anything V2 Small through Transformers.js. Prefer WebGPU when the
  browser exposes it and label the slower WASM path as CPU processing.
- Keep the model, frame sampling, stabilization, and export logic in
  `runtime/depth-video-processor.ts` so future image and video agents can reuse
  the processor without importing the standalone page UI.
- Keep input validation and media-format decisions in
  `model/depth-video-contract.ts`.
- Expose the tool on the homepage in a separate builder-tool callout. Do not
  represent it as a `Demo Catalog Entry`.

## Update triggers

- Update this file when the duration limit, depth model, export target, or
  browser-local privacy boundary changes.
- Update this file when an Agent Demo begins importing the depth video runtime.
