---
title: Cloudflare AI Gateway
description: Interchangeable image generator Seam, Vercel and Cloudflare Adapters, credentials and cost semantics.
updateAt: 2026-10-09
---

# Cloudflare AI Gateway

## Scope and source

`apps/web/features/cloudflare-ai-gateway/` owns the contract, generation, receipts and UI. The app page and API route under `apps/web/app/` are thin adapters. The API wrapper adds the host's existing image-generation usage gate and analytics. Registry consumers receive the portable handler with no host telemetry or metering.

`scripts/registry-sync/cloudflare-ai-gateway.manifest.json` projects the feature into `registry/cloudflare-ai-gateway/`. Shared assets include only the workspace shell and breadcrumb. This feature owns its request contract. The Cloudflare Adapter has no Vercel credential requirement; the Vercel Adapter uses `AI_GATEWAY_API_KEY`.

References are snapshotted with `arrayBuffer()` before React state, previews or uploads. Accept at most four PNG, JPEG or WebP files, 3 MB combined, leaving room below Vercel's 4.5 MB request-body limit. The first release returns base64 images and offers browser downloads. It does not add storage, queues or persisted generation tasks.

## ImageGenerator Seam

The external Interface is `ImageGenerator = (request: GatewayRequest) => Promise<GatewayResult>`, exported by `server/generate.ts`. Construct it with `createImageGenerator(config)` at the composition point. The portable multipart handler selects server configuration once per request and invokes that same Interface. Configuration is server-owned; the browser cannot choose a gateway or send credentials.

`IMAGE_GATEWAY=cloudflare|vercel` selects the Adapter and defaults to `cloudflare`. Restart or redeploy after changing environment configuration. Invalid values fail environment validation. A programmatic caller can construct either Adapter with the discriminated `ImageGeneratorConfig` from `server/config.ts`.

`server/generate.ts` keeps the two Adapters private and shares the generation Implementation. It hides model ID mapping, credentials, SDK model construction, reference encoding, request identity and cost retrieval. Both Adapters accept logical model IDs `gpt-image-2` and `gemini-3.1-flash-image`; Vercel maps these to `openai/gpt-image-2` and `google/gemini-3.1-flash-image`. Changing the gateway leaves prompts, references, image output and the caller unchanged.

The Interface returns image bytes as base64 plus media type and a receipt. It has no storage, credit or history effects. Provider failures throw `GatewayGenerationError` with the receipt and original cause; a text-only Gemini response is an explicit error. Model calls have a 120-second timeout, no application retry and no application gateway fallback. Cost retrieval adds at most five seconds; missing or failed cost evidence is returned explicitly without discarding an image.

This Module's Depth comes from one generation call hiding those differences. It provides Leverage to callers and tests and keeps gateway changes local (Locality). It remains feature-local: no global provider registration framework or generic plugin system.

## Native routes and model identity

Current official documentation was checked on 2026-10-08. Use provider-native routes with the official AI SDK providers. The old Cloudflare Unified API is marked deprecated. Unified Billing remains a current payment option and is separate from that deprecated API.

| Path | Implemented call | Documentation evidence | Live requirement |
| --- | --- | --- | --- |
| GPT Image 2, prompt only | `generateImage`, `createOpenAI`, `/openai/images/generations`, model `gpt-image-2` | OpenAI native gateway is documented as a base-URL replacement. Cloudflare's current catalog lists GPT Image 2. | Confirm native Images passthrough, image bytes and request IDs. |
| GPT Image 2, references | Same SDK call with `prompt: {text, images}`, `/openai/images/edits`, multipart | AI SDK's installed OpenAI provider implements Images edits. Cloudflare's catalog documents reference edits through its newer model API. | Confirm multipart passthrough through the native route. Catalog support alone cannot prove it. |
| Gemini images and references | `generateText`, `createGoogleGenerativeAI`, `/google-ai-studio/v1beta/models/gemini-3.1-flash-image:generateContent` | Cloudflare documents native Google generateContent. Google documents the stable image model and image output. | Confirm the exact stable model through the chosen gateway and credential mode. |

Cloudflare's unified catalog labels the Google image entry `google/nano-banana-2`. This demo uses Google's native `gemini-3.1-flash-image` identifier. The catalog page does not establish that the two IDs are interchangeable in a native provider request. The older `gemini-3.1-flash-image-preview` was shut down on 2026-06-25 according to Google's changelog. Do not use the preview ID or silently substitute another image model.

The newer `/accounts/{account}/ai/run` catalog API has a Cloudflare-specific input/output envelope and may return `gatewayMetadata.keySource`. That envelope does not match the two native SDK calls implemented here. Adopting it would need a separate adapter and live acceptance.

Both Adapters use `maxRetries: 0`. Cloudflare also sets `cf-aig-max-attempts: 1` and `cf-aig-skip-cache: true`. Vercel sets `providerOptions.gateway.only` to the requested `openai` or `google` provider and configures no fallback model. There is no gateway or provider fallback in application code. The 120-second model timeout is below the route's 180-second maximum. Gateway dashboard policies can still influence the request and must be checked during live acceptance.

## Credentials and payment

All credentials stay on the server. Client setup data contains the selected gateway, variable names and readiness booleans. With `IMAGE_GATEWAY=vercel`, configure only `AI_GATEWAY_API_KEY` for this Module; credential selection is gateway-managed. The Cloudflare modes below apply when `IMAGE_GATEWAY=cloudflare`.

| `CLOUDFLARE_AI_GATEWAY_AUTH_MODE` | Provider header | Unified Billing fallback | Required server configuration |
| --- | --- | --- | --- |
| `byok`, default | Selected OpenAI Bearer key or Google `x-goog-api-key` | Prohibited by `cf-aig-no-wholesale: true` | Account ID, gateway ID, gateway token, selected provider key |
| `stored-byok` | Removed before transport | Prohibited by `cf-aig-no-wholesale: true` | Gateway credentials and stored provider key, optionally `CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS` |
| `unified-billing` | Removed before transport | Allowed | Gateway credentials and Cloudflare credits or a stored default BYOK key |

Cloudflare's documented precedence is request provider key, stored default BYOK key, then Unified Billing credits. Therefore `unified-billing` expresses the application's request mode. It does not force credit billing when a default stored key exists. The official SDKs require an API key; their internal placeholder is removed from outgoing provider headers in the two keyless modes. Forwarding the placeholder would make Cloudflare treat it as request BYOK.

Use a gateway token with AI Gateway Run permission as `CLOUDFLARE_AI_GATEWAY_TOKEN`. The optional `CLOUDFLARE_API_TOKEN` is a separate management token with AI Gateway Read permission. Never expose either through `NEXT_PUBLIC_*` variables, UI receipts or registry defaults.

Cloudflare's current Unified Billing documentation states a 5% charge on purchased credits and passes through underlying inference prices. This implementation does not purchase credits or calculate a per-image billed charge from that purchase fee.

## Receipt and cost semantics

Keep these fields distinct:

- `gateway` identifies the selected Adapter; `requestedModel` is the logical model ID. `provider` is the requested `openai` or `google` provider; lookup record metadata identifies the provider reported by the gateway.
- `gatewayRequestId` is Cloudflare’s `cf-aig-log-id` or Vercel’s `providerMetadata.gateway.generationId`. Vercel errors also preserve `generationId` from the SDK cause chain. Cloudflare `eventId` and `cacheStatus` come from response headers. Missing values stay null.
- `providerRequestId` comes from the `x-request-id` header when present.
- `providerResponseId` and `servedModel` come only from Google's raw `responseId` and `modelVersion`. Missing values stay null. AI SDK-generated IDs and requested model names are excluded from these fields.
- `credentialMode` is the configured Cloudflare request mode or `gateway-managed` for Vercel. `costLookup.isByok` preserves Vercel’s lookup evidence; Cloudflare leaves it null. Request mode alone does not establish the resolved credential source.
- `usage` contains AI SDK-reported input, output and total tokens. Missing usage stays null.
- `costLookup.estimateUsd` is the optional AI Gateway log `cost`. Cloudflare describes this value as an estimate. `customCost` preserves the API's indicator when available.
- `costLookup.reportedUsd` is Vercel’s `getGenerationInfo().totalCost`, with source `vercel-generation`. Cloudflare estimates use source `cloudflare-log` and leave `reportedUsd` null.
- `actualCostUsd` stays null. Reported gateway costs and estimates stay separate from final billing.

The optional lookup calls `GET /accounts/{account}/ai-gateway/gateways/{gateway}/logs/{logId}` once with a five-second timeout. A 404 is `pending`; absent management credentials are `not-configured`; missing response IDs are `missing-request-id`; other lookup failures are explicit `failed`. A completed image survives a cost lookup failure and carries that status. Only selected log metadata is returned, excluding prompt and response payload fields.

Vercel uses the official SDK’s `getGenerationInfo({id})` once with a five-second transport timeout. A 404 is `pending`, a missing ID is `missing-request-id`, and other lookup failures are `failed`. This slice has no durable retry worker.

Error responses from the generation call retain the request receipt with its HTTP status and available IDs. A Gemini response containing text and no image is an explicit generation error. The UI clears previous results before a new request, displays failures and makes receipts expandable.

## Gender Swap migration

The reference repository is read-only for this work. Its existing `dependencies.generate(request)` is the integration Seam: inject the selected `ImageGenerator` there and preserve task, credit, history and storage behavior. Adapt its production input/output contract explicitly; its nine-reference allowance and automatic sizing exceed this demo’s contract. Its current OpenAI `generateImage` and Google `generateText` calls can retain their quality, size, reference-image and resolution inputs while replacing the provider construction with this feature's native Cloudflare providers.

