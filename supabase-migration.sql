-- Run this in the Supabase SQL Editor to create the required tables

create table if not exists news_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  url text,
  source_name text not null,
  published_at timestamptz,
  scraped_at timestamptz default now(),
  unique(url)
);

create index if not exists idx_news_published on news_items(published_at desc);

create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_chat_session on chat_history(session_id, created_at);
