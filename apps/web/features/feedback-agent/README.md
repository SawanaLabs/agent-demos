# Feedback Agent

Point at a page element, annotate a screenshot, and send feedback to a private inbox. Analyze a saved report with AI to draft an issue, copy it to your tracker, and update its status.

## Upstream

The capture UI is the original [Make This Better widget](https://github.com/makethisbetter/makethisbetter-js), installed as `makethisbetter@1.30.1`. It runs in a Shadow DOM and provides element selection, pin/draw annotations, screenshots, and optional interaction capture. You can [use their product directly](https://makethisbetter.dev/) or use this slice with your own backend.

Research reference: upstream commit `807ead5e85fc81e4c12043ba10cdea05ea6af0f1`. The upstream repository publishes its MIT-licensed widget and self-hosting protocol; its hosted backend is not part of that repository. We implement the protocol's submission-only profile and run AI triage after saving feedback. We do not implement the hosted product's clarification chat, feedback board identity, email notifications, or integrations.

`upstream/sanitize.ts` is copied from that revision's `src/privacy/sanitize.ts` (formatting adjusted). Its MIT notice is retained in [upstream/LICENSE](./upstream/LICENSE). The widget itself remains an npm dependency, with its own attribution visible in the UI.

## Run

Requires the repository's Node runtime and dependencies, a reachable `REDIS_URL`, and optionally `AI_GATEWAY_API_KEY` for analysis. `AI_GATEWAY_BASE_URL` and `AI_GATEWAY_CHAT_MODEL` can override the default gateway and model. The model must accept images.

```sh
pnpm install
pnpm --dir apps/web dev
```

Open `/demos/feedback-agent`. Click Feedback, choose a sample-page element, describe the change, and send. Reports appear automatically within eight seconds or via Refresh. Select a report to inspect its screenshot and context, analyze it, copy the issue, or change its status. Copying an issue does not create a ticket in an external service.

## Copy into your application

1. Copy `features/feedback-agent`, the demo page/loading entries, and `app/api/demos/feedback-agent/[[...path]]/route.ts`.
2. Install `makethisbetter@1.30.1`, `ai`, `zod`, `sharp`, `ioredis`, and `@t3-oss/env-nextjs`. Adapt `@workspace/ui` imports to your shadcn/AI Elements components and replace the site-owned `DemoWorkspaceShell` in the page.
3. The widget initialization is in `ui/workspace.tsx`. Move that mount/destroy effect to your app layout to collect feedback on other pages. Keep `apiUrl` on the same origin and establish the owner cookie before allowing captures. The inbox can remain a separate page.
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
- The SDK uploads screenshots in a separate `PUT .../:id/screenshot` request after creating the session. Keep that endpoint when porting. Finalization publishes the report only after the SDK finishes that upload.
- Optional recording data can be downloaded as JSON. This slice has no replay player or remote image proxy. Cross-origin resources that cannot be captured may be absent from screenshots.

## Files and checks

- `ui/`: widget lifecycle, inbox, evidence detail, and sample page.
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
