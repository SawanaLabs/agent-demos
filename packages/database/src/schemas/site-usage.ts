import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const siteUsageAccessCodes = pgTable(
  "site_usage_access_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 191 }).notNull(),
    label: text("label"),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    allowanceUnits: integer("allowance_units").notNull(),
    windowSeconds: integer("window_seconds").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIndex: uniqueIndex("site_usage_access_codes_code_idx").on(
      sql`upper(${table.code})`
    ),
  })
);

export const siteUsageVisitors = pgTable(
  "site_usage_visitors",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    activeAccessCodeId: uuid("active_access_code_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    accessCodeForeignKey: foreignKey({
      columns: [table.activeAccessCodeId],
      foreignColumns: [siteUsageAccessCodes.id],
      name: "site_usage_visitors_access_code_fk",
    }).onDelete("set null"),
    activeAccessCodeIndex: index("site_usage_visitors_access_code_idx").on(
      table.activeAccessCodeId
    ),
  })
);

export const siteUsageEvents = pgTable(
  "site_usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    demoSlug: varchar("demo_slug", { length: 191 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdIndex: index("site_usage_events_created_idx").on(table.createdAt),
    visitorCreatedIndex: index("site_usage_events_visitor_created_idx").on(
      table.visitorId,
      table.createdAt
    ),
    visitorForeignKey: foreignKey({
      columns: [table.visitorId],
      foreignColumns: [siteUsageVisitors.id],
      name: "site_usage_events_visitor_fk",
    }).onDelete("cascade"),
  })
);

export const siteUsageWaitlistEntries = pgTable(
  "site_usage_waitlist_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    demoSlug: varchar("demo_slug", { length: 191 }),
    supportIntent: varchar("support_intent", { length: 64 }).notNull(),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    visitorCreatedIndex: index("site_usage_waitlist_visitor_created_idx").on(
      table.visitorId,
      table.createdAt
    ),
    visitorForeignKey: foreignKey({
      columns: [table.visitorId],
      foreignColumns: [siteUsageVisitors.id],
      name: "site_usage_waitlist_visitor_fk",
    }).onDelete("cascade"),
  })
);
