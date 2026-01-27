create table `user_subscriptions` (
  `id` int not null auto_increment primary key,
  `user_id` varchar(36) not null,
  `subscription_id` varchar(255) not null,
  `plan` varchar(255) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  foreign key (`user_id`) references `user`(`id`) on delete cascade
);

create index `user_subscriptions_user_id_idx` on `user_subscriptions` (`user_id`);
create index `user_subscriptions_subscription_id_idx` on `user_subscriptions` (`subscription_id`);
create index `user_subscriptions_user_updated_idx` on `user_subscriptions` (`user_id`, `updated_at`);