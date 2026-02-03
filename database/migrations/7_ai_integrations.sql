-- AI integrations: base_url and optional model (OpenAI-compatible endpoints)
alter table `repository_integrations`
  add column `base_url` varchar(500) null,
  add column `model` varchar(100) null;
