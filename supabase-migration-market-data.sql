-- Market data table for live instrument quotes
-- Run this in Supabase SQL Editor

create table if not exists market_data (
  id uuid default gen_random_uuid() primary key,
  symbol text not null unique,
  name text not null,
  category text not null default 'other',
  current_price decimal not null,
  daily_open decimal,
  daily_high decimal,
  daily_low decimal,
  daily_change_pct decimal,
  previous_close decimal,
  ma_50 decimal,
  ma_200 decimal,
  updated_at timestamptz default now()
);

create index if not exists idx_market_data_symbol on market_data(symbol);
create index if not exists idx_market_data_category on market_data(category);

-- Economic calendar table
create table if not exists economic_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  currency text,
  impact text,
  event_time timestamptz,
  forecast text,
  previous text,
  actual text,
  scraped_at timestamptz default now(),
  unique(event_name, event_time)
);

create index if not exists idx_events_time on economic_events(event_time);
create index if not exists idx_events_impact on economic_events(impact);
