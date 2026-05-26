import {
  consumeStream,
  convertToModelMessages,
  createIdGenerator,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
  type UIMessageStreamOnFinishCallback,
} from "ai";
import { z } from "zod";

import type { CustomerMemoryProfile } from "../customer-profiles";
import {
  buildCustomerMemoryCompactionInput,
  customerMemoryCompactionThreshold,
  customerMemoryRecentMessageWindow,
  generateCustomerMemoryCompactionSummary,
  getCustomerMemoryCompactionTargetMessageCount,
} from "./compaction";
import {
  type CustomerMemoryCompactionRecord,
  createCustomerMemoryCompactionStore,
} from "./compaction-store";
import {
  createCustomerMemoryAgentGateway,
  getCustomerMemoryAgentConfig,
  getCustomerMemoryAgentEnv,
  type CustomerMemoryAgentEnv,
} from "./env";
import { createCustomerMemoryLifecycle } from "./memory-lifecycle";
import {
  findRelevantCustomerMemory,
  type RetrievedCustomerMemory,
} from "./memory-recall";
import type { CustomerMemoryRecord } from "./memory-store";
import { createCustomerMemoryThreadStore } from "./thread-store";

const customerMemoryInstructions = [
  "You are the customer-memory-agent demo for a customer success and support team.",
  "Carry forward durable customer context across sessions, while keeping normal replies concise.",
  "Use the manageCustomerMemory tool when the user shares, corrects, or removes a stable preference, long-lived constraint, promised follow-up, recurring risk, or durable account fact.",
  "Prefer updating an existing relevant memory over adding a near-duplicate memory.",
  "Do not save transient greetings, one-off pleasantries, or information that is already obviously captured elsewhere in the thread.",
  "When a retrieved memory conflicts with the latest user instruction, follow the latest instruction and explain the change.",
  "If a memory is relevant, use it in the answer without repeating the whole memory panel.",
].join(" ");

const memoryCategorySchema = z.enum([
  "constraint",
  "preference",
  "promise",
  "risk",
  "fact",
  "follow_up",
]);

const memoryOperationInputSchema = z.discriminatedUnion("operation", [
  z.object({
    category: memoryCategorySchema,
    content: z
      .string()
      .min(10)
      .describe("The durable customer memory to store."),
    operation: z.literal("add"),
    reason: z.string().min(8).describe("Why this should be remembered."),
    sourceMessageId: z
      .string()
      .nullable()
      .describe("The message ID that justified this memory, when known."),
    title: z.string().min(3).describe("A short label for the memory panel."),
  }),
  z.object({
    category: memoryCategorySchema.optional(),
    content: z
      .string()
      .min(10)
      .describe("The revised durable customer memory."),
    memoryId: z.string().min(1),
    operation: z.literal("update"),
    reason: z
      .string()
      .min(8)
      .describe("Why this replaces or enriches the existing memory."),
    sourceMessageId: z.string().nullable(),
    title: z.string().min(3).optional(),
  }),
  z.object({
    memoryId: z.string().min(1),
    operation: z.literal("delete"),
    reason: z.string().min(8).describe("Why this memory should be hidden."),
    sourceMessageId: z.string().nullable(),
  }),
  z.object({
    operation: z.literal("noop"),
    reason: z
      .string()
      .min(8)
      .describe("Why no durable customer memory should change."),
    sourceMessageId: z.string().nullable(),
  }),
]);

export const memoryOperationToolInputSchema = z.object({
  category: memoryCategorySchema
    .optional()
    .describe("Required when adding a memory, optional when updating one."),
  content: z
    .string()
    .min(10)
    .optional()
    .describe("Required for add and update operations."),
  memoryId: z
    .string()
    .min(1)
    .optional()
    .describe("Required for update and delete operations."),
  operation: z
    .enum(["add", "update", "delete", "noop"])
    .describe("The memory lifecycle operation to perform."),
  reason: z.string().min(8).describe("Why this memory operation is needed."),
  sourceMessageId: z
    .string()
    .nullable()
    .optional()
    .describe("The message ID that justified this operation, when known."),
  title: z
    .string()
    .min(3)
    .optional()
    .describe("Required when adding a memory, optional when updating one."),
});

type MemoryOperationToolInput = z.infer<typeof memoryOperationToolInputSchema>;

