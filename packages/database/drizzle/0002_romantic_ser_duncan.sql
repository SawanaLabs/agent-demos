CREATE TABLE "persistent_agent_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"title" text NOT NULL,
	"active_stream_id" varchar(191),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persistent_agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"message_id" varchar(191) NOT NULL,
	"role" varchar(32) NOT NULL,
	"parts" jsonb NOT NULL,
	"attachments" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persistent_agent_messages" ADD CONSTRAINT "persistent_agent_messages_chat_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."persistent_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persistent_agent_chats_visitor_updated_idx" ON "persistent_agent_chats" USING btree ("visitor_id","updated_at");--> statement-breakpoint
CREATE INDEX "persistent_agent_messages_chat_created_idx" ON "persistent_agent_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "persistent_agent_messages_chat_message_id_idx" ON "persistent_agent_messages" USING btree ("chat_id","message_id");