---
title: Cloudflare AI Gateway
description: Native AI SDK image routes, credential modes, cost evidence and Gender Swap migration boundaries.
updateAt: 2026-10-08
---

# Cloudflare AI Gateway

## Scope and source

`apps/web/features/cloudflare-ai-gateway/` owns the contract, generation, receipts and UI. The app page and API route under `apps/web/app/` are thin adapters. The API wrapper adds the host's existing image-generation usage gate and analytics. Registry consumers receive the portable handler with no host telemetry or metering.

`scripts/registry-sync/cloudflare-ai-gateway.manifest.json` projects the feature into `registry/cloudflare-ai-gateway/`. Shared assets include only the workspace shell and breadcrumb. This feature does not import the Vercel gateway contract or require `AI_GATEWAY_API_KEY`.

References are snapshotted with `arrayBuffer()` before React state, previews or uploads. Accept at most four PNG, JPEG or WebP files, 3 MB combined, leaving room below Vercel's 4.5 MB request-body limit. The first release returns base64 images and offers browser downloads. It does not add storage, queues or persisted generation tasks.

## Native routes and model identity

Current official documentation was checked on 2026-10-08. Use provider-native routes with the official AI SDK providers. The old Cloudflare Unified API is marked deprecated. Unified Billing remains a current payment option and is separate from that deprecated API.

| Path | Implemented call | Documentation evidence | Live requirement |
| --- | --- | --- | --- |
| GPT Image 2, prompt only | `generateImage`, `createOpenAI`, `/openai/images/generations`, model `gpt-image-2` | OpenAI native gateway is documented as a base-URL replacement. Cloudflare's current catalog lists GPT Image 2. | Confirm native Images passthrough, image bytes and request IDs. |
| GPT Image 2, references | Same SDK call with `prompt: {text, images}`, `/openai/images/edits`, multipart | AI SDK's installed OpenAI provider implements Images edits. Cloudflare's catalog documents reference edits through its newer model API. | Confirm multipart passthrough through the native route. Catalog support alone cannot prove it. |
| Gemini images and references | `generateText`, `createGoogleGenerativeAI`, `/google-ai-studio/v1beta/models/gemini-3.1-flash-image:generateContent` | Cloudflare documents native Google generateContent. Google documents the stable image model and image output. | Confirm the exact stable model through the chosen gateway and credential mode. |

Cloudflare's unified catalog labels the Google image entry `google/nano-banana-2`. This demo uses Google's native `gemini-3.1-flash-image` identifier. The catalog page does not establish that the two IDs are interchangeable in a native provider request. The older `gemini-3.1-flash-image-preview` was shut down on 2026-06-25 according to Google's changelog. Do not use the preview ID or silently substitute another image model.

The newer `/accounts/{account}/ai/run` catalog API has a Cloudflare-specific input/output envelope and may return `gatewayMetadata.keySource`. That envelope does not match the two native SDK calls implemented here. Adopting it would need a separate adapter and live acceptance.

All model requests use `maxRetries: 0`, `cf-aig-max-attempts: 1` and `cf-aig-skip-cache: true`. There is no gateway or provider fallback in application code. The 120-second model timeout is below the route's 180-second maximum. Gateway dashboard policies can still influence the request and must be checked during live acceptance.

## Credentials and payment

All credentials stay on the server. Client setup data contains variable names and readiness booleans.

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

- `requestedModel` is the native ID submitted by the application.
- `logId`, `eventId` and `cacheStatus` come from `cf-aig-*` response headers when present.
- `providerRequestId` comes from the `x-request-id` header when present.
- `providerResponseId` and `servedModel` come only from Google's raw `responseId` and `modelVersion`. Missing values stay null. AI SDK-generated IDs and requested model names are excluded from these fields.
- `credentialMode` is the configured request mode. Native responses do not establish the actual credential source.
- `usage` contains AI SDK-reported input, output and total tokens. Missing usage stays null.
- `costLookup.estimateUsd` is the optional AI Gateway log `cost`. Cloudflare describes this value as an estimate. `customCost` preserves the API's indicator when available.
- `actualCostUsd` stays null. Neither SDK usage nor AI Gateway log cost establishes the actual billed charge.

The optional lookup calls `GET /accounts/{account}/ai-gateway/gateways/{gateway}/logs/{logId}` once with a five-second timeout. A 404 is `pending`; absent management credentials are `not-configured`; missing response IDs are `missing-log-id`; other lookup failures are explicit `failed`. A completed image survives a cost lookup failure and carries that status. Only selected log metadata is returned, excluding prompt and response payload fields.

Error responses from the native generation call retain the request receipt with its HTTP status and available IDs. A Gemini response containing text and no image is an explicit generation error. The UI clears previous results before a new request, displays failures and makes receipts expandable.

## Gender Swap migration

The reference repository is read-only for this work. Its current OpenAI `generateImage` and Google `generateText` calls can retain their quality, size, reference-image and resolution inputs while replacing the provider construction with this feature's native Cloudflare providers.

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

Synthetic transport tests exercise the installed SDKs against fabricated HTTP responses. They check request paths, multipart and inline references, native image parsing, provider-key stripping, no retry on failure, missing image errors, cost estimate labeling and log payload exclusion. They are not live model calls.

A fresh shadcn consumer must install the generated registry item through the CLI, typecheck, build and open the demo. When server credentials are absent, acceptance is limited to setup visibility, model controls, reference previews and disabled generation. A fixture-based result check can verify preview/download rendering, but must be reported separately from real model acceptance.

The 2026-10-08 local acceptance passed unit tests, typechecks, production builds, the registry schema, this feature's projection and public export checks. A fresh Next.js consumer installed the published item with the official shadcn CLI, then passed typecheck and production build. Host and consumer browsers verified setup, model controls and reference previews. A browser-only synthetic response verified a 640 × 480 result, expandable receipt, mobile layout without horizontal overflow and a downloaded file whose SHA-256 matched the fixture. No live model request was made because the required credentials were absent.

The whole-repository registry synchronization check still reports existing drift in older shared gateway contracts, Generative UI and LangGraph projections. Those unrelated files were preserved. The host's local API also requires its existing trusted Vercel edge identity; the portable consumer API independently verified the expected 503 missing-configuration response.

## Official references

- [Cloudflare OpenAI native provider](https://developers.cloudflare.com/ai-gateway/usage/providers/openai/)
- [Cloudflare Google AI Studio native provider](https://developers.cloudflare.com/ai-gateway/usage/providers/google-ai-studio/)
- [Cloudflare model catalog](https://developers.cloudflare.com/ai/models/), [GPT Image 2](https://developers.cloudflare.com/ai/models/openai/gpt-image-2/), [Nano Banana 2](https://developers.cloudflare.com/ai/models/google/nano-banana-2/)
- [Cloudflare BYOK](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/) and [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/)
- [Cloudflare cost semantics](https://developers.cloudflare.com/ai-gateway/observability/costs/), [log lookup API](https://developers.cloudflare.com/api/resources/ai_gateway/subresources/logs/methods/get/), [gateway headers](https://developers.cloudflare.com/ai-gateway/glossary/) and [payload logging](https://developers.cloudflare.com/ai-gateway/observability/logging/)
- [Google Gemini 3.1 Flash Image](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image), [image generation](https://ai.google.dev/gemini-api/docs/image-generation) and [model lifecycle changelog](https://ai.google.dev/gemini-api/docs/changelog)
- [AI SDK image generation](https://ai-sdk.dev/docs/ai-sdk-core/image-generation), [OpenAI provider](https://ai-sdk.dev/providers/ai-sdk-providers/openai) and [Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai)
