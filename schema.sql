-- ==============================================================================
-- BID X — PRODUCTION DATABASE SCHEMA & MIGRATION SCRIPT FOR SUPABASE / POSTGRESQL
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language_code TEXT DEFAULT 'en',
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);

-- 2. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  telegram_id BIGINT UNIQUE NOT NULL,
  coin_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL CHECK (coin_balance >= 0),
  reserved_balance NUMERIC(14, 2) DEFAULT 0.00 NOT NULL CHECK (reserved_balance >= 0),
  total_earned NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  total_spent NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  today_earned NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  last_earned_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_telegram_id ON public.wallets(telegram_id);

-- 3. TRANSACTIONS / COIN LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'ad_reward',
    'task_reward',
    'bid_payment',
    'bid_winnings',
    'platform_fee',
    'campaign_deposit',
    'campaign_spending',
    'campaign_refund',
    'withdrawal',
    'withdrawal_refund',
    'admin_adjustment'
  )),
  amount NUMERIC(14, 2) NOT NULL,
  balance_after NUMERIC(14, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT, -- e.g. ad_id, task_id, round_id, withdrawal_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_telegram_id ON public.transactions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON public.transactions(created_at DESC);

-- 4. ADVERTISEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  destination_url TEXT NOT NULL,
  reward NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  required_time_seconds INT DEFAULT 15 NOT NULL,
  completion_limit INT DEFAULT 1000,
  completions_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AD COMPLETIONS (Anti-repeat validation)
CREATE TABLE IF NOT EXISTS public.ad_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  reward_amount NUMERIC(10, 2) NOT NULL,
  session_token TEXT UNIQUE,
  ip_address TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_ad_user_daily UNIQUE(ad_id, telegram_id, completed_at)
);

CREATE INDEX IF NOT EXISTS idx_ad_comp_user ON public.ad_completions(telegram_id, ad_id);

-- 6. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  reward NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  link TEXT NOT NULL,
  proof_type TEXT DEFAULT 'screenshot' CHECK (proof_type IN ('none', 'screenshot', 'text', 'channel_check')),
  completion_limit INT DEFAULT 500,
  completions_count INT DEFAULT 0,
  deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASK SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  user_username TEXT,
  proof_text TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reward_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_sub_user ON public.task_submissions(telegram_id, task_id);

-- 8. USER CAMPAIGNS (User Advertisements)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  destination_url TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 50.00),
  remaining_budget NUMERIC(12, 2) NOT NULL,
  cost_per_click NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  clicks_count INT DEFAULT 0,
  max_clicks INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CAMPAIGN CLICKS (Tracking & Fraud Protection)
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  ip_address TEXT,
  cost NUMERIC(10, 2) NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks ON public.campaign_clicks(campaign_id, telegram_id);

-- 10. BID & WIN ROUNDS
CREATE TABLE IF NOT EXISTS public.bid_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number SERIAL UNIQUE,
  bid_cost NUMERIC(10, 2) DEFAULT 10.00 NOT NULL,
  total_pool NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
  winner_percentage INT DEFAULT 85 NOT NULL,
  platform_percentage INT DEFAULT 15 NOT NULL,
  last_bidder_id BIGINT,
  last_bidder_username TEXT,
  last_bidder_name TEXT,
  last_bidder_photo TEXT,
  last_bid_at TIMESTAMPTZ,
  timer_seconds INT DEFAULT 60 NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_id BIGINT,
  winner_amount NUMERIC(14, 2) DEFAULT 0.00,
  platform_amount NUMERIC(14, 2) DEFAULT 0.00,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bid_rounds_status ON public.bid_rounds(status);

-- 11. BIDS TABLE
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.bid_rounds(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  bid_amount NUMERIC(10, 2) NOT NULL,
  pool_after NUMERIC(14, 2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_round ON public.bids(round_id, bid_time DESC);

-- 12. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT NOT NULL,
  username TEXT,
  coin_amount NUMERIC(12, 2) NOT NULL CHECK (coin_amount >= 300),
  usdt_rate NUMERIC(10, 6) NOT NULL,
  usdt_amount NUMERIC(12, 4) NOT NULL,
  crypto_network TEXT DEFAULT 'USDT (BEP20)' NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
  tx_hash TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(telegram_id);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'reward', 'outbid', 'win', 'withdrawal', 'campaign', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(telegram_id, created_at DESC);

-- 14. ADMIN ACTIONS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_telegram_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PLATFORM SETTINGS TABLE (Single row)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ad_reward NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  task_reward NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  click_price NUMERIC(10, 2) DEFAULT 5.00 NOT NULL,
  min_campaign_budget NUMERIC(10, 2) DEFAULT 50.00 NOT NULL,
  bid_amount NUMERIC(10, 2) DEFAULT 10.00 NOT NULL,
  bid_timer_seconds INT DEFAULT 60 NOT NULL,
  winner_percentage INT DEFAULT 85 NOT NULL,
  platform_percentage INT DEFAULT 15 NOT NULL,
  coin_to_usdt_rate NUMERIC(10, 6) DEFAULT 0.000600 NOT NULL,
  min_withdrawal_coins NUMERIC(10, 2) DEFAULT 300.00 NOT NULL,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Settings if not exists
INSERT INTO public.platform_settings (id, ad_reward, task_reward, click_price, min_campaign_budget, bid_amount, bid_timer_seconds, winner_percentage, platform_percentage, coin_to_usdt_rate, min_withdrawal_coins, maintenance_mode)
VALUES (1, 5.00, 5.00, 5.00, 50.00, 10.00, 60, 85, 15, 0.000600, 300.00, false)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read for settings, active ads, tasks, active bid rounds
CREATE POLICY "Public can read platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Public can read active ads" ON public.advertisements FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active tasks" ON public.tasks FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active bid rounds" ON public.bid_rounds FOR SELECT USING (true);
CREATE POLICY "Public can read bids" ON public.bids FOR SELECT USING (true);
