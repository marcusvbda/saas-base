ALTER TABLE "user_subscriptions"
  ADD COLUMN "stripe_customer_id" VARCHAR(255) NULL,
  ADD COLUMN "status" VARCHAR(64) NOT NULL DEFAULT 'active',
  ADD COLUMN "current_period_start" TIMESTAMP NULL,
  ADD COLUMN "current_period_end" TIMESTAMP NULL,
  ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE "stripe_webhook_events" (
  "id" SERIAL PRIMARY KEY,
  "event_id" VARCHAR(255) NOT NULL UNIQUE,
  "event_type" VARCHAR(128) NOT NULL,
  "processed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_event_id" ON "stripe_webhook_events" ("event_id");
CREATE INDEX "stripe_webhook_events_event_type_idx" ON "stripe_webhook_events" ("event_type");
CREATE INDEX "stripe_webhook_events_processed_at_idx" ON "stripe_webhook_events" ("processed_at");
CREATE INDEX "user_subscriptions_user_status_idx" ON "user_subscriptions" ("user_id", "status");
