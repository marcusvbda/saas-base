create table `checkout_sessions` (
  `id` int not null auto_increment primary key,
  `session_id` varchar(255) not null,
  `resource_id` varchar(255) not null,
  `status` varchar(255) not null default 'pending',
  `resource_type` varchar(255) not null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp
);

create unique index `checkout_sessions_session_id_idx` on `checkout_sessions` (`session_id`);
create index `checkout_sessions_resource_type_resource_id_idx` on `checkout_sessions` (`resource_type`, `resource_id`);
create index `checkout_sessions_created_at_idx` on `checkout_sessions` (`created_at`);