---
title: Site Usage Gate
description: Visitor credit allowance, resource pricing, atomic spending, and homepage balance UI for the published demo website.
updateAt: 2026-09-21
---

# Site Usage Gate

## Scope

- Published-site visitor credits, invitation-code policies, and the homepage balance control.
- Host-owned pricing stays outside registry copies. This is an application allowance; there is no checkout, purchased balance, or payment integration.

## Domain Language

- **Site Visitor Owner**: The `site_visitor_id` HTTP-only cookie owns invitation bindings and demo session data.
- **Free Allowance Owner**: A server-derived HMAC of trusted IP and User-Agent, independent of cookies.
- **Demo Credit**: One unit of the visitor's shared recurring allowance.
- **Usage Event**: One consumed credit, including the demo, operation, and timestamp. A five-credit operation inserts five rows in one transaction.
- **Usage Access Code**: An operator-configured recurring allowance upgrade; visitor-facing wording is "Invite code".

## Allowance and pricing

- The default is 50 credits per UTC calendar day. Unused credits do not accumulate.
- Existing events each count as one credit. No schema migration or history rewrite is required.
- Prices live together in `apps/web/features/site-usage-gate/pricing.ts`:
  - Each metered message/action or manual workflow request costs 1 credit, except Canvas Agent chat, which is free.
  - Each executed image generation adds 5 credits.
  - Each executed Canvas text generation node adds 1 credit.
  - Each RAG retrieval adds 1 credit, including retrieval through Ultra Chatbot.
  - Each newly created shared Vercel Sandbox adds 4 credits. Reusing an existing sandbox does not incur another startup charge.
- Outside Canvas Agent chat, a message generating one image costs 6 credits and two generated images cost 11 credits. Canvas Agent chat charges only the generated resources: one image costs 5 credits and two images cost 10 credits. Workflow costs follow executed nodes, including internal agent tool execution.
- Reused outputs, graph edits, material/output nodes, and GIF assembly do not add resource credits. Canvas Agent messages are exempt from the base message charge, including at zero balance; its executed generation nodes still reserve resource credits. Other agent messages and manual workflow requests retain their base charge.
- Automatic provider retries inside a logical generation do not incur another resource charge. Starting a new user-requested attempt does.
- These are application prices, not provider token or dollar accounting. Hosted search, Realtime duration, uploads, and storage do not have separate credit prices in this version; existing metered entrypoints still charge their base credit.

## Enforcement

- `server/route-wrapper.ts` reserves the base credit before entering the handler unless the server route explicitly sets `chargeMessage: false`. Canvas Agent chat sets this flag; clients cannot select it. Validation/setup errors returned before streaming refund this base reservation. Resource attempts already started retain their charge.
- `server/store.ts` locks the visitor row inside a Postgres transaction, resolves the live invitation policy, checks the current window, and inserts all credits for the operation atomically. Requests for the same visitor cannot spend the same balance concurrently.
- Resource costs are reserved immediately before the provider call. Insufficient balance prevents that operation from starting. Provider failures after reservation retain the resource charge.
- Operations in a workflow reserve independently. If a later node cannot be funded, completed outputs remain usable; the next expensive operation is blocked. Whole-workflow prepayment is not implemented.
- Pre-stream denials return structured `SITE_USAGE_LIMIT_EXCEEDED` HTTP 429 with required credits, remaining credits, and reset time. Denials inside an active stream use the tool/node error path; Canvas and Image Workflow retain the credit error as user-facing node feedback.
- The portable `shared/resource-usage/server/context.ts` execution hook uses request-scoped async context to carry an optional host observer into streamed tools. Without a host observer, demos run normally. Demos do not import site pricing, storage, or dialogs.
- Free spending and balance queries use `free-v1-<HMAC-SHA256(IP, User-Agent)>`. Clearing/changing cookies does not replenish the same free identity. Enabled invitation policies keep their cookie-owned allowance; disabling a code returns to the current free identity.
- `SITE_USAGE_VISITOR_SECRET` must be a stable random secret of at least 32 characters on Vercel. Configure it before deploying. Rotation resets free identities. Local development uses a fixed development identity and secret; non-Vercel production fails closed until a trusted ingress is explicitly supported.
- Only Vercel's `x-vercel-forwarded-for` is accepted in deployment. See [Vercel request headers](https://vercel.com/docs/headers/request-headers). Missing trusted IP or secret fails before resource calls. Raw IP and User-Agent are not persisted in the credit tables.
- IP or User-Agent changes can change the free allowance; people sharing both may share credits. No additional identity service, Turnstile, or global site spending cap is introduced.
- Existing cookie-owned usage cannot reliably be mapped to IP identities. The switch starts a fresh free allowance; existing invitation bindings and their usage remain. No schema migration is needed.
- Spending looks up the cookie invitation binding, then locks the effective allowance owner. Compared with the prior ordinary-visitor path this adds one indexed binding query per reservation; different cookies sharing a free identity serialize on that same row.
- `site_usage_events` retains the shared seven-day Demo Data Retention Window through the existing cleanup cron. Visitor, access-code, and waitlist tables retain their existing responsibilities.

## Homepage and limit UI

- `ui/credit-balance-button.tsx` is mounted only by `apps/web/app/page.tsx`, alongside homepage actions. No always-visible balance button appears in demo workspaces.
- The button contains a coin icon and current balance. Its popover shows remaining/total credits, the local reset time or rolling-window explanation, prices, and generation-attempt semantics.
- `/api/site-usage/balance` creates/reuses the visitor cookie and returns live database balance and the shared price list with `Cache-Control: private, no-store`.
- Refresh on mount, window focus, popover open, invite-code redemption, and the next scheduled credit reset. Loading and fetch errors must not display a fabricated balance.
- The existing app-shell limit dialog remains available across demo routes and Project Guide Companion, but opens only after a structured 429. It offers the waitlist and invite-code entry.
- The waitlist remains separate from credit accounting. No payment is collected.

## Invitation policy

- Codes are matched case-insensitively, and each visitor has at most one active binding. A new valid code replaces the old binding.
- Resolve the code's enabled state and allowance live at spending time. Disabled codes return the visitor to the default daily allowance.
- Existing configured policies are preserved. The original target was 100 credits in a rolling five-hour window; actual values come from the database.
- Rolling-policy denial times account for the number of credits needed by the requested operation.
- Never put live invitation codes into source, tests, docs, screenshots, or logs.

## Verification

- Unit contracts cover weighted operations, insufficient balance before provider execution, validation refunds, and resource charging after stream headers return.
- `SITE_USAGE_DATABASE_INTEGRATION=1 pnpm test:integration -- features/site-usage-gate/server/store.integration.test.ts` exercises concurrent reservations and refunds against the configured database. It uses a unique synthetic visitor and deletes only its own visitor and cascading event rows.

## Update Triggers

- Update this file when prices, counted resources, reservation/refund semantics, visitor identity, or the homepage balance interface changes.
