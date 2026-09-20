import { normalizeSiteUsageInviteCode } from "../access-code";
import { creditBalance } from "./balance";
import { type ActiveAccessCodePolicy, resolveSiteUsagePolicy } from "./policy";
import type { SiteUsageGateStore } from "./route-wrapper";

type DatabaseBoundary = Awaited<ReturnType<typeof loadDatabaseBoundary>>;

let databaseBoundaryPromise: Promise<{
  and: DatabaseBoundary["and"];
  asc: DatabaseBoundary["asc"];
  database: DatabaseBoundary["database"];
  eq: DatabaseBoundary["eq"];
  gte: DatabaseBoundary["gte"];
  sql: DatabaseBoundary["sql"];
  siteUsageAccessCodes: DatabaseBoundary["siteUsageAccessCodes"];
  siteUsageEvents: DatabaseBoundary["siteUsageEvents"];
  siteUsageVisitors: DatabaseBoundary["siteUsageVisitors"];
  siteUsageWaitlistEntries: DatabaseBoundary["siteUsageWaitlistEntries"];
}> | null = null;

export type SiteUsageAccessCodeRedeemResult =
  | {
      ok: true;
      policy: ActiveAccessCodePolicy;
    }
  | {
      ok: false;
      reason: "invalid_code";
    };

export type SiteUsageWaitlistSupportIntent = "willing_to_support";

export function createDatabaseSiteUsageGateStore(): SiteUsageGateStore {
  return {
    async reserveCredits({ action, createdAt, demoSlug, visitorId, units }) {
      if (!Number.isSafeInteger(units) || units < 1) {
        throw new Error("Credit cost must be a positive integer.");
      }
      const {
        database,
        siteUsageEvents,
        siteUsageVisitors,
        siteUsageAccessCodes,
        eq,
        and,
        gte,
      } = await getDatabaseBoundary();
      return database.transaction(async (tx) => {
        await tx
          .insert(siteUsageVisitors)
          .values({ id: visitorId, createdAt, updatedAt: createdAt })
          .onConflictDoNothing();
        // Serialize spending for this visitor across requests and server instances.
        const [visitor] = await tx
          .select()
          .from(siteUsageVisitors)
          .where(eq(siteUsageVisitors.id, visitorId))
          .for("update");
        const [accessCode] = visitor?.activeAccessCodeId
          ? await tx
              .select()
              .from(siteUsageAccessCodes)
              .where(eq(siteUsageAccessCodes.id, visitor.activeAccessCodeId))
          : [];
        const activeAccessCodePolicy = accessCode?.isEnabled
          ? accessCode
          : null;
        if (activeAccessCodePolicy) {
          assertValidAccessCodePolicy(activeAccessCodePolicy);
        }
        const policy = resolveSiteUsagePolicy({
          activeAccessCodePolicy,
          now: createdAt,
        });
        const events = await tx
          .select({ createdAt: siteUsageEvents.createdAt })
          .from(siteUsageEvents)
          .where(
            and(
              eq(siteUsageEvents.visitorId, visitorId),
              gte(siteUsageEvents.createdAt, policy.windowStartsAt)
            )
          );
        const balance = creditBalance(policy, events);
        if (balance.remainingUnits < units) {
          setOperationResetTime(balance, events, units);
          return { allowed: false, balance, eventIds: [] };
        }
        const rows = await tx
          .insert(siteUsageEvents)
          .values(
            Array.from({ length: units }, () => ({
              action,
              createdAt,
              demoSlug,
              visitorId,
            }))
          )
          .returning({ id: siteUsageEvents.id });
        return {
          allowed: true,
          balance: {
            ...balance,
            remainingUnits: balance.remainingUnits - units,
            usedUnits: balance.usedUnits + units,
          },
          eventIds: rows.map((row) => row.id),
        };
      });
    },
    async refundCredits(eventIds) {
      if (eventIds.length === 0) {
        return;
      }
      const { database, siteUsageEvents } = await getDatabaseBoundary();
      const { inArray } = await import("@workspace/database/drizzle");
      await database
        .delete(siteUsageEvents)
        .where(inArray(siteUsageEvents.id, eventIds));
    },
    async ensureVisitor({ now, visitorId }) {
      const { database, eq, siteUsageAccessCodes, siteUsageVisitors } =
        await getDatabaseBoundary();

      await ensureSiteUsageVisitor({
        now,
        visitorId,
      });

      const [visitor] = await database
        .select({
          activeAccessCodeId: siteUsageVisitors.activeAccessCodeId,
        })
        .from(siteUsageVisitors)
        .where(eq(siteUsageVisitors.id, visitorId))
        .limit(1);

      if (!visitor) {
        throw new Error("Site usage visitor could not be created.");
      }

      if (!visitor.activeAccessCodeId) {
        return {
          activeAccessCodePolicy: null,
        };
      }

      const [accessCode] = await database
        .select({
          allowanceUnits: siteUsageAccessCodes.allowanceUnits,
          isEnabled: siteUsageAccessCodes.isEnabled,
          windowSeconds: siteUsageAccessCodes.windowSeconds,
        })
        .from(siteUsageAccessCodes)
        .where(eq(siteUsageAccessCodes.id, visitor.activeAccessCodeId))
        .limit(1);

      if (!accessCode?.isEnabled) {
        return {
          activeAccessCodePolicy: null,
        };
      }

      assertValidAccessCodePolicy(accessCode);

      return {
        activeAccessCodePolicy: {
          allowanceUnits: accessCode.allowanceUnits,
          windowSeconds: accessCode.windowSeconds,
        },
      };
    },
    async listUsageEventsSince({ since, visitorId }) {
      const { and, asc, database, eq, gte, siteUsageEvents } =
        await getDatabaseBoundary();

      return database
        .select({
          createdAt: siteUsageEvents.createdAt,
        })
        .from(siteUsageEvents)
        .where(
          and(
            eq(siteUsageEvents.visitorId, visitorId),
            gte(siteUsageEvents.createdAt, since)
          )
        )
        .orderBy(asc(siteUsageEvents.createdAt));
    },
  };
}

