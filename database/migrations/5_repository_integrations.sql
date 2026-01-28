create table `repository_integrations` (
  `id` int not null auto_increment primary key,
  `user_id` varchar(36) not null,
  `provider` varchar(50) not null,
  `token` text not null,
  `status` varchar(50) not null default 'pending',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  foreign key (`user_id`) references `user`(`id`) on delete cascade
);

create index `repository_integrations_user_id_idx` on `repository_integrations` (`user_id`);
create index `repository_integrations_user_provider_idx` on `repository_integrations` (`user_id`, `provider`);
