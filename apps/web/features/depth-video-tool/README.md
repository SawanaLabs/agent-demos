# Depth video tool

The depth video tool turns a clip into a stabilized grayscale depth reference
inside the browser. It is a site tool that future image and video agents can
reuse. It does not belong to the Agent Demo catalog.

## Feature slice

```text
depth-video-tool/
├── model/depth-video-contract.ts
├── runtime/depth-video-processor.ts
├── ui/depth-video-tool.tsx
└── ui/depth-video-workspace.tsx
```

The input limit is 15 seconds, with 5 seconds presented as the recommended
working length. Depth Anything V2 Small runs through Transformers.js. The
source clip and generated video remain in the browser.
