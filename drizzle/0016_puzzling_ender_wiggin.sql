CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"category" varchar(60) NOT NULL,
	"reason" text NOT NULL,
	"url" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
