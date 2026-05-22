CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "rag_chatbot_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"page_label" varchar(64),
	"section_title" text,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rag_chatbot_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_slug" varchar(191) NOT NULL,
	"title" text NOT NULL,
	"source_page_url" text NOT NULL,
	"document_url" text NOT NULL,
	"description" text,
	"content_hash" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rag_chatbot_embeddings" ADD CONSTRAINT "rag_chatbot_embeddings_resource_id_rag_chatbot_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."rag_chatbot_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rag_chatbot_embeddings_resource_chunk_idx" ON "rag_chatbot_embeddings" USING btree ("resource_id","chunk_index");--> statement-breakpoint
CREATE INDEX "rag_chatbot_embeddings_embedding_idx" ON "rag_chatbot_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "rag_chatbot_resources_source_slug_idx" ON "rag_chatbot_resources" USING btree ("source_slug");
