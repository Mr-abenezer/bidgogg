/**
 * BID X — TypeScript Type Definitions
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  language_code: string;
  is_admin: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  telegram_id: number;
  coin_balance: number;
  reserved_balance: number;
  total_earned: number;
  total_spent: number;
  today_earned: number;
  last_earned_date: string;
  updated_at: string;
}

export type TransactionType =
  | 'ad_reward'
  | 'task_reward'
  | 'bid_payment'
  | 'bid_winnings'
  | 'platform_fee'
  | 'campaign_deposit'
  | 'campaign_spending'
  | 'campaign_refund'
  | 'withdrawal'
  | 'withdrawal_refund'
  | 'admin_adjustment';

export interface Transaction {
  id: string;
  user_id: string;
  telegram_id: number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  destination_url: string;
  reward: number;
  required_time_seconds: number;
  completion_limit: number;
  completions_count: number;
  is_active: boolean;
  created_at: string;
  already_completed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  reward: number;
  link: string;
  proof_type: 'none' | 'screenshot' | 'text' | 'channel_check';
  completion_limit: number;
  completions_count: number;
  deadline?: string;
  is_active: boolean;
  created_at: string;
  user_submission?: TaskSubmission | null;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  telegram_id: number;
  user_username?: string;
  proof_text?: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reward_amount: number;
  created_at: string;
  reviewed_at?: string;
  task_title?: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  telegram_id: number;
  title: string;
  description: string;
  image_url?: string;
  destination_url: string;
  budget: number;
  remaining_budget: number;
  cost_per_click: number;
  clicks_count: number;
  max_clicks: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'rejected' | 'refunded';
  created_at: string;
  updated_at: string;
  creator_username?: string;
}

export interface BidRound {
  id: string;
  round_number: number;
  bid_cost: number;
  total_pool: number;
  winner_percentage: number;
  platform_percentage: number;
  last_bidder_id: number | null;
  last_bidder_username: string | null;
  last_bidder_name: string | null;
  last_bidder_photo: string | null;
  last_bid_at: string | null;
  timer_seconds: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  winner_id: number | null;
  winner_amount: number;
  platform_amount: number;
  started_at: string;
  ended_at?: string;
  seconds_left?: number;
}

export interface Bid {
  id: string;
  round_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  bid_amount: number;
  pool_after: number;
  bid_time: string;
}

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface Withdrawal {
  id: string;
  user_id: string;
  telegram_id: number;
  username: string | null;
  coin_amount: number;
  usdt_rate: number;
  usdt_amount: number;
  crypto_network: string;
  wallet_address: string;
  status: WithdrawalStatus;
  tx_hash?: string;
  rejection_reason?: string;
  created_at: string;
  processed_at?: string;
}

export interface Notification {
  id: string;
  telegram_id: number;
  title: string;
  message: string;
  type: 'info' | 'reward' | 'outbid' | 'win' | 'withdrawal' | 'campaign' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  ad_reward: number;
  task_reward: number;
  click_price: number;
  min_campaign_budget: number;
  bid_amount: number;
  bid_timer_seconds: number;
  winner_percentage: number;
  platform_percentage: number;
  coin_to_usdt_rate: number;
  min_withdrawal_coins: number;
  maintenance_mode: boolean;
  updated_at: string;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  total_coins_issued: number;
  total_coins_spent: number;
  total_ad_earnings: number;
  total_task_activity: number;
  total_campaign_clicks: number;
  total_campaign_spending: number;
  total_bid_volume: number;
  total_platform_fees: number;
  total_withdrawals_count: number;
  total_withdrawals_coins: number;
  pending_withdrawals_count: number;
  pending_withdrawals_coins: number;
  completed_withdrawals_count: number;
  completed_withdrawals_coins: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
