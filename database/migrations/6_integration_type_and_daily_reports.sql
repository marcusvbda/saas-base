CREATE TABLE "daily_reports" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(36) NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "report_date" DATE NOT NULL,
  "from_date" DATE NULL,
  "content" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ready',
  "enhanced_at" TIMESTAMP NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "report_date", "from_date")
);

CREATE INDEX "daily_reports_user_id_idx" ON "daily_reports" ("user_id");
CREATE INDEX "daily_reports_user_date_idx" ON "daily_reports" ("user_id", "report_date" DESC);
CREATE INDEX "daily_reports_user_report_from_idx" ON "daily_reports" ("user_id", "report_date", "from_date" DESC);
