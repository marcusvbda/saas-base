-- Add project and branch filtering configuration to repository_integrations
alter table `repository_integrations` 
  add column `projects` json null comment 'Array of project IDs to include in reports',
  add column `ignored_branches` json null comment 'Array of branch names to ignore in reports';
