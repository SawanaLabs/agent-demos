# Memory & Persistence Agent

Foundation modules for the Batch 6 memory and persistence demo.

Current slice:

- persist customer threads and raw UI messages
- persist explicit customer memory records and lifecycle events
- persist memory embeddings for semantic recall
- persist handoff compaction records
- expose three shared read-only demo accounts plus one visitor-private sandbox account
- isolate sandbox data by the `cm_visitor_id` HTTP-only cookie
- expose a three-pane workspace for accounts, persistent chat, and saved memory state
- keep compaction policy on a message-count threshold for easy QA

## File Tree

```text
customer-memory-agent/
  README.md
  customer-profiles.ts
  demo-meta.ts
  session-data.ts
  server/
    cleanup.test.ts
    cleanup.ts
    compaction.test.ts
    compaction-store.test.ts
    compaction-store.ts
    compaction.ts
    contract.ts
    conversation.test.ts
    conversation.ts
    memory-recall.test.ts
    memory-recall.ts
    memory-store.test.ts
    memory-store.ts
    runtime.test.ts
    runtime.ts
    shared-demo-seed.test.ts
    shared-demo-seed.ts
    session-runtime.test.ts
    session-runtime.ts
    session.ts
    thread-store.test.ts
    thread-store.ts
    viewer-context.ts
  ui/
    customer-memory-agent-screen.tsx
    customer-memory-agent-workspace.tsx
    customer-memory-session.test.ts
    customer-memory-session.ts
    use-customer-memory-session.ts
```
