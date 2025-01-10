CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"publish_date" timestamp NOT NULL,
	"source" text NOT NULL,
	"bank_code" text NOT NULL,
	"summary" text,
	"ai_relevance_score" real DEFAULT 0,
	"ai_relevance_reason" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "articles_link_unique" UNIQUE("link")
);
