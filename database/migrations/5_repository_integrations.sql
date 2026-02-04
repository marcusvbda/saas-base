CREATE TABLE "repository_integrations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(36) NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "provider" VARCHAR(50) NOT NULL,
  "type" VARCHAR(50) NOT NULL DEFAULT 'repository',
  "token" TEXT NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "projects" JSONB NULL,
  "ignored_branches" JSONB NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "repository_integrations_user_id_idx" ON "repository_integrations" ("user_id");
CREATE INDEX "repository_integrations_user_provider_idx" ON "repository_integrations" ("user_id", "provider");
CREATE INDEX "repository_integrations_user_type_idx" ON "repository_integrations" ("user_id", "type");
