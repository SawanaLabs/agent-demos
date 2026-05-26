import type { UIMessage } from "ai";

import type { CustomerMemoryProfile } from "./customer-profiles";

import { createCustomerMemoryCompactionStore } from "./compaction-store";
import { createCustomerMemoryLifecycle } from "./memory-lifecycle";
import { createCustomerMemoryThreadStore } from "./thread-store";
import { customerMemorySharedVisitorId } from "./viewer-context";

interface SharedDemoSeedMemory {
  category:
    | "constraint"
    | "preference"
    | "promise"
    | "risk"
    | "fact"
    | "follow_up";
  content: string;
  sourceMessageId: string | null;
  title: string;
}

interface SharedDemoSeedSnapshot {
  compaction: {
    messageCount: number;
    summary: string;
  };
  memories: SharedDemoSeedMemory[];
  messages: UIMessage[];
  threadTitle: string;
}

const sharedDemoSnapshots: Record<string, SharedDemoSeedSnapshot> = {
  "acme-co": {
    compaction: {
      messageCount: 4,
      summary:
        "Older turns established two durable constraints for Acme Co: legal review is required before marketing claims go live, and executive updates must stay forwardable without over-promising timeline certainty.",
    },
    memories: [
      {
        category: "constraint",
        content:
          "Marketing claims need legal review before any customer-facing launch language ships.",
        sourceMessageId: "acme-user-2",
        title: "Legal review on claims",
      },
      {
        category: "preference",
        content:
          "Executive-facing updates should be concise, calm, and safe to forward without editing.",
        sourceMessageId: "acme-user-3",
        title: "Forwardable executive updates",
      },
    ],
    messages: [
      {
        id: "acme-user-1",
        parts: [
          {
            text: "We need this launch thread to remember that Acme executives forward our updates directly.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "acme-assistant-1",
        parts: [
          {
            text: "Understood. I will keep executive-facing updates concise and low-risk.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "acme-user-2",
        parts: [
          {
            text: "Any customer-facing marketing claim still needs legal review before it goes out.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "acme-assistant-2",
        parts: [
          {
            text: "I will treat legal review as a standing launch constraint for this account.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "acme-user-3",
        parts: [
          {
            text: "Draft the weekly update so leadership can forward it as-is without changing the tone.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "acme-assistant-3",
        parts: [
          {
            text: "I would frame the update around verified status, next checkpoint, and any blocked risks that already have owners.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ],
    threadTitle: "Launch review thread",
  },
  "helio-dev": {
    compaction: {
      messageCount: 4,
      summary:
        "Earlier Helio Dev turns established that technical depth is preferred over polished phrasing, and any follow-up promise should include a concrete date or checkpoint owner.",
    },
    memories: [
      {
        category: "preference",
        content:
          "Helio Dev prefers root-cause detail over polished status language.",
        sourceMessageId: "helio-user-1",
        title: "Lead with root cause",
      },
      {
        category: "promise",
        content:
          "Follow-up commitments should include a concrete date or checkpoint owner.",
        sourceMessageId: "helio-user-2",
        title: "Date every promise",
      },
    ],
    messages: [
      {
        id: "helio-user-1",
        parts: [
          {
            text: "For Helio Dev, keep the answer technical. They care more about why the incident happened than polished wording.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "helio-assistant-1",
        parts: [
          {
            text: "Got it. I will keep the explanation rooted in failure mode, fix, and remaining uncertainty.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "helio-user-2",
        parts: [
          {
            text: "If we promise a follow-up, put a real date on it. They dislike vague 'soon' language.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "helio-assistant-2",
        parts: [
          {
            text: "I will avoid vague follow-up language and attach a date or named checkpoint.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "helio-user-3",
        parts: [
          {
            text: "Summarize the current blocker for the engineering lead and include the next debug checkpoint.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "helio-assistant-3",
        parts: [
          {
            text: "The blocker is still the retry queue deadlock. The next checkpoint is a lock-contention profile review tomorrow at 10am with the platform owner.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ],
    threadTitle: "Incident follow-up thread",
  },
  "northstar-logistics": {
    compaction: {
      messageCount: 4,
      summary:
        "Earlier Northstar turns established that downtime language must stay conservative until root cause is confirmed, and every escalation update needs an explicit owner plus next checkpoint across operations and finance.",
    },
    memories: [
      {
        category: "constraint",
        content:
          "Downtime language must stay conservative until root cause is confirmed.",
        sourceMessageId: "northstar-user-1",
        title: "Conservative incident wording",
      },
      {
        category: "follow_up",
        content:
          "Every escalation update needs a named owner and next checkpoint across operations and finance.",
        sourceMessageId: "northstar-user-2",
        title: "Owner and checkpoint on escalations",
      },
    ],
    messages: [
      {
        id: "northstar-user-1",
        parts: [
          {
            text: "Northstar does not want us calling this resolved until root cause is confirmed. Keep the downtime language conservative.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "northstar-assistant-1",
        parts: [
          {
            text: "Understood. I will avoid declaring full resolution until the root cause is verified.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "northstar-user-2",
        parts: [
          {
            text: "Escalation notes also need an owner and the next checkpoint so operations and finance stay aligned.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "northstar-assistant-2",
        parts: [
          {
            text: "I will include both the acting owner and the next checkpoint in every incident update.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "northstar-user-3",
        parts: [
          {
            text: "Prepare the latest incident note for operations and finance with that structure.",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "northstar-assistant-3",
        parts: [
          {
            text: "Current owner: platform operations. Next checkpoint: payment queue replay review at 14:00 UTC. Customer impact remains under investigation, so the incident is still treated as active.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ],
    threadTitle: "Operations escalation thread",
  },
};

export function getCustomerMemorySharedDemoSnapshot(customerId: string) {
  return sharedDemoSnapshots[customerId] ?? null;
}

interface SharedDemoSeedDependencies {
  compactionStore?: Pick<
    ReturnType<typeof createCustomerMemoryCompactionStore>,
    "saveCompaction"
  >;
  memoryLifecycle?: Pick<
    ReturnType<typeof createCustomerMemoryLifecycle>,
    "seedMemories"
  >;
  threadStore?: Pick<
    ReturnType<typeof createCustomerMemoryThreadStore>,
    "createThread" | "listThreads" | "saveThreadMessages"
  >;
}

export async function ensureCustomerMemorySharedDemoSeed(
  customer: CustomerMemoryProfile,
  dependencies: SharedDemoSeedDependencies = {}
) {
  if (customer.accessMode !== "shared_readonly") {
    return;
  }

  const snapshot = getCustomerMemorySharedDemoSnapshot(customer.id);

  if (!snapshot) {
    return;
  }

  const threadStore =
    dependencies.threadStore ?? createCustomerMemoryThreadStore();
  const existingThreads = await threadStore.listThreads({
    customerId: customer.id,
    visitorId: customerMemorySharedVisitorId,
  });

  if (existingThreads.length > 0) {
    return;
  }

  const thread = await threadStore.createThread({
    customerId: customer.id,
    title: snapshot.threadTitle,
    visitorId: customerMemorySharedVisitorId,
  });

  await threadStore.saveThreadMessages({
    messages: snapshot.messages,
    threadId: thread.id,
  });

  await (
    dependencies.memoryLifecycle ?? createCustomerMemoryLifecycle()
  ).seedMemories(snapshot.memories, {
    customerId: customer.id,
    threadId: thread.id,
    visitorId: customerMemorySharedVisitorId,
  });

  const compactionStore =
    dependencies.compactionStore ?? createCustomerMemoryCompactionStore();

  await compactionStore.saveCompaction({
    messageCount: snapshot.compaction.messageCount,
    summary: snapshot.compaction.summary,
    threadId: thread.id,
  });
}
