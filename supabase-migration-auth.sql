-- Run this in the Supabase SQL Editor AFTER the first migration

-- Approved email domains — only these can self-register
create table if not exists approved_domains (
  id uuid default gen_random_uuid() primary key,
  domain text not null unique,           -- e.g. 'acmebroker.com'
  company_name text,                     -- e.g. 'Acme Brokerage'
  created_at timestamptz default now()
);

-- Access requests — leads captured from non-approved domains
create table if not exists access_requests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  company text,
  role text,
  status text default 'pending',         -- pending | approved | rejected
  created_at timestamptz default now()
);

create index if not exists idx_access_requests_status on access_requests(status);

-- Seed Jupiter Tech as the first approved domain
insert into approved_domains (domain, company_name)
values ('jupitertech.io', 'Jupiter Tech')
on conflict (domain) do nothing;
