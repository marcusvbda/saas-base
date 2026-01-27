ALTER TABLE `user_subscriptions`
  ADD COLUMN `stripe_customer_id` VARCHAR(255) NULL AFTER `user_id`,
  ADD COLUMN `status` VARCHAR(64) NOT NULL DEFAULT 'active' AFTER `plan`,
  ADD COLUMN `current_period_start` DATETIME NULL AFTER `status`,
  ADD COLUMN `current_period_end` DATETIME NULL AFTER `current_period_start`,
  ADD COLUMN `cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0 AFTER `current_period_end`;

CREATE TABLE IF NOT EXISTS `stripe_webhook_events` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(255) NOT NULL UNIQUE,
  `event_type` VARCHAR(128) NOT NULL,
  `processed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_event_id` (`event_id`),
  INDEX `stripe_webhook_events_event_type_idx` (`event_type`),
  INDEX `stripe_webhook_events_processed_at_idx` (`processed_at`)
);

CREATE INDEX `user_subscriptions_user_status_idx` ON `user_subscriptions` (`user_id`, `status`);
