import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";

export const siteUsageCleanupRetentionDays = demoDataRetentionDays;
export const siteUsageCleanupCronScheduleUtc = "0 20 * * *";

export interface SiteUsageCleanupPersistence {
  deleteEventsOlderThan(cutoff: Date): Promise<number>;
}

export interface SiteUsageCleanupInput {
  now?: Date;
  persistence?: SiteUsageCleanupPersistence;
  retentionDays?: number;
}

export async function cleanupExpiredSiteUsageEvents(
  input: SiteUsageCleanupInput = {}
) {
  const now = input.now ?? new Date();
  const retentionDays = input.retentionDays ?? siteUsageCleanupRetentionDays;
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const persistence = input.persistence ?? createDatabaseBackedPersistence();
  const deletedEvents = await persistence.deleteEventsOlderThan(cutoff);

  return {
    cutoff: cutoff.toISOString(),
    deletedEvents,
    retentionDays,
  };
}

function createDatabaseBackedPersistence(): SiteUsageCleanupPersistence {
  return {
    async deleteEventsOlderThan(cutoff) {
      const [{ database, siteUsageEvents }, { lt }] = await Promise.all([
        import("@workspace/database"),
        import("@workspace/database/drizzle"),
      ]);
      const deletedEvents = await database
        .delete(siteUsageEvents)
        .where(lt(siteUsageEvents.createdAt, cutoff))
        .returning({ id: siteUsageEvents.id });

      return deletedEvents.length;
    },
  };
}
