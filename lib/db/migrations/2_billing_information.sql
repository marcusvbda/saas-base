alter table `user_settings` 
  add column `card_number` varchar(19),
  add column `card_holder_name` varchar(255),
  add column `card_expiry_month` varchar(2),
  add column `card_expiry_year` varchar(4),
  add column `card_cvv` varchar(4);
