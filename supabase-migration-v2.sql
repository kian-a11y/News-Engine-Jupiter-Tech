-- Run this in the Supabase SQL Editor
-- V2: Open signup with consent tracking and invitations

-- User profiles with consent tracking
create table if not exists user_profiles (
  id uuid primary key,                        -- matches Supabase auth.users id
  email text not null unique,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  marketing_consent_ip text,
  onboarding_completed boolean not null default false,
  invited_by_email text,                       -- who referred them
  created_at timestamptz default now()
);

create index if not exists idx_user_profiles_email on user_profiles(email);

-- Invitations tracking
create table if not exists invitations (
  id uuid default gen_random_uuid() primary key,
  inviter_id uuid not null,
  inviter_email text not null,
  invitee_email text not null,
  sent_at timestamptz default now(),
  accepted_at timestamptz                      -- filled when invitee completes onboarding
);

create index if not exists idx_invitations_invitee on invitations(invitee_email);

-- Old tables can be dropped if desired (uncomment):
-- drop table if exists approved_domains;
-- drop table if exists access_requests;
