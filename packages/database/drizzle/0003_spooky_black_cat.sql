CREATE TABLE "ultra_chatbot_agent_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"title" text NOT NULL,
	"selected_chat_model" varchar(191) NOT NULL,
	"visibility" varchar(32) DEFAULT 'private' NOT NULL,
	"active_stream_id" varchar(191),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ultra_chatbot_agent_documents" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid,
	"visitor_id" varchar(191) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"kind" varchar(32) DEFAULT 'text' NOT NULL,
	CONSTRAINT "ultra_chatbot_agent_documents_pk" PRIMARY KEY("id","created_at")
);
--> statement-breakpoint
CREATE TABLE "ultra_chatbot_agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"message_id" varchar(191) NOT NULL,
	"role" varchar(32) NOT NULL,
	"parts" jsonb NOT NULL,
	"attachments" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ultra_chatbot_agent_streams" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ultra_chatbot_agent_streams_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "ultra_chatbot_agent_suggestions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"document_created_at" timestamp with time zone NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"original_text" text NOT NULL,
	"suggested_text" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ultra_chatbot_agent_suggestions_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "ultra_chatbot_agent_votes" (
	"chat_id" uuid NOT NULL,
	"message_id" varchar(191) NOT NULL,
	"visitor_id" varchar(191) NOT NULL,
	"is_upvoted" boolean NOT NULL,
	CONSTRAINT "ultra_chatbot_agent_votes_pk" PRIMARY KEY("chat_id","message_id","visitor_id")
);
--> statement-breakpoint
ALTER TABLE "ultra_chatbot_agent_documents" ADD CONSTRAINT "ultra_chatbot_agent_documents_chat_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ultra_chatbot_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ultra_chatbot_agent_messages" ADD CONSTRAINT "ultra_chatbot_agent_messages_chat_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ultra_chatbot_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ultra_chatbot_agent_streams" ADD CONSTRAINT "ultra_chatbot_agent_streams_chat_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."ultra_chatbot_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ultra_chatbot_agent_suggestions" ADD CONSTRAINT "ultra_chatbot_agent_suggestions_document_fk" FOREIGN KEY ("document_id","document_created_at") REFERENCES "public"."ultra_chatbot_agent_documents"("id","created_at") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ultra_chatbot_agent_chats_visitor_updated_idx" ON "ultra_chatbot_agent_chats" USING btree ("visitor_id","updated_at");--> statement-breakpoint
CREATE INDEX "ultra_chatbot_agent_documents_chat_created_idx" ON "ultra_chatbot_agent_documents" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "ultra_chatbot_agent_messages_chat_created_idx" ON "ultra_chatbot_agent_messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ultra_chatbot_agent_messages_chat_message_id_idx" ON "ultra_chatbot_agent_messages" USING btree ("chat_id","message_id");