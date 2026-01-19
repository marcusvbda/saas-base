create table `user_billing` (
  `id` int not null auto_increment primary key,
  `user_id` varchar(36) not null,
  `card_number` varchar(19),
  `card_holder_name` varchar(255),
  `card_expiry_month` varchar(2),
  `card_expiry_year` varchar(4),
  `card_cvv` varchar(4),
  `created_at` timestamp default current_timestamp,
  `updated_at` timestamp default current_timestamp on update current_timestamp,
  foreign key (`user_id`) references `user`(`id`) on delete cascade,
  unique key `user_billing_user_id_unique` (`user_id`)
);

create index `user_billing_user_id_idx` on `user_billing` (`user_id`);
