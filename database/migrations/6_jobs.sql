create table `jobs` (
  `id` int not null auto_increment primary key,
  `queue` varchar(255) not null default 'default',
  `action` varchar(255) not null,
  `payload` longtext not null, 
  `status` varchar(50) not null default 'pending',
  `error` longtext null,
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp
);

create index `jobs_action_idx` on `jobs` (`action`);
