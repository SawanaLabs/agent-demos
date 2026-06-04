# Ultra Chatbot Agent Registry Notes

This registry item installs the complete Ultra Chatbot Agent frontend and API route source into a shadcn Next.js App Router project.

Required for the main chat happy path:

- AI Gateway: `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, and `AI_GATEWAY_CHAT_MODEL`
- Postgres: `DATABASE_URL`
- Redis: `REDIS_URL`

Additional capability configuration:

- Vercel Blob uploads: `BLOB_READ_WRITE_TOKEN`
- Cleanup cron: `CRON_SECRET`
- Remote Vercel Sandbox: `VERCEL_OIDC_TOKEN`, or `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID`

The installed `@/lib/ultra-chatbot-agent/server/schema.ts` file contains the Drizzle table definitions for chats, messages, votes, streams, documents, and suggestions. Wire those definitions into your app's migration workflow before using a persistent Postgres database.

Source docs:

- https://agent-demos.hsawana9.com/registry-guide
- https://github.com/SawanaLabs/agent-demos
- https://sdk.vercel.ai/docs
- https://elements.ai-sdk.dev/docs
