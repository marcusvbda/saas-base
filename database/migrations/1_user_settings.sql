CREATE TABLE "user_settings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(36) NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "timezone" VARCHAR(255)
);

CREATE INDEX "user_settings_user_id_idx" ON "user_settings" ("user_id");
