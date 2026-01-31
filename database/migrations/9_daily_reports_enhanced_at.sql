-- When the report content was enhanced with AI (user saved the enhanced version)
alter table `daily_reports`
  add column `enhanced_at` datetime null
    comment 'Set when user saved AI-enhanced content';
