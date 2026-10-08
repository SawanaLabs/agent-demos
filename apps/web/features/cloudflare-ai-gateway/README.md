# Cloudflare AI Gateway

Generate images and edit reference photos through Cloudflare's native OpenAI and Google provider routes. This independent feature uses AI SDK 6 `generateImage` for GPT Image 2 and `generateText` image files for Gemini 3.1 Flash Image.

Open `/demos/cloudflare-ai-gateway`. Select a model, enter a prompt, optionally attach references, then generate and download the returned images. The server reports Cloudflare request IDs, provider metadata, usage and optional log cost estimates. Actual billed cost remains unavailable.

```text
cloudflare-ai-gateway/
  contract.ts
  demo-meta.ts
  server/
    keys.ts             # Host environment validation, excluded from registry
    env-source.ts       # Consumer environment adapter
    env.ts
    generate.ts         # Native AI SDK provider calls
    receipt.ts          # Response metadata and optional log lookup
    runtime.ts          # Multipart route handler
  ui/
    gateway-screen.tsx
    gateway-workspace.tsx
    gateway-results.tsx
    use-gateway-workspace.ts
```

Configure these server-only variables in `.env.local`:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_AI_GATEWAY_ID=
CLOUDFLARE_AI_GATEWAY_TOKEN=
CLOUDFLARE_AI_GATEWAY_AUTH_MODE=byok
CLOUDFLARE_OPENAI_API_KEY=
CLOUDFLARE_GOOGLE_API_KEY=
# Optional management token with AI Gateway Read permission:
CLOUDFLARE_API_TOKEN=
# Optional stored BYOK alias:
CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS=
```

The gateway token needs AI Gateway Run permission. `byok` forwards the selected provider's key and disables Unified Billing fallback. `stored-byok` removes provider auth headers and disables Unified Billing fallback. `unified-billing` removes provider auth headers and allows Cloudflare to resolve payment, including any existing stored default BYOK key. Set up credits or stored keys in Cloudflare before selecting these modes. The requested mode cannot prove the resolved credential source.

With the web app running, install the checked-in public registry item:

```bash
pnpm dlx shadcn@latest add http://localhost:3000/r/cloudflare-ai-gateway.json
```

After publishing this repository, substitute your deployed registry URL. The registry installs both routes, UI, server code and official shadcn primitives. It excludes this site's metering, analytics and environment wrapper. Consumer apps must supply their own authentication and usage policy before making the API public.

Maintain the source projection with:

```bash
node scripts/registry-sync/sync-registry-demo.mjs --demo cloudflare-ai-gateway --write
node scripts/registry-sync/sync-registry-demo.mjs --demo cloudflare-ai-gateway --check
```

See [routing, billing and Gender Swap migration](../../../../docs/frontend/cloudflare-ai-gateway.md) for the verified documentation boundary and required live acceptance.
