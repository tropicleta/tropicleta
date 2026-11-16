CREATE TABLE IF NOT EXISTS "tropi_scores" (
  "run_id" uuid PRIMARY KEY,
  "name" text NOT NULL CHECK (char_length("name") BETWEEN 2 AND 20),
  "score" integer NOT NULL CHECK ("score" >= 0 AND "score" <= 1000000000),
  "completed_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tropi_scores_order" ON "tropi_scores" ("score" DESC, "completed_at" ASC, "run_id" ASC);
