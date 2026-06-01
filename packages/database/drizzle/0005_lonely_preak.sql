CREATE TABLE "site_usage_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(191) NOT NULL,
	"label" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"allowance_units" integer NOT NULL,
	"window_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"demo_slug" varchar(191) NOT NULL,
	"action" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_usage_visitors" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"active_access_code_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_usage_waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"demo_slug" varchar(191),
	"support_intent" varchar(64) NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_usage_events" ADD CONSTRAINT "site_usage_events_visitor_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."site_usage_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_usage_visitors" ADD CONSTRAINT "site_usage_visitors_access_code_fk" FOREIGN KEY ("active_access_code_id") REFERENCES "public"."site_usage_access_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_usage_waitlist_entries" ADD CONSTRAINT "site_usage_waitlist_visitor_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."site_usage_visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_usage_access_codes_code_idx" ON "site_usage_access_codes" USING btree (upper("code"));--> statement-breakpoint
CREATE INDEX "site_usage_events_created_idx" ON "site_usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_usage_events_visitor_created_idx" ON "site_usage_events" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "site_usage_visitors_access_code_idx" ON "site_usage_visitors" USING btree ("active_access_code_id");--> statement-breakpoint
CREATE INDEX "site_usage_waitlist_visitor_created_idx" ON "site_usage_waitlist_entries" USING btree ("visitor_id","created_at");
