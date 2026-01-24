create table `checkout_sessions` (
  `id` int not null auto_increment primary key,
  `session_id` varchar(255) not null,
  `resource_id` varchar(255) not null,
  `status` varchar(255) not null default 'pending',
  `resource_type` varchar(255) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp
);