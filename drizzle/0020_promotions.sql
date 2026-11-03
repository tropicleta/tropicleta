CREATE TABLE "promotions" (
  "code" varchar(32) PRIMARY KEY NOT NULL,
  "percent" integer NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "expires_on" date,
  CONSTRAINT "promotion_percent" CHECK ("percent" between 1 and 100)
);
