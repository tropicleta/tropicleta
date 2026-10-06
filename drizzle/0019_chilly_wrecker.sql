CREATE TABLE "admin_login_challenges" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"auth_tag" varchar(16) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
