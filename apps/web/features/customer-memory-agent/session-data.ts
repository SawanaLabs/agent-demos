import type { UIMessage } from "ai";

import type { CustomerMemoryProfile } from "./customer-profiles";
import type { CustomerMemoryCompactionRecord } from "./server/compaction-store";
import type { RetrievedCustomerMemory } from "./server/memory-recall";
import type {
  CustomerMemoryEventRecord,
  CustomerMemoryRecord,
} from "./server/memory-store";
import type {
  CustomerMemoryThreadRecord,
  CustomerMemoryThreadSummary,
} from "./server/thread-store";

export interface CustomerMemorySessionData {
  customer: CustomerMemoryProfile;
  latestCompaction: CustomerMemoryCompactionRecord | null;
  memories: CustomerMemoryRecord[];
  memoryEvents: CustomerMemoryEventRecord[];
  messages: UIMessage[];
  relevantMemories: RetrievedCustomerMemory[];
  thread: CustomerMemoryThreadRecord;
  threads: CustomerMemoryThreadSummary[];
}
