CREATE TABLE "user_subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(36) NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "subscription_id" VARCHAR(255) NOT NULL,
  "plan" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" ("user_id");
CREATE INDEX "user_subscriptions_subscription_id_idx" ON "user_subscriptions" ("subscription_id");
CREATE INDEX "user_subscriptions_user_updated_idx" ON "user_subscriptions" ("user_id", "updated_at");
