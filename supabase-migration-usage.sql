-- Usage tracking table for daily output limits
-- Run this in Supabase SQL Editor

create table if not exists usage_tracking (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  session_id text not null,
  created_at timestamptz default now()
);

-- Index for fast daily count queries
create index if not exists idx_usage_tracking_email_date
  on usage_tracking(user_email, created_at);

-- Auto-cleanup: delete records older than 7 days (we only need today's count)
-- Run this as a Supabase cron or pg_cron job if desired:
-- SELECT cron.schedule('cleanup-usage', '0 3 * * *', $$DELETE FROM usage_tracking WHERE created_at < now() - interval '7 days'$$);
