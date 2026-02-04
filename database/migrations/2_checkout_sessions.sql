CREATE TABLE "checkout_sessions" (
  "id" SERIAL PRIMARY KEY,
  "session_id" VARCHAR(255) NOT NULL,
  "resource_id" VARCHAR(255) NOT NULL,
  "status" VARCHAR(255) NOT NULL DEFAULT 'pending',
  "resource_type" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "checkout_sessions_session_id_idx" ON "checkout_sessions" ("session_id");
CREATE INDEX "checkout_sessions_resource_type_resource_id_idx" ON "checkout_sessions" ("resource_type", "resource_id");
CREATE INDEX "checkout_sessions_created_at_idx" ON "checkout_sessions" ("created_at");
