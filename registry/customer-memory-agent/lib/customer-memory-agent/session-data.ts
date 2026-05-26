import type { UIMessage } from "ai";

import type { CustomerMemoryProfile } from "./customer-profiles";
import type { CustomerMemoryCompactionRecord } from "./compaction-store";
import type { RetrievedCustomerMemory } from "./memory-recall";
import type {
  CustomerMemoryEventRecord,
  CustomerMemoryRecord,
} from "./memory-store";
import type {
  CustomerMemoryThreadRecord,
  CustomerMemoryThreadSummary,
} from "./thread-store";

export interface CustomerMemorySessionData {
  customer: CustomerMemoryProfile;
  memoryEvents: CustomerMemoryEventRecord[];
  latestCompaction: CustomerMemoryCompactionRecord | null;
  memories: CustomerMemoryRecord[];
  messages: UIMessage[];
  relevantMemories: RetrievedCustomerMemory[];
  thread: CustomerMemoryThreadRecord;
  threads: CustomerMemoryThreadSummary[];
}
