CREATE TABLE "customer_memory_compactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"message_count" integer NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memory_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memory_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_id" uuid,
	"customer_id" varchar(191) NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"thread_id" uuid,
	"source_message_id" varchar(191),
	"operation" varchar(32) NOT NULL,
	"reason" text,
	"before_content" text,
	"after_content" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memory_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar(191) NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"thread_id" uuid,
	"source_message_id" varchar(191),
	"category" varchar(64) NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"last_accessed_at" timestamp with time zone,
	"access_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memory_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"message_index" integer NOT NULL,
	"message_id" varchar(191) NOT NULL,
	"role" varchar(32) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memory_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar(191) NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_memory_compactions" ADD CONSTRAINT "cm_compactions_thread_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_memory_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memory_embeddings" ADD CONSTRAINT "cm_embeddings_memory_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."customer_memory_memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memory_events" ADD CONSTRAINT "cm_events_memory_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."customer_memory_memories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memory_events" ADD CONSTRAINT "cm_events_thread_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_memory_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memory_memories" ADD CONSTRAINT "cm_memories_thread_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_memory_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memory_messages" ADD CONSTRAINT "cm_messages_thread_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customer_memory_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_memory_compactions_thread_id_idx" ON "customer_memory_compactions" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_memory_compactions_thread_created_at_idx" ON "customer_memory_compactions" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_memory_embeddings_memory_idx" ON "customer_memory_embeddings" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "customer_memory_embeddings_embedding_idx" ON "customer_memory_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "customer_memory_events_customer_visitor_idx" ON "customer_memory_events" USING btree ("customer_id","visitor_id");--> statement-breakpoint
CREATE INDEX "customer_memory_events_memory_id_idx" ON "customer_memory_events" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "customer_memory_events_thread_id_idx" ON "customer_memory_events" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "customer_memory_memories_customer_id_idx" ON "customer_memory_memories" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_memory_memories_customer_visitor_idx" ON "customer_memory_memories" USING btree ("customer_id","visitor_id","status");--> statement-breakpoint
CREATE INDEX "customer_memory_memories_thread_id_idx" ON "customer_memory_memories" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "customer_memory_messages_thread_id_idx" ON "customer_memory_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_memory_messages_thread_message_idx" ON "customer_memory_messages" USING btree ("thread_id","message_index");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_memory_messages_thread_message_id_idx" ON "customer_memory_messages" USING btree ("thread_id","message_id");--> statement-breakpoint
CREATE INDEX "customer_memory_threads_customer_id_idx" ON "customer_memory_threads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_memory_threads_customer_visitor_idx" ON "customer_memory_threads" USING btree ("customer_id","visitor_id");