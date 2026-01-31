-- Report status: processing (queued), ready (done), failed (error)
alter table `daily_reports`
  add column `status` varchar(20) not null default 'ready'
    comment 'processing | ready | failed';
