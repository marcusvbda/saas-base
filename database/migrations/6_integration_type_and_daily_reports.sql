-- Daily reports (one per user per day)
create table `daily_reports` (
  `id` int not null auto_increment primary key,
  `user_id` varchar(36) not null,
  `report_date` date not null,
  `content` text not null,
  `status` varchar(20) not null default 'ready' comment 'processing | ready | failed',
  `enhanced_at` datetime null comment 'Set when user saved AI-enhanced content',
  `created_at` datetime not null default current_timestamp,
  `updated_at` datetime not null default current_timestamp on update current_timestamp,
  unique key `daily_reports_user_date_uk` (`user_id`, `report_date`),
  foreign key (`user_id`) references `user`(`id`) on delete cascade
);

create index `daily_reports_user_id_idx` on `daily_reports` (`user_id`);
create index `daily_reports_user_date_idx` on `daily_reports` (`user_id`, `report_date` desc);
