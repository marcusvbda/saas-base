create table `user_settings` (
  `id` int not null auto_increment primary key,
  `user_id` varchar(36) not null,
  `timezone` varchar(255),
  `plan` varchar(50) not null default 'free',
  foreign key (`user_id`) references `user`(`id`) on delete cascade
);

create index `user_settings_user_id_idx` on `user_settings` (`user_id`);