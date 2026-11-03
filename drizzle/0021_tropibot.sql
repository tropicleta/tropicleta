CREATE TABLE "tropibot_records" (
 "id" serial PRIMARY KEY,
 "request_id" varchar(36) NOT NULL UNIQUE,
 "data" jsonb NOT NULL,
 "cash_entry_id" integer REFERENCES "cash_entries"("id"),
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
