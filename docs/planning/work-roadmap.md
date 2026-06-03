---
title: Work Roadmap
description: Recoverable work topics and intended future states for this repository.
updateAt: 2026-06-03
---

# Work Roadmap

This roadmap captures recoverable work intent for the user, agents, or any person or team receiving the work. Use it when a viable topic should be preserved for later because active parallel work already carries enough cognitive load, or because the topic should wait for another task, decision, validation, environment, or timing condition. It records intended states and agreed discussion context, not implementation plans, and it does not need to mirror every active parallel task.

## Item Template

```md
- <Recoverable work topic>
  - Intended State: <What should be true when future work has successfully resolved this topic.>
  - Discussion: <Optional. Agreed context from prior discussion, or a concise open question from that discussion that a future agent or teammate should continue from.>
```

## Current Focus

The top 1-5 recoverable work topics to resume first, expected to be resolved within the next few days. If this section grows beyond five items, reorganize or remove stale items before adding more.

- Agent demo conversation-visible send errors
  - Intended State: When any agent demo hits a message-send failure, including request validation, API route, provider/model, tool/runtime, sandbox, or stream errors, the failed turn is represented as an explicit error message inside the same conversation so the user can see what failed and continue from the conversation history.
  - Discussion: User requested this as a one-week roadmap item on 2026-06-02. Target resolution by 2026-06-09. As of 2026-06-03, LangGraph, Persistent Agent, Ultra Chatbot Agent, and OpenAI Agents SDK Demo have conversation-visible error paths, while older chat demos such as Foundation Chat, RAG Chatbot, MCP Agent, Skills Agent, Loop Agent, Streaming Chat Shell, and Customer Memory Agent still need review or migration away from workspace-level error banners.
- Seven-day cleanup for visitor-created private demo data
  - Intended State: Every Visitor Owner-created Private Demo Data surface expires after the Demo Data Retention Window of seven days, including visitor-created database rows, Vercel Blob uploads, Redis-backed resume stream state, and Vercel Sandbox artifacts or persistent sessions. Cleanup preserves non-visitor-generated operating or seed data such as preindexed RAG resources, site usage access codes, and system configuration unless a separate retention decision changes that boundary.
  - Discussion: User confirmed on 2026-06-03 that "all persistent content" means user-created persistent demo data and that the retention window should be unified to seven days. Current code-owned stores now align to that target: Customer Memory threads, Customer Memory events, Persistent Agent chats, Site Usage events, Ultra Chatbot Agent database rows, and Ultra Blob uploads use the shared `demoDataRetentionDays` policy. Shared Vercel Sandbox creation now applies stable demo tags, a five-minute active-session timeout, 7-day snapshot expiration, and keep-last-one snapshot retention to newly created sandboxes and existing named sandboxes when they reconnect. The installed Redis resume-stream dependency currently expires its sentinel state after 24 hours, which is shorter than the demo window. The remaining explicit lifecycle gap is provider-side Vercel Sandbox identity cleanup: no cron lists tagged old sandboxes and deletes matching provider resources, and old untagged sandboxes should not be auto-deleted without manual inspection. Support waitlist entries remain a separate operating-data classification unless the product boundary later treats them as Private Demo Data.

## Near-Term

Recoverable work topics expected to become relevant within the next few weeks.

No planning items yet.

## Longer-Term Direction

Future states or strategic directions that likely matter over a three-month-plus horizon.

No planning items yet.

## Parked / Waiting

Recoverable work topics that should not be pursued yet because they depend on another decision, external validation, blocked environment, or clearer timing.

No planning items yet.
