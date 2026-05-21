# Foundation Chat

Business purpose: prove the minimum production-ready contract for every later demo.

What this demo does:

- Runs a real AI SDK 6 chat route through AI Gateway.
- Shows the default AI Elements workspace with an empty state before the first message.
- Surfaces setup problems early so copied slices fail loudly instead of hiding missing configuration.

Feature tree:

```text
foundation-chat/
  demo-meta.ts
  README.md
  server/
    stream-foundation-chat.ts
  ui/
    foundation-chat-screen.tsx
    foundation-chat-workspace.tsx
```

Future registry distribution:

```bash
pnpm dlx shadcn@latest add https://your-registry.example.com/r/foundation-chat.json
```