interface PendingMemoryOperation {
  category: z.infer<typeof memoryCategorySchema>;
  content: string;
  memoryId: string | null;
  operation: "add" | "update" | "delete" | "noop";
  reason: string;
  sourceMessageId: string | null;
  title: string;
}

interface StreamCustomerMemoryConversationInput {
  customer: CustomerMemoryProfile;
  messages: UIMessage[];
  threadId: string;
  visitorId: string;
}

interface CreateConversationResponseInput {
  messages: UIMessage[];
  onFinish: UIMessageStreamOnFinishCallback<UIMessage>;
  originalMessages: UIMessage[];
  queueMemoryDraft: (draft: MemoryOperationToolInput) => Promise<{
    accepted: true;
    operation: PendingMemoryOperation["operation"];
    title: string | null;
  }>;
  systemPrompt: string;
}

interface StreamCustomerMemoryConversationDependencies {
  applyMemoryOperations?: (
    operations: PendingMemoryOperation[],
    input: StreamCustomerMemoryConversationInput
  ) => Promise<CustomerMemoryRecord[]>;
  createConversationResponse?: (
    input: CreateConversationResponseInput,
    env: CustomerMemoryAgentEnv
  ) => Promise<Response>;
  findRelevantMemory?: typeof findRelevantCustomerMemory;
  getLatestCompaction?: (
    threadId: string
  ) => Promise<CustomerMemoryCompactionRecord | null>;
  maybeCompactThread?: (input: {
    customer: CustomerMemoryProfile;
    latestCompaction: CustomerMemoryCompactionRecord | null;
    messages: UIMessage[];
    threadId: string;
  }) => Promise<void>;
  saveThreadMessages?: (input: {
    messages: UIMessage[];
    threadId: string;
  }) => Promise<void>;
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getLatestUserPrompt(messages: UIMessage[]) {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") {
      continue;
    }

