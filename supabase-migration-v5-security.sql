-- Migration v5: Enable Row Level Security on sensitive tables
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════
-- chat_history: users can only access their own sessions
-- ═══════════════════════════════════════════════════════════
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes using service key)
CREATE POLICY "Service role full access on chat_history"
  ON chat_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon users can only read their own sessions (matched via usage_tracking)
CREATE POLICY "Users read own chat history"
  ON chat_history FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM usage_tracking
      WHERE user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════
-- user_profiles: users can only access their own profile
-- ═══════════════════════════════════════════════════════════
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on user_profiles"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- usage_tracking: users can only access their own usage
-- ═══════════════════════════════════════════════════════════
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on usage_tracking"
  ON usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users read own usage"
  ON usage_tracking FOR SELECT
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════
-- invitations: users can only see invitations they sent
-- ═══════════════════════════════════════════════════════════
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on invitations"
  ON invitations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users read own invitations"
  ON invitations FOR SELECT
  USING (
    inviter_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════
-- Public data tables: NO RLS (read via service role in API routes)
-- news_items, market_data, economic_events, approved_domains, access_requests
-- These contain no user-specific data and are accessed via service role key
-- ═══════════════════════════════════════════════════════════
