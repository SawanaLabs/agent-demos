# Cloudflare AI Gateway

Generate images and edit reference photos through interchangeable Cloudflare and Vercel AI Gateway Adapters. This independent feature uses AI SDK 6 `generateImage` for GPT Image 2 and `generateText` image files for Gemini 3.1 Flash Image.

Open `/demos/cloudflare-ai-gateway`. Select a model, enter a prompt, optionally attach references, then generate and download the returned images. The server reports the selected gateway, normalized request IDs, usage and cost evidence. Cloudflare log cost is estimated; Vercel generation cost is gateway-reported. Actual billed cost remains unavailable.

```text
cloudflare-ai-gateway/
  contract.ts
  demo-meta.ts
  server/
    keys.ts             # Host environment validation, excluded from registry
    env-source.ts       # Consumer environment adapter
    env.ts              # Server-owned Adapter selection
    config.ts           # ImageGenerator Interface and configuration
    generate.ts         # Factory, shared generation and two private Adapters
    receipt.ts          # Response metadata and optional log lookup
    runtime.ts          # Multipart route handler
  ui/
    gateway-screen.tsx
    gateway-workspace.tsx
    gateway-results.tsx
    use-gateway-workspace.ts
```

The Seam has one call:

```ts
import { createImageGenerator } from "./server/generate";
import { getImageGeneratorConfig } from "./server/env";

const generate = createImageGenerator(getImageGeneratorConfig("gpt-image-2"));
const result = await generate({ model: "gpt-image-2", prompt: "A red mug" });
```

Set `IMAGE_GATEWAY=vercel` with `AI_GATEWAY_API_KEY`, or `IMAGE_GATEWAY=cloudflare` (default) with the configuration below. Restart after changing the environment. Both Adapters use the same request/result Interface; errors carry receipts. Application retries and gateway fallback are disabled.

Configure these server-only variables in `.env.local`:

```dotenv
IMAGE_GATEWAY=cloudflare
# Only needed when IMAGE_GATEWAY=vercel:
AI_GATEWAY_API_KEY=
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