export async function redeemSiteUsageAccessCode({
  code,
  now,
  visitorId,
}: {
  code: string;
  now: Date;
  visitorId: string;
}): Promise<SiteUsageAccessCodeRedeemResult> {
  const { database, siteUsageAccessCodes, siteUsageVisitors, sql } =
    await getDatabaseBoundary();
  const normalizedCode = normalizeSiteUsageInviteCode(code);

  if (!normalizedCode) {
    return {
      ok: false,
      reason: "invalid_code",
    };
  }

  const [accessCode] = await database
    .select({
      allowanceUnits: siteUsageAccessCodes.allowanceUnits,
      id: siteUsageAccessCodes.id,
      isEnabled: siteUsageAccessCodes.isEnabled,
      windowSeconds: siteUsageAccessCodes.windowSeconds,
    })
    .from(siteUsageAccessCodes)
    .where(sql`upper(${siteUsageAccessCodes.code}) = ${normalizedCode}`)
    .limit(1);

  if (!accessCode?.isEnabled) {
    return {
      ok: false,
      reason: "invalid_code",
    };
  }

  assertValidAccessCodePolicy(accessCode);

  await database
    .insert(siteUsageVisitors)
    .values({
      activeAccessCodeId: accessCode.id,
      createdAt: now,
      id: visitorId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        activeAccessCodeId: accessCode.id,
        updatedAt: now,
      },
      target: siteUsageVisitors.id,
    });

  return {
    ok: true,
    policy: {
      allowanceUnits: accessCode.allowanceUnits,
      windowSeconds: accessCode.windowSeconds,
    },
  };
}

export async function createSiteUsageWaitlistEntry({
  demoSlug,
  message,
  now,
  supportIntent,
  visitorId,
}: {
  demoSlug: string | null;
  message: string | null;
  now: Date;
  supportIntent: SiteUsageWaitlistSupportIntent;
  visitorId: string;
}) {
  const { database, siteUsageWaitlistEntries } = await getDatabaseBoundary();

  await ensureSiteUsageVisitor({
    now,
    visitorId,
  });

  await database.insert(siteUsageWaitlistEntries).values({
    createdAt: now,
    demoSlug,
    message,
    supportIntent,
    visitorId,
  });
}

async function ensureSiteUsageVisitor({
  now,
  visitorId,
}: {
  now: Date;
  visitorId: string;
}) {
  const { database, siteUsageVisitors } = await getDatabaseBoundary();

  await database
    .insert(siteUsageVisitors)
    .values({
      createdAt: now,
      id: visitorId,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

async function getDatabaseBoundary() {
  databaseBoundaryPromise ??= loadDatabaseBoundary();
  return databaseBoundaryPromise;
}

async function loadDatabaseBoundary() {
  const [
    {
      database,
      siteUsageAccessCodes,
      siteUsageEvents,
      siteUsageVisitors,
      siteUsageWaitlistEntries,
    },
    { and, asc, eq, gte, sql },
  ] = await Promise.all([
    import("@workspace/database"),
    import("@workspace/database/drizzle"),
  ]);

  return {
    and,
    asc,
    database,
    eq,
    gte,
    sql,
    siteUsageAccessCodes,
    siteUsageEvents,
    siteUsageVisitors,
    siteUsageWaitlistEntries,
  };
}

function assertValidAccessCodePolicy(policy: {
  allowanceUnits: number;
  windowSeconds: number;
}) {
  if (policy.allowanceUnits <= 0 || policy.windowSeconds <= 0) {
    throw new Error("Site usage access code policy must be positive.");
  }
}

function setOperationResetTime(
  balance: ReturnType<typeof creditBalance>,
  events: Array<{ createdAt: Date }>,
  units: number
) {
  if (balance.scope !== "access_code" || units > balance.allowanceUnits) {
    return;
  }
  const expiring = events.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )[units - balance.remainingUnits - 1];
  if (expiring) {
    balance.resetAt = new Date(
      expiring.createdAt.getTime() + balance.windowSeconds * 1000
    ).toISOString();
  }
}
