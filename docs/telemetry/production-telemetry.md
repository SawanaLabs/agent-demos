---
title: Production Telemetry
description: GA4 product analytics and Vercel Runtime Logs contracts for the published Agent Demos site.
updateAt: 2026-08-22
---

# Production Telemetry

## Two Independent Planes

| Plane | Purpose | Transport | Repository-owned payload must not contain |
| --- | --- | --- | --- |
| Product Analytics | Understand feature use and pseudonymous page/event journeys | `@next/third-parties/google` and GA4 | custom `demo_action` fields with failures, prompts, internal IDs, URLs, or arbitrary text; automatic pageviews keep GA4's standard URL/referrer fields |
| Deployed Runtime Error Logging | Diagnose final provider/tool/storage/runtime/client-boundary failures | one-line JSON through `console.error` and Vercel Runtime Logs | raw errors, message, stack, cause, request bodies, secrets, user content |

Do not send success/failure outcomes to GA4 and do not write ordinary success lifecycle logs.

## Environment Contract

- Local development, tests, and non-Vercel builds: analytics disabled, even if a non-Vercel environment happens to define `VERCEL_ENV`.
- Vercel Preview: disabled by default. Defining `NEXT_PUBLIC_GA_PREVIEW_MEASUREMENT_ID` explicitly enables a test property only when the canonical Production ID is also visible for a fail-closed inequality check.
- Vercel Production: `NEXT_PUBLIC_GA_MEASUREMENT_ID` is required and must match a GA4 `G-*` Measurement ID; missing or invalid configuration fails fast.
- Never reuse the Production property for Preview validation. Preview test mode fails when the Production reference is absent, malformed, or equal to the Preview ID.
- Runtime error records include bounded `deployment_environment`, optional Git ref, and hostname only. URL paths and queries are discarded.

## Consent Contract

`SiteAnalyticsRoot` installs the consent-default script with `beforeInteractive` before rendering `<GoogleAnalytics />`:

- `analytics_storage` defaults to `denied`.
- `ad_storage`, `ad_user_data`, and `ad_personalization` always stay `denied`.
- The versioned local choice is only `granted` or `denied`.
- The privacy control remains reopenable so a visitor can change the choice.
- Provider or local-storage failure is best effort and must not affect the app.
- Advanced Consent Mode can send cookieless measurement pings while denied. The UI states this explicitly.

`<GoogleAnalytics />` owns the default GA4 pageview integration. Keep provider-standard page URL/referrer fields as approved for this site; do not add a repository-owned route watcher or manual `page_view`. If SPA history-change pageviews are needed, enable and verify the GA4 web stream's Enhanced Measurement setting during Preview acceptance instead of adding application code.

## Product Event Contract

The bounded host event is:

```text
demo_action {
  demo_slug,
  action,
  source?,
  has_reference_image?
}
```

The Image Workflow sample connects `send_message`, `run_workflow`, and `modify_workflow` through a provider-neutral accepted-action contract. The published-site wrapper maps those actions to `demo_action`; the feature module never imports GA4.

The remaining ready demos use Published-Site Host Augmentation at the metered route boundary. A successful route response receives one bounded `x-agent-demo-action` marker. The enabled host analytics boundary consumes the marker from the browser's existing `fetch` response and dispatches one `demo_action` through the loaded GA provider. The marker never contains the site visitor cookie, a usage identifier, a request ID, or user content. Expected 4xx/429 responses, 5xx responses, rejected fetches, pageviews, and routes outside the catalog remain silent. Registry and generated consumer paths have no host listener or provider dependency.

### Ready Demo action inventory

| Demo slug | Accepted `action` values | Commercial question | Host acceptance seam |
| --- | --- | --- | --- |
| `foundation-chat` | `send_message` | Do evaluators start the baseline chat? | successful chat route |
| `rag-chatbot` | `send_message` | Do evaluators ask the indexed knowledge base a question? | successful chat route |
| `multimodal-chatbot` | `send_message` | Do evaluators submit a multimodal turn? | successful chat route |
| `object-generation` | `generate_object` | Do evaluators request structured output? | successful generation route; mapped from the usage-gate action |
| `generative-ui` | `send_message` | Do evaluators start a generative UI turn? | successful chat route |
| `minimal-chat-agent` | `send_message` | Do evaluators start the minimal tool-capable agent? | successful chat route |
| `image-workflow-agent` | `modify_workflow`, `run_workflow`, `send_message` | Which workflow capabilities are actually used? | provider-neutral accepted-action port; host adapter |
| `customer-memory-agent` | `compact_context`, `send_message` | Do evaluators use memory chat and explicit compaction? | successful chat/compaction routes |
| `persistent-agent` | `send_message` | Do evaluators start a durable conversation? | successful visitor-owned chat route |
| `streaming-chat-shell` | `send_message` | Do evaluators start the streaming shell? | successful chat route |
| `loop-agent` | `send_message` | Do evaluators start an approval-capable loop? | successful chat route |
| `langgraph-agent` | `send_message` | Do evaluators start a hosted LangGraph thread? | successful chat route |
| `skills-agent` | `send_message` | Do evaluators invoke the skills workflow? | successful chat route |
| `sandbox-agent` | `send_message` | Do evaluators start a sandbox-backed turn? | successful chat route |
| `mcp-agent` | `send_message` | Do evaluators start an MCP-backed turn? | successful chat route |
| `openai-agents-sdk-demo` | `send_message` | Do evaluators start the Agents SDK chat path? | successful chat route; realtime credential setup is excluded |
| `trace-eval-agent` | `evaluate`, `send_message` | Do evaluators create a trace and run the judge? | successful chat/evaluation routes |
| `ultra-chatbot-agent` | `edit_message`, `send_message` | Do evaluators chat and revise a persisted turn? | successful visitor-owned chat/edit routes |
| `canvas-agent` | `send_message` | Do evaluators delegate canvas edits to the agent? | successful chat/run routes |
| `feedback-agent` | `send_message` | Do evaluators run AI feedback triage? | successful analysis route |

