import { createHash } from "node:crypto";
import Redis from "ioredis";
import type { Feedback, FeedbackEvidence, FeedbackSummary } from "../types";
import { feedbackEnv } from "./env";
import { FeedbackError } from "./submission";

const DAY = 86_400;
let connection: Redis | undefined;
export function feedbackRedis() {
  const url = feedbackEnv().REDIS_URL;
  if (!url) {
    throw new FeedbackError("Configure REDIS_URL to store feedback.", 503);
  }
  if (!connection || connection.status === "end") {
    connection = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => (attempt <= 1 ? 200 : null),
    });
    connection.on("error", () => {
      /* Commands reject through the route's error response. */
    });
  }
  return connection;
}

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const key = (owner: string, id: string) => `feedback-agent:${owner}:item:${id}`;
const indexKey = (owner: string) => `feedback-agent:${owner}:inbox`;

export interface SubmissionRecord {
  acceptsScreenshot?: boolean;
  evidence?: FeedbackEvidence;
  feedback?: Feedback;
  state: "draft" | "finalized" | "abandoned";
  tokenDigest: string;
}

export async function readRecord(owner: string, id: string) {
  const raw = await feedbackRedis().get(key(owner, id));
  if (!raw) {
    throw new FeedbackError("Feedback session not found or expired.", 404);
  }
  return { raw, record: JSON.parse(raw) as SubmissionRecord };
}

export async function createSubmission(
  owner: string,
  token: string,
  idempotency: string,
  evidence: FeedbackEvidence,
  acceptsScreenshot = false
) {
  const id = digest(`${owner}:${idempotency}`).slice(0, 32);
  const record: SubmissionRecord = {
    acceptsScreenshot,
    evidence,
    state: "draft",
    tokenDigest: digest(token),
  };
  const result = await feedbackRedis().eval(
    `
    local existing = redis.call('GET', KEYS[1])
    if existing then return existing end
    local count = tonumber(redis.call('GET', KEYS[2]) or '0')
    if count >= 20 then return 'limited' end
    redis.call('INCR', KEYS[2])
    if count == 0 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
    return 'created'
  `,
    2,
    key(owner, id),
    `feedback-agent:${owner}:limit`,
    JSON.stringify(record),
    DAY
  );
  if (result === "limited") {
    throw new FeedbackError(
      "You can capture 20 reports per day in this demo.",
      429
    );
  }
  if (
    result !== "created" &&
    (JSON.parse(String(result)) as SubmissionRecord).tokenDigest !==
      record.tokenDigest
  ) {
    throw new FeedbackError("Idempotency key is already in use.", 409);
  }
  return { id, created: result === "created" };
}

// Compare-and-swap keeps finalization, abandonment and later edits atomic across instances.
export async function replaceRecord(
  owner: string,
  id: string,
  raw: string,
  record: SubmissionRecord,
  publish = false
) {
  const ttl = record.state === "finalized" ? DAY * 7 : DAY;
  const result = await feedbackRedis().eval(
    `
    if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
    local ttl = redis.call('TTL', KEYS[1])
    if ARGV[5] == '1' then ttl = tonumber(ARGV[3]) end
    redis.call('SET', KEYS[1], ARGV[2], 'EX', math.max(ttl, 1))
    if ARGV[5] == '1' then
      redis.call('ZADD', KEYS[2], ARGV[4], ARGV[6])
      redis.call('EXPIRE', KEYS[2], ARGV[3])
    end
    return 1
  `,
    2,
    key(owner, id),
    indexKey(owner),
    raw,
    JSON.stringify(record),
    ttl,
    Date.now(),
    publish ? "1" : "0",
    id
  );
  if (result !== 1) {
    throw new FeedbackError("Feedback changed. Refresh and try again.", 409);
  }
}

export async function listFeedback(owner: string): Promise<FeedbackSummary[]> {
  const redis = feedbackRedis();
  await redis.zremrangebyscore(
    indexKey(owner),
    "-inf",
    Date.now() - DAY * 7 * 1000
  );
  const ids = await redis.zrevrange(indexKey(owner), 0, 139);
  if (!ids.length) {
    return [];
  }
  const records = await redis.mget(...ids.map((id) => key(owner, id)));
  return records.flatMap((raw) => {
    const feedback = raw
      ? (JSON.parse(raw) as SubmissionRecord).feedback
      : undefined;
    return feedback
      ? [
          {
            id: feedback.id,
            description: feedback.description,
            status: feedback.status,
            createdAt: feedback.createdAt,
          },
        ]
      : [];
  });
}
