# Feedback Agent

Point at a page element, annotate a screenshot, and send feedback to a private inbox. Analyze a saved report with AI to draft an issue, copy it to your tracker, and update its status.

## Upstream

The React capture UI composes the host's `@workspace/ui` shadcn primitives: Button, Card, Badge, Dialog, Label, Textarea, and Switch. It inherits the consumer's theme, font, and component defaults. No Shadow DOM, injected upstream stylesheet, or MakeThisBetter singleton is mounted.

The headless capture code is adapted from the MIT [Make This Better widget](https://github.com/makethisbetter/makethisbetter-js), commit `807ead5e85fc81e4c12043ba10cdea05ea6af0f1` (1.30.1). You can [use their product directly](https://makethisbetter.dev/) or copy this React slice with your own backend. Their hosted backend is not part of the upstream repository. This slice is independent of Make This Better: Send feedback targets only this application's same-origin API and configured Redis. AI analysis uses the application's configured AI Gateway. No feedback is sent to Make This Better; the upstream links are code attribution and an optional alternative for users.

`upstream/` retains the original MIT [LICENSE](./upstream/LICENSE), sanitizer, privacy helpers, context helpers, screenshot geometry, rendering, and annotation types. Local changes adapt imports and strict TypeScript, escape CSS selectors, exclude React capture UI, use the host's background/primary colors, and split privacy traversal for readability. The unused resource proxy hook was removed; stock `html-to-image@1.11.13` is the capture dependency. Keep this provenance when copying.

## Capture flow

`ui/use-feedback-capture.ts` owns the flow; `ui/feedback-capture.tsx` renders it. The launcher stays at the original right edge, vertically centered, and opens element selection, including Tab/Enter and Escape. Selection captures the current viewport and opens a shadcn Dialog with a masked screenshot preview, description, optional screenshot switch, draw/undo controls, and reselect. Markup is baked into the saved image. Successful submission opens the saved report immediately.

`client/capture.ts` adapts headless upstream code. `client/submit.ts` implements the existing submission-only protocol, attaching the image during session creation and then finalizing. An unchanged retry reuses the same identity to prevent duplicate reports. Capture failures remain visible; the reporter can retake or explicitly send text only.

This UI does not record interaction replay, intercept console logs, or mount the upstream clarification chat. The backend still accepts the original SDK's separate screenshot upload and optional replay evidence for consumers who use that SDK. Existing reports remain readable.

## Run

Requires the repository's Node runtime and dependencies, a reachable `REDIS_URL`, and optionally `AI_GATEWAY_API_KEY` for analysis. `AI_GATEWAY_BASE_URL` and `AI_GATEWAY_CHAT_MODEL` can override the default gateway and model. The model must accept images.

```sh
pnpm install
pnpm --dir apps/web dev
```

Open `/demos/feedback-agent`. Click Feedback, choose a sample-page element, review or annotate its screenshot, describe the change, and send. The submitted report opens immediately; other reports refresh within eight seconds or via Refresh. Select a report to inspect its screenshot and context, analyze it, copy the issue, or change its status. Copying an issue does not create a ticket in an external service.

## Copy into your application

1. Copy `features/feedback-agent`, the demo page/loading entries, and `app/api/demos/feedback-agent/[[...path]]/route.ts`.
2. Install `html-to-image@1.11.13`, `ai`, `zod`, `sharp`, `ioredis`, and `@t3-oss/env-nextjs`. Adapt `@workspace/ui` imports to your shadcn/AI Elements components and replace the site-owned `DemoWorkspaceShell` in the page.
3. Mount `FeedbackCapture` with `useFeedbackCapture` from your app layout to collect feedback on other pages. Keep the API on the same origin and establish the owner cookie before enabling capture. The inbox can remain a separate page. Change `ui/` composition or the shared shadcn preset to adjust appearance; no upstream CSS overrides are required. Mark capture controls with `data-feedback-ui` so they are excluded from screenshots.
4. Replace `server/owner.ts` with your ownership adapter, or copy its `features/shared/visitor-owner` dependency for a browser-private sandbox. For a team inbox, authenticate the reviewer and authorize project membership separately from the public submission route. A public project key is not an authorization secret.
5. The route's `createMeteredDemoRoute` wrapper belongs to this host site's usage gate. Remove that import/wrapper when copying, and export `POST = route`, or substitute your application's AI usage controls. Capture and storage do not consume AI credits here; the Analyze operation does.
6. Adapt the board URL in `server/runtime.ts` and the API/page paths if you rename routes. The upstream success link sends `?identity=<report-id>` to this page. Here that value only selects a report; access still requires the owner cookie. It is never a login token.

There is no one-command shadcn registry package for this slice yet. The feature is explicitly listed in `registry/registry-demos.json` as a copy-source demo.

## Storage and capture boundaries

- This demo isolates feedback by browser cookie. Other visitors cannot read it, and clearing cookies loses access. It is not a shared team inbox.
- Redis retains drafts for 24 hours and finalized reports for seven days. Each browser can create 20 sessions per 24-hour window. This demo limit is not authenticated abuse prevention: a production public collector needs your existing edge/project rate limits.
- Finalization and edits use atomic Redis compare-and-swap; retries do not duplicate feedback. A submitted session cannot subsequently be abandoned.
- Each request is capped at 3 MB. Screenshots require the widget's `sensitive-data-v1` capture policy, are decoded with a pixel limit, resized to at most 1600 pixels, and stored as PNG data URLs capped at 1.5 MB. Interaction JSON is capped at 1 MB.
- The upstream sensitive-data filter removes known sensitive keys and URL query strings. The inbox and detail views use `rr-block`. Screenshot inclusion remains the reporter's choice; masking is not a guarantee that all page content is safe to share.
- The original SDK uploads screenshots in a separate `PUT .../:id/screenshot` request after creating the session. Keep that endpoint when porting. Finalization publishes the report only after the SDK finishes that upload.
- Previously saved optional recording data can be downloaded as JSON. The native React collector does not create recordings. This slice has no replay player or remote image proxy. Cross-origin resources that cannot be captured may be absent from screenshots.

## Files and checks

- `ui/`: React capture controls/state, screenshot annotation editor, inbox, evidence detail, and sample page.
- `client/`: capture and submission adapters, independent of React presentation.
- `server/submission.ts`: bounded parsing, image validation, and sanitization.
- `server/store.ts`: Redis persistence and atomic transitions.
- `server/runtime.ts`: SDK protocol adapter, inbox operations, and AI triage.
- `server/owner.ts`: host ownership adapter; `server/env.ts`: server configuration.

```sh
pnpm --dir apps/web exec vitest run features/feedback-agent/server/submission.test.ts
REDIS_URL=redis://127.0.0.1:6379 pnpm --dir apps/web exec vitest run --config vitest.integration.config.ts features/feedback-agent/server/runtime.integration.test.ts
pnpm check
pnpm typecheck
```

The integration tests require an isolated Redis instance. They create randomly scoped, expiring test records.