    const text = getMessageText(message);

    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

function buildContextMessages(
  messages: UIMessage[],
  latestCompaction: CustomerMemoryCompactionRecord | null
) {
  if (!latestCompaction) {
    return messages;
  }

  const startIndex = Math.min(latestCompaction.messageCount, messages.length);

  return messages.slice(startIndex);
}

function formatRelevantMemories(memories: RetrievedCustomerMemory[]) {
  if (memories.length === 0) {
    return "No relevant saved customer memories were recalled for this prompt.";
  }

  return memories
    .map(
      (memory, index) =>
        `${index + 1}. [id: ${memory.id}] [${memory.category}] ${memory.title ?? "Untitled memory"}: ${memory.content}`
    )
    .join("\n");
}

function buildCustomerMemorySystemPrompt(input: {
  customer: CustomerMemoryProfile;
  latestCompaction: CustomerMemoryCompactionRecord | null;
  relevantMemories: RetrievedCustomerMemory[];
}) {
  return [
    customerMemoryInstructions,
    `Customer account: ${input.customer.name} (${input.customer.industry})`,
    `Account summary: ${input.customer.accountSummary}`,
    `Operating notes:\n- ${input.customer.operatingNotes.join("\n- ")}`,
    `Relevant saved memories:\n${formatRelevantMemories(input.relevantMemories)}`,
    input.latestCompaction
      ? `Handoff compaction for older thread context:\n${input.latestCompaction.summary}`
      : "No handoff compaction exists yet for this thread.",
  ].join("\n\n");
}

function applyCustomerMemoryOperations(
  operations: PendingMemoryOperation[],
  input: StreamCustomerMemoryConversationInput
) {
  return createCustomerMemoryLifecycle().applyOperations(operations, {
    customerId: input.customer.id,
    threadId: input.threadId,
    visitorId: input.visitorId,
  });
}

async function maybeCompactCustomerMemoryThread(input: {
  customer: CustomerMemoryProfile;
  latestCompaction: CustomerMemoryCompactionRecord | null;
  messages: UIMessage[];
  threadId: string;
}) {
  const targetMessageCount = getCustomerMemoryCompactionTargetMessageCount({
    latestCompaction: input.latestCompaction,
    messageCount: input.messages.length,
    recentWindow: customerMemoryRecentMessageWindow,
    threshold: customerMemoryCompactionThreshold,
  });

  if (targetMessageCount === null) {
    return;
  }

  const compactionInput = buildCustomerMemoryCompactionInput({
    latestCompaction: input.latestCompaction,
    messages: input.messages,
    targetMessageCount,
  });

  const summary = await generateCustomerMemoryCompactionSummary({
    customerLabel: input.customer.name,
    messages: compactionInput.messages,
    previousHandoff: compactionInput.previousHandoff,
  });

  await createCustomerMemoryCompactionStore().saveCompaction({
    messageCount: targetMessageCount,
    summary,
    threadId: input.threadId,
  });
}

async function createDefaultConversationResponse(
  input: CreateConversationResponseInput,
  env: CustomerMemoryAgentEnv
) {
  const gateway = createCustomerMemoryAgentGateway(env);
  const { chatModel } = getCustomerMemoryAgentConfig(env);
  const result = streamText({
    model: gateway(chatModel),
    system: input.systemPrompt,
    messages: await convertToModelMessages(input.messages),
    stopWhen: stepCountIs(6),
    tools: {
      manageCustomerMemory: tool({
        description:
          "Add, update, delete, or skip a durable customer memory. Update an existing memory when the new fact corrects or enriches it.",
        inputSchema: memoryOperationToolInputSchema,
        execute: input.queueMemoryDraft,
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
    generateMessageId: createIdGenerator({
      prefix: "cm-msg",
      size: 16,
    }),
    onFinish: input.onFinish,
    originalMessages: input.originalMessages,
  });
}

export async function streamCustomerMemoryConversation(
  input: StreamCustomerMemoryConversationInput,
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv(),
  dependencies: StreamCustomerMemoryConversationDependencies = {}
) {
  const latestUserPrompt = getLatestUserPrompt(input.messages);
  const getLatestCompaction =
    dependencies.getLatestCompaction ??
    ((threadId: string) =>
      createCustomerMemoryCompactionStore().getLatestCompaction(threadId));
  const relevantMemories = await (
    dependencies.findRelevantMemory ?? findRelevantCustomerMemory
  )(
    {
      customerId: input.customer.id,
      query: latestUserPrompt,
      visitorId: input.visitorId,
    },
    env
  );
  const latestCompaction = await getLatestCompaction(input.threadId);
  const pendingMemoryOperations: PendingMemoryOperation[] = [];
  const contextMessages = buildContextMessages(
    input.messages,
    latestCompaction
  );
  const createConversationResponse =
    dependencies.createConversationResponse ??
    createDefaultConversationResponse;

  return createConversationResponse(
    {
      messages: contextMessages,
      onFinish: async ({ isAborted, messages }) => {
        if (isAborted) {
          return;
        }

        await (
          dependencies.saveThreadMessages ??
          ((nextInput: { messages: UIMessage[]; threadId: string }) =>
            createCustomerMemoryThreadStore().saveThreadMessages(nextInput))
        )({
          messages,
          threadId: input.threadId,
        });

        await (
          dependencies.applyMemoryOperations ?? applyCustomerMemoryOperations
        )(pendingMemoryOperations, input);

        await (
          dependencies.maybeCompactThread ?? maybeCompactCustomerMemoryThread
        )({
          customer: input.customer,
          latestCompaction,
          messages,
          threadId: input.threadId,
        });
      },
      originalMessages: input.messages,
      queueMemoryDraft: (draft) => {
        const parsedDraft = memoryOperationInputSchema.parse({
          ...draft,
          sourceMessageId: draft.sourceMessageId ?? null,
        });
        const normalizedDraft: PendingMemoryOperation = {
          category:
            "category" in parsedDraft
              ? (parsedDraft.category ?? "fact")
              : "fact",
          content: "content" in parsedDraft ? parsedDraft.content : "",
          memoryId: "memoryId" in parsedDraft ? parsedDraft.memoryId : null,
          operation: parsedDraft.operation,
          reason: parsedDraft.reason,
          sourceMessageId: parsedDraft.sourceMessageId,
          title:
            "title" in parsedDraft
              ? (parsedDraft.title ?? "Memory lifecycle event")
              : "",
        };
        pendingMemoryOperations.push(normalizedDraft);

        return Promise.resolve({
          accepted: true,
          operation: parsedDraft.operation,
          title: "title" in parsedDraft ? (parsedDraft.title ?? null) : null,
        });
      },
      systemPrompt: buildCustomerMemorySystemPrompt({
        customer: input.customer,
        latestCompaction,
        relevantMemories,
      }),
    },
    env
  );
}