Each route-backed value is emitted once per accepted HTTP action, including a distinct agent continuation when the runtime intentionally creates another request. `source` stays absent when the route cannot prove `manual` versus `agent`; the Image Workflow provider-neutral port supplies that finite enum when it can. Configure GA4 event-scoped custom dimensions for `demo_slug`, `action`, `source`, and `has_reference_image`; the last two remain optional and must never be replaced with internal identity fields.

- A manual message emits after the chat transport accepts `sendMessage`.
- A manual run emits after the route accepts and returns the graph; `has_reference_image` reflects a connected image that the run plan actually used.
- Manual add/delete/connect/reset/aspect-ratio changes emit once at their command boundary. Text fields commit on blur and React Flow positions commit at drag end, so keystrokes, drag frames, and upload-only reference changes stay silent.
- Agent modify/run events travel in bounded tool output metadata. The browser consumes each `message.id + toolCallId` once, including across React re-renders.
- Default graph creation, page mount, preset state, result success/failure, expected request validation, and provider failure do not emit product events.

Do not add default graph initialization, drag/pan noise, prompts, image URLs, visitor IDs, dynamic labels, or arbitrary metadata.

## Runtime Error Contract

`site-runtime-logging` owns a finite catalog and a server-only logger. A record contains only:

- stable event, service, level, generated `error_id`, and UTC timestamp;
- bounded deployment environment/ref/host;
- explicit low-cardinality context such as demo slug, operation, failure category, source, retryability, duration, or client error kind.

The logger API does not accept an `Error`. Unknown fields and values are dropped. Identifier, clock, deployment, serialization, or sink failures are swallowed so logging cannot replace the product failure.

Image Workflow exposes a provider-neutral failure observer. Host route adapters map bounded `provider`, `tool`, and `runtime` observations to the existing event catalog. A final workflow execution failure is recorded only after the failed graph is safely constructed; exhausted network retry is one terminal provider record. Chat stream failures use request-local deduplication, tool execution failures rethrow after one bounded record, and expected request/runnable validation remains unlogged. Provider messages, prompts, URLs, images, credentials, raw errors, and stacks are replaced by static public failure text before they can enter graph output or HTTP responses.

All other ready demos share the metered host route error adapter. One terminal thrown failure, final 5xx response, rejected response body stream, AI SDK UI message `error`, or streamed `tool-output-error` records a bounded provider, storage, or tool event based on the accepted catalog action and finite stream signal; expected 4xx/429 responses, client cancellation, and successful streams do not log. The host observer forwards response bytes unchanged and never reads the error text. `send_message`, `evaluate`, and `generate_object` classify as provider operations; `compact_context` and `edit_message` classify as storage mutations. Routes with a deeper provider-neutral observer, currently Image Workflow, opt out of this final-route fallback so one failure cannot be recorded twice. Realtime credential setup is excluded from Product Analytics while its unexpected route failure remains observable.

`/api/client-errors` accepts only a bounded error kind and source. The browser never sends a digest, message, stack, path, URL, query, or user-agent. The route requires same-origin browser metadata and JSON, caps the body at 512 bytes while streaming, and rejects unknown fields before mapping the report into `client.runtime_failed`.

## Registry Isolation

The production telemetry provider belongs only to the published-site host. `scripts/registry-sync/host-telemetry-isolation.mjs` scans both `registry/**` and `apps/web/public/r/**` and rejects provider packages/calls, GA environment names, host feature paths, and logger event identifiers. Run:

```bash
pnpm registry:telemetry:check
pnpm test:unit
pnpm registry:check
```

The scanner reads every non-binary file regardless of extension, rejects path-only host markers and symlinks, and runs before and after registry build/validation plus after sync writes.

A failure in unrelated registry projection checks must be diagnosed separately; do not repair unrelated demo projection drift as part of telemetry work.

## Preview Acceptance After Merge

Sawana owns Preview acceptance and merge. In a Preview deployment configured with a separate GA4 test property:

1. Confirm the default consent command executes before the GA tag and storage starts denied.
2. Confirm the privacy choice persists and can be reopened.
3. Confirm a denied choice does not create analytics cookies; cookieless requests remain expected under Advanced Consent Mode.
4. Navigate representative routes and confirm expected pageviews arrive once with provider-standard page URL/referrer fields; verify the GA4 web stream's browser-history Enhanced Measurement setting when validating client-side transitions.
5. Trigger one accepted action for every row in the ready-demo inventory. Confirm DebugView receives the expected bounded `demo_action` once per accepted route/action, while rejected validation, usage-gate rejection, setup credential requests, and response failures remain silent.
6. Trigger Image Workflow manual and agent message/modify/run actions and confirm DebugView receives each bounded `demo_action` once; verify upload-only, keystroke, drag-frame, default graph, and result outcome paths remain silent.
7. Trigger one controlled Image Workflow provider/tool/runtime failure and representative route-level provider and storage failures. Confirm each produces one Vercel Runtime Logs JSON record with Preview/ref/host metadata and no sentinel prompt, URL query, token, credential, provider message, or stack; verify expected 4xx/429 paths produce none.
8. Install or inspect a generated registry artifact and confirm no host telemetry package, environment name, event, or logger is present.

## Reference Implementation

The design adapts analytics consent and structured logging patterns from Pikkai commit `0ad26fbcada696664d815784c85338b7ace3c813`, while tightening the client-error boundary and preserving this repository's host-versus-registry architecture.