Its task and cost layers need explicit changes before migration:

| Existing Gender Swap behavior | Cloudflare replacement and gap |
| --- | --- |
| Vercel `gateway-generation-id` metadata and recursive error-cause extraction | Capture Cloudflare headers at the fetch transport. Store `cf-aig-log-id` separately from any provider response ID. Existing task IDs and local records remain separate. |
| `gateway.getGenerationInfo({id})` and deferred 404 lookup | Use the management log endpoint and a distinct pending-cost state. This demo does one lookup and exposes `pending`; the durable task retry mechanism is still integration work. |
| Cost contract requiring `totalCost` and boolean `isByok` | Cloudflare native SDK responses and the log metadata used here do not supply that equivalent contract. Store estimates separately, keep actual cost missing, and retain unknown credential-source state. |
| Upstream BYOK estimate plus gateway cost | Revalidate the pricing basis and resolved key source. Do not treat request mode as proof of BYOK or store a log estimate as final billing. |
| Production task persistence, retries, credits and delivery | This demo supplies an image transport and receipts. Gender Swap's task state, refunds, storage, provider accounting and delivery must be accepted together before changing production routing. |

Documentation and synthetic transport tests establish the integration shape. They do not establish that Cloudflare currently replaces the full production workflow. Live acceptance requires each native model, both prompt-only and reference-image generation, the intended credential mode, image preview/download, correlation IDs and billing evidence. No production cutover is authorized by this demo.

## Verification boundary

The 2026-10-09 contract tests exercise the same `createImageGenerator(config)(request)` Interface for both Adapters, two models and prompt-only/reference inputs. They also cover credential stripping, errors, identity and cost semantics. Synthetic transport tests exercise the installed SDKs against fabricated HTTP responses. They check request paths, multipart and inline references, native image parsing, provider-key stripping, no retry on failure, missing image errors, cost estimate labeling and log payload exclusion. They are not live model calls.

A fresh shadcn consumer must install the generated registry item through the CLI, typecheck, build and open the demo. When server credentials are absent, acceptance is limited to setup visibility, model controls, reference previews and disabled generation. A fixture-based result check can verify preview/download rendering, but must be reported separately from real model acceptance.

The 2026-10-08 local acceptance passed unit tests, typechecks, production builds, the registry schema, this feature's projection and public export checks. A fresh Next.js consumer installed the published item with the official shadcn CLI, then passed typecheck and production build. Host and consumer browsers verified setup, model controls and reference previews. A browser-only synthetic response verified a 640 × 480 result, expandable receipt, mobile layout without horizontal overflow and a downloaded file whose SHA-256 matched the fixture. No live model request was made because the required credentials were absent.

The 2026-10-09 Seam acceptance passed all 938 unit tests, full typecheck/lint, host and consumer production builds, the official shadcn installation and this feature’s projection/export checks. A consumer restarted under both gateway configurations showed the corresponding setup and returned the expected missing-credential 503. Browser-only synthetic responses verified both cost labels, gateway-specific download names and a 390px layout without horizontal overflow. Live model calls remain zero.

The whole-repository registry synchronization check still reports existing drift in older shared gateway contracts, Generative UI and LangGraph projections. Those unrelated files were preserved. The host's local API also requires its existing trusted Vercel edge identity; the portable consumer API independently verified the expected 503 missing-configuration response.

## Official references

- [Vercel provider routing](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options), [generation lookup](https://vercel.com/docs/ai-gateway/observability-and-spend/usage)

- [Cloudflare OpenAI native provider](https://developers.cloudflare.com/ai-gateway/usage/providers/openai/)
- [Cloudflare Google AI Studio native provider](https://developers.cloudflare.com/ai-gateway/usage/providers/google-ai-studio/)
- [Cloudflare model catalog](https://developers.cloudflare.com/ai/models/), [GPT Image 2](https://developers.cloudflare.com/ai/models/openai/gpt-image-2/), [Nano Banana 2](https://developers.cloudflare.com/ai/models/google/nano-banana-2/)
- [Cloudflare BYOK](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/) and [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/)
- [Cloudflare cost semantics](https://developers.cloudflare.com/ai-gateway/observability/costs/), [log lookup API](https://developers.cloudflare.com/api/resources/ai_gateway/subresources/logs/methods/get/), [gateway headers](https://developers.cloudflare.com/ai-gateway/glossary/) and [payload logging](https://developers.cloudflare.com/ai-gateway/observability/logging/)
- [Google Gemini 3.1 Flash Image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image), [image generation](https://ai.google.dev/gemini-api/docs/image-generation) and [model lifecycle changelog](https://ai.google.dev/gemini-api/docs/changelog)
- [AI SDK image generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation), [OpenAI provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai) and [Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)
