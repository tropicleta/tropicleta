CREATE TABLE "visit_daily" (
  "day" date NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Santiago')::date,
  "path" varchar(200) NOT NULL,
  "source" varchar(80) NOT NULL,
  "campaign" varchar(80) NOT NULL DEFAULT '',
  "views" integer NOT NULL DEFAULT 0,
  "visits" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("day", "path", "source", "campaign")
);
