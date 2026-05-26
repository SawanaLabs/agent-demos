# Foundation Chat

Business purpose: prove the minimum production-ready contract for every later demo.

What this demo does:

- Runs a real AI SDK 6 chat route through AI Gateway.
- Shows the default AI Elements workspace with an empty state before the first message.
- Surfaces setup problems early so copied slices fail loudly instead of hiding missing configuration.
- Serves as the reference registry implementation for future demo distribution work.

Feature tree:

```text
foundation-chat/
  demo-meta.ts
  README.md
  server/
    runtime.ts
  ui/
    foundation-chat-screen.tsx
    foundation-chat-workspace.tsx
```

Registry distribution:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://your-deployment.example.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

Fresh app bootstrap:

```bash
pnpm dlx shadcn@latest init --preset b0 --template next
cd <your-app>
pnpm i
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://your-deployment.example.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

When `pnpm dlx shadcn@latest init` prompts for setup choices, use:

- `Base`
- `Nova`

Then set `AI_GATEWAY_API_KEY` in `.env.local` and start the app:

```bash
pnpm dev
```
