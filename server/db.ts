/**
 * BID X — Server Data Store & Supabase Integration
 * Implements atomic balance operations, ledger transactions, and fault-tolerant storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Wallet,
  Transaction,
  Advertisement,
  Task,
  TaskSubmission,
  Campaign,
  Withdrawal,
  Notification,
  PlatformSettings,
  AdminAnalytics,
  TelegramUser,
} from '../src/types';
import { botNotify } from './botNotifier';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iybyohxhueyzxuzqphjv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YnlvaHhodWV5enh1enFwaGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNjAzMywiZXhwIjoyMTAyMjgyMDMzfQ.gwPGcwG_FrdTyfIDEPMUyQVdrmLEulBR1yiu5BkCmCE';
const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || '7734124559');

let supabase: SupabaseClient | null = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
} catch (e) {
  console.warn('Supabase client init warning:', e);
}

// In-Memory Storage Engine
const memory = {
  users: new Map<number, User>(),
  wallets: new Map<number, Wallet>(),
  transactions: [] as Transaction[],
  advertisements: [] as Advertisement[],
  adCompletions: new Map<string, { telegramId: number; adId: string; date: string }>(),
  adSessions: new Map<string, { telegramId: number; adId: string; startTime: number; requiredTime: number }>(),
  tasks: [] as Task[],
  taskSubmissions: [] as TaskSubmission[],
  campaigns: [] as Campaign[],
  campaignClicks: new Set<string>(), // campaignId + telegramId
  withdrawals: [] as Withdrawal[],
  notifications: [] as Notification[],
  adminActions: [] as any[],
  settings: {
    id: 1,
    ad_reward: 5.0,
    task_reward: 5.0,
    click_price: 5.0,
    min_campaign_budget: 50.0,
    bid_amount: 10.0,
    bid_timer_seconds: 60,
    winner_percentage: 85,
    platform_percentage: 15,
    coin_to_usdt_rate: 0.0006,
    min_withdrawal_coins: 300.0,
    maintenance_mode: false,
    updated_at: new Date().toISOString(),
  } as PlatformSettings,
};

// Seed default sample advertisements and tasks for immediate working app
function seedInitialData() {
  if (memory.advertisements.length === 0) {
    memory.advertisements = [
      {
        id: 'ad-1',
        title: 'Telegram Premium Giveaway',
        description: 'Explore the latest crypto ecosystem and earn free TON & Telegram gifts.',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        destination_url: 'https://t.me/telegram',
        reward: 5.0,
        required_time_seconds: 15,
        completion_limit: 5000,
        completions_count: 342,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ad-2',
        title: 'Decentralized Exchange Launch',
        description: 'Trade top tokens with zero slippage and instant execution on TON blockchain.',
        image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
        destination_url: 'https://ton.org',
        reward: 5.0,
        required_time_seconds: 15,
        completion_limit: 3000,
        completions_count: 189,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ad-3',
        title: 'Web3 AI Trading Bot',
        description: 'Automate your crypto portfolio with real-time AI market signals.',
        image_url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&auto=format&fit=crop&q=80',
        destination_url: 'https://telegram.org',
        reward: 5.0,
        required_time_seconds: 20,
        completion_limit: 2000,
        completions_count: 76,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  if (memory.tasks.length === 0) {
    memory.tasks = [
      {
        id: 'task-1',
        title: 'Join Bid X Official Channel',
        description: 'Subscribe to our official Telegram channel for daily announcements, promo codes and game tips.',
        instructions: '1. Click the link to open the channel.\n2. Join the channel.\n3. Enter your Telegram username below to verify.',
        reward: 5.0,
        link: 'https://t.me/BidX_SmartEarningsbot',
        proof_type: 'text',
        completion_limit: 10000,
        completions_count: 1250,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        title: 'Follow Community Chat',
        description: 'Join the community discussion and chat with fellow bidders.',
        instructions: '1. Join the community chat group.\n2. Send a greeting message.\n3. Submit a screenshot or your username as proof.',
        reward: 5.0,
        link: 'https://t.me/BidX_SmartEarningsbot',
        proof_type: 'screenshot',
        completion_limit: 5000,
        completions_count: 640,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'task-3',
        title: 'Share Bid X with 3 Friends',
        description: 'Spread the word about Bid X to your Telegram contacts or groups.',
        instructions: '1. Forward the Bid X bot link to 3 friends.\n2. Submit screenshot proof of your shares.',
        reward: 10.0,
        link: 'http://t.me/BidX_SmartEarningsbot/Earn',
        proof_type: 'screenshot',
        completion_limit: 2500,
        completions_count: 180,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  // Pre-seed Admin account if not existing
  if (!memory.users.has(ADMIN_TELEGRAM_ID)) {
    const adminUser: User = {
      id: 'usr-admin-' + ADMIN_TELEGRAM_ID,
      telegram_id: ADMIN_TELEGRAM_ID,
      username: 'bidx_admin',
      first_name: 'Admin',
      last_name: 'Master',
      photo_url: null,
      language_code: 'en',
      is_admin: true,
      is_banned: false,
      is_suspended: false,
      created_at: new Date().toISOString(),
    };
    memory.users.set(ADMIN_TELEGRAM_ID, adminUser);
    memory.wallets.set(ADMIN_TELEGRAM_ID, {
      id: 'wal-admin-' + ADMIN_TELEGRAM_ID,
      user_id: adminUser.id,
      telegram_id: ADMIN_TELEGRAM_ID,
      coin_balance: 5000.0,
      reserved_balance: 0.0,
      total_earned: 5000.0,
      total_spent: 0.0,
      today_earned: 0.0,
      last_earned_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    });
  }
}

seedInitialData();

export const db = {
  // 1. AUTH & USER MANAGEMENT
  async getOrCreateUser(tgUser: TelegramUser): Promise<{ user: User; wallet: Wallet; isNew: boolean }> {
    const telegramId = tgUser.id;
    let user = memory.users.get(telegramId);
    let isNew = false;

    const isAdmin = telegramId === ADMIN_TELEGRAM_ID;

    if (!user) {
      isNew = true;
      user = {
        id: 'usr-' + telegramId + '-' + Date.now().toString(36),
        telegram_id: telegramId,
        username: tgUser.username || null,
        first_name: tgUser.first_name || 'User',
        last_name: tgUser.last_name || null,
        photo_url: tgUser.photo_url || null,
        language_code: tgUser.language_code || 'en',
        is_admin: isAdmin,
        is_banned: false,
        is_suspended: false,
        created_at: new Date().toISOString(),
      };
      memory.users.set(telegramId, user);

      // Create initial wallet
      const wallet: Wallet = {
        id: 'wal-' + telegramId,
        user_id: user.id,
        telegram_id: telegramId,
        coin_balance: 10.0, // 10 welcome Coins
        reserved_balance: 0.0,
        total_earned: 10.0,
        total_spent: 0.0,
        today_earned: 10.0,
        last_earned_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      };
      memory.wallets.set(telegramId, wallet);

      // Record welcome transaction
      const welcomeTx: Transaction = {
        id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        user_id: user.id,
        telegram_id: telegramId,
        type: 'ad_reward',
        amount: 10.0,
        balance_after: 10.0,
        description: 'Welcome Bonus for joining Bid X',
        created_at: new Date().toISOString(),
      };
      memory.transactions.unshift(welcomeTx);

      // Add welcome notification
      memory.notifications.unshift({
        id: 'notif-' + Date.now(),
        telegram_id: telegramId,
        title: 'Welcome to Bid X!',
        message: 'You received 10 Coins welcome bonus! Start earning by watching ads or playing Bid & Win.',
        type: 'reward',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      // Send telegram bot notification if available
      botNotify.welcome(telegramId, tgUser.first_name);
    } else {
      // Update profile info if changed
      user.username = tgUser.username || user.username;
      user.first_name = tgUser.first_name || user.first_name;
      user.last_name = tgUser.last_name || user.last_name;
      user.photo_url = tgUser.photo_url || user.photo_url;
      user.is_admin = isAdmin;
      memory.users.set(telegramId, user);
    }

    const wallet = memory.wallets.get(telegramId)!;
    return { user, wallet, isNew };
  },

  async getUser(telegramId: number): Promise<User | null> {
    return memory.users.get(telegramId) || null;
  },

  async getWallet(telegramId: number): Promise<Wallet | null> {
    return memory.wallets.get(telegramId) || null;
  },

  // 2. ATOMIC WALLET & LEDGER OPERATIONS
  async creditCoins(
    telegramId: number,
    amount: number,
    type: Transaction['type'],
    description: string,
    referenceId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (amount <= 0) return { success: false, newBalance: 0, error: 'Amount must be greater than 0' };

    const wallet = memory.wallets.get(telegramId);
    const user = memory.users.get(telegramId);
    if (!wallet || !user) return { success: false, newBalance: 0, error: 'User wallet not found' };

    const todayStr = new Date().toISOString().split('T')[0];
    if (wallet.last_earned_date !== todayStr) {
      wallet.today_earned = 0;
      wallet.last_earned_date = todayStr;
    }

    wallet.coin_balance = Number((wallet.coin_balance + amount).toFixed(2));
    wallet.total_earned = Number((wallet.total_earned + amount).toFixed(2));
    wallet.today_earned = Number((wallet.today_earned + amount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const tx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      user_id: user.id,
      telegram_id: telegramId,
      type,
      amount: Number(amount.toFixed(2)),
      balance_after: wallet.coin_balance,
      description,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    memory.transactions.unshift(tx);
    return { success: true, newBalance: wallet.coin_balance };
  },

  async debitCoins(
    telegramId: number,
    amount: number,
    type: Transaction['type'],
    description: string,
    referenceId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (amount <= 0) return { success: false, newBalance: 0, error: 'Amount must be greater than 0' };

    const wallet = memory.wallets.get(telegramId);
    const user = memory.users.get(telegramId);
    if (!wallet || !user) return { success: false, newBalance: 0, error: 'User wallet not found' };

    if (wallet.coin_balance < amount) {
      return { success: false, newBalance: wallet.coin_balance, error: 'Insufficient Coin balance' };
    }

    wallet.coin_balance = Number((wallet.coin_balance - amount).toFixed(2));
    wallet.total_spent = Number((wallet.total_spent + amount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const tx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      user_id: user.id,
      telegram_id: telegramId,
      type,
      amount: -Number(amount.toFixed(2)),
      balance_after: wallet.coin_balance,
      description,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    memory.transactions.unshift(tx);
    return { success: true, newBalance: wallet.coin_balance };
  },

  async reserveCoins(
    telegramId: number,
    amount: number,
    type: Transaction['type'],
    description: string,
    referenceId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (amount <= 0) return { success: false, newBalance: 0, error: 'Amount must be greater than 0' };

    const wallet = memory.wallets.get(telegramId);
    const user = memory.users.get(telegramId);
    if (!wallet || !user) return { success: false, newBalance: 0, error: 'User wallet not found' };

    if (wallet.coin_balance < amount) {
      return { success: false, newBalance: wallet.coin_balance, error: 'Insufficient Coin balance' };
    }

    wallet.coin_balance = Number((wallet.coin_balance - amount).toFixed(2));
    wallet.reserved_balance = Number((wallet.reserved_balance + amount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const tx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      user_id: user.id,
      telegram_id: telegramId,
      type,
      amount: -Number(amount.toFixed(2)),
      balance_after: wallet.coin_balance,
      description,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    memory.transactions.unshift(tx);
    return { success: true, newBalance: wallet.coin_balance };
  },

  async refundReservedCoins(
    telegramId: number,
    amount: number,
    type: Transaction['type'],
    description: string,
    referenceId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const wallet = memory.wallets.get(telegramId);
    const user = memory.users.get(telegramId);
    if (!wallet || !user) return { success: false, newBalance: 0, error: 'User wallet not found' };

    const actualRefund = Math.min(wallet.reserved_balance, amount);
    wallet.reserved_balance = Number(Math.max(0, wallet.reserved_balance - actualRefund).toFixed(2));
    wallet.coin_balance = Number((wallet.coin_balance + actualRefund).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const tx: Transaction = {
      id: 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      user_id: user.id,
      telegram_id: telegramId,
      type,
      amount: Number(actualRefund.toFixed(2)),
      balance_after: wallet.coin_balance,
      description,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };

    memory.transactions.unshift(tx);
    return { success: true, newBalance: wallet.coin_balance };
  },

  async getTransactions(telegramId: number, limit = 50): Promise<Transaction[]> {
    return memory.transactions
      .filter((t) => t.telegram_id === telegramId)
      .slice(0, limit);
  },

  // 3. ADVERTISEMENTS & EARNING
  async getAds(telegramId: number): Promise<Advertisement[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    return memory.advertisements
      .filter((a) => a.is_active)
      .map((ad) => {
        const completed = memory.adCompletions.has(`${ad.id}:${telegramId}:${todayStr}`);
        return {
          ...ad,
          already_completed: completed,
        };
      });
  },

  async startAdSession(telegramId: number, adId: string): Promise<{ sessionToken: string; requiredTime: number } | null> {
    const ad = memory.advertisements.find((a) => a.id === adId && a.is_active);
    if (!ad) return null;

    const token = 'adses_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    memory.adSessions.set(token, {
      telegramId,
      adId,
      startTime: Date.now(),
      requiredTime: ad.required_time_seconds,
    });

    return { sessionToken: token, requiredTime: ad.required_time_seconds };
  },

  async claimAdReward(telegramId: number, adId: string, sessionToken: string): Promise<{ success: boolean; reward: number; newBalance: number; error?: string }> {
    const session = memory.adSessions.get(sessionToken);
    if (!session || session.telegramId !== telegramId || session.adId !== adId) {
      return { success: false, reward: 0, newBalance: 0, error: 'Invalid or expired ad verification session' };
    }

    const elapsedSeconds = (Date.now() - session.startTime) / 1000;
    // Allow small 1.5s client-server latency leeway
    if (elapsedSeconds < session.requiredTime - 1.5) {
      return { success: false, reward: 0, newBalance: 0, error: 'Ad viewing time requirement not met. Please complete the timer.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const key = `${adId}:${telegramId}:${todayStr}`;
    if (memory.adCompletions.has(key)) {
      return { success: false, reward: 0, newBalance: 0, error: 'You have already claimed this ad reward today' };
    }

    const ad = memory.advertisements.find((a) => a.id === adId);
    if (!ad) {
      return { success: false, reward: 0, newBalance: 0, error: 'Advertisement not found' };
    }

    // Clean up session
    memory.adSessions.delete(sessionToken);
    memory.adCompletions.set(key, { telegramId, adId, date: todayStr });
    ad.completions_count += 1;

    // Credit reward
    const reward = ad.reward || memory.settings.ad_reward;
    const credit = await this.creditCoins(
      telegramId,
      reward,
      'ad_reward',
      `Completed Ad: ${ad.title}`,
      ad.id
    );

    if (credit.success) {
      memory.notifications.unshift({
        id: 'notif-' + Date.now(),
        telegram_id: telegramId,
        title: 'Ad Reward Credited',
        message: `You earned +${reward} Coins for watching "${ad.title}"!`,
        type: 'reward',
        is_read: false,
        created_at: new Date().toISOString(),
      });
      botNotify.rewardEarned(telegramId, reward, `ad "${ad.title}"`);
    }

    return {
      success: credit.success,
      reward,
      newBalance: credit.newBalance,
      error: credit.error,
    };
  },

  // 4. TASKS & SUBMISSIONS
  async getTasks(telegramId: number): Promise<Task[]> {
    return memory.tasks.map((task) => {
      const submission = memory.taskSubmissions.find((s) => s.task_id === task.id && s.telegram_id === telegramId);
      return {
        ...task,
        user_submission: submission || null,
      };
    });
  },

  async submitTask(
    telegramId: number,
    username: string | undefined,
    taskId: string,
    proofText?: string,
    proofUrl?: string
  ): Promise<{ success: boolean; submission?: TaskSubmission; error?: string }> {
    const task = memory.tasks.find((t) => t.id === taskId && t.is_active);
    if (!task) return { success: false, error: 'Task not found or is inactive' };

    const existing = memory.taskSubmissions.find((s) => s.task_id === taskId && s.telegram_id === telegramId);
    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'You have already completed this task and received your reward' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'Your proof submission for this task is already under review' };
      }
    }

    // Auto-approve tasks with no proof required, or queue for review
    const isAutoApproved = task.proof_type === 'none';

    const submission: TaskSubmission = {
      id: 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      task_id: taskId,
      telegram_id: telegramId,
      user_username: username,
      proof_text: proofText,
      proof_url: proofUrl,
      status: isAutoApproved ? 'approved' : 'pending',
      reward_amount: task.reward,
      created_at: new Date().toISOString(),
      reviewed_at: isAutoApproved ? new Date().toISOString() : undefined,
      task_title: task.title,
    };

    memory.taskSubmissions.unshift(submission);

    if (isAutoApproved) {
      task.completions_count += 1;
      await this.creditCoins(telegramId, task.reward, 'task_reward', `Completed Task: ${task.title}`, task.id);
      botNotify.rewardEarned(telegramId, task.reward, `task "${task.title}"`);
    }

    return { success: true, submission };
  },

  async getTaskSubmissions(status = 'pending'): Promise<TaskSubmission[]> {
    return memory.taskSubmissions.filter((s) => (status === 'all' ? true : s.status === status));
  },

  async reviewTaskSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const sub = memory.taskSubmissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, error: 'Submission not found' };

    if (sub.status !== 'pending') {
      return { success: false, error: `Submission has already been ${sub.status}` };
    }

    sub.status = status;
    sub.admin_notes = adminNotes;
    sub.reviewed_at = new Date().toISOString();

    const task = memory.tasks.find((t) => t.id === sub.task_id);

    if (status === 'approved') {
      if (task) task.completions_count += 1;
      await this.creditCoins(
        sub.telegram_id,
        sub.reward_amount,
        'task_reward',
        `Approved Task: ${task?.title || 'Task'}`,
        sub.task_id
      );

      memory.notifications.unshift({
        id: 'notif-' + Date.now(),
        telegram_id: sub.telegram_id,
        title: 'Task Submission Approved!',
        message: `Your submission for "${task?.title}" was approved. +${sub.reward_amount} Coins credited!`,
        type: 'reward',
        is_read: false,
        created_at: new Date().toISOString(),
      });
      botNotify.rewardEarned(sub.telegram_id, sub.reward_amount, `task "${task?.title}"`);
    } else {
      memory.notifications.unshift({
        id: 'notif-' + Date.now(),
        telegram_id: sub.telegram_id,
        title: 'Task Submission Rejected',
        message: `Your submission for "${task?.title}" was rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return { success: true };
  },

  // 5. USER CAMPAIGNS (POST ADVERTISEMENTS)
  async getCampaigns(telegramId?: number): Promise<{ activeCampaigns: Campaign[]; myCampaigns: Campaign[] }> {
    const activeCampaigns = memory.campaigns.filter((c) => c.status === 'active' && c.remaining_budget >= c.cost_per_click);
    const myCampaigns = telegramId ? memory.campaigns.filter((c) => c.telegram_id === telegramId) : [];
    return { activeCampaigns, myCampaigns };
  },

  async createCampaign(
    telegramId: number,
    data: {
      title: string;
      description: string;
      image_url?: string;
      destination_url: string;
      budget: number;
      cost_per_click?: number;
    }
  ): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
    const minBudget = memory.settings.min_campaign_budget || 50;
    if (data.budget < minBudget) {
      return { success: false, error: `Minimum campaign budget is ${minBudget} Coins` };
    }

    const cpc = data.cost_per_click || memory.settings.click_price || 5.0;
    const maxClicks = Math.floor(data.budget / cpc);

    // Reserve budget from user's Coin wallet
    const reserve = await this.reserveCoins(
      telegramId,
      data.budget,
      'campaign_deposit',
      `Campaign Creation: ${data.title}`
    );

    if (!reserve.success) {
      return { success: false, error: reserve.error || 'Failed to reserve campaign budget' };
    }

    const user = memory.users.get(telegramId);

    const campaign: Campaign = {
      id: 'cmp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      user_id: user?.id || 'usr-' + telegramId,
      telegram_id: telegramId,
      title: data.title,
      description: data.description,
      image_url: data.image_url,
      destination_url: data.destination_url,
      budget: data.budget,
      remaining_budget: data.budget,
      cost_per_click: cpc,
      clicks_count: 0,
      max_clicks: maxClicks,
      status: 'pending', // Requires admin approval or auto-approved
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator_username: user?.username || undefined,
    };

    memory.campaigns.unshift(campaign);

    memory.notifications.unshift({
      id: 'notif-' + Date.now(),
      telegram_id: telegramId,
      title: 'Campaign Submitted',
      message: `Your campaign "${campaign.title}" is submitted with ${campaign.budget} Coins budget and is pending review.`,
      type: 'campaign',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return { success: true, campaign };
  },

  async trackCampaignClick(
    campaignId: string,
    telegramId: number,
    ipAddress?: string
  ): Promise<{ success: boolean; destinationUrl?: string; error?: string }> {
    const campaign = memory.campaigns.find((c) => c.id === campaignId);
    if (!campaign || campaign.status !== 'active') {
      return { success: false, error: 'Campaign is not active' };
    }

    if (campaign.remaining_budget < campaign.cost_per_click) {
      campaign.status = 'completed';
      return { success: false, error: 'Campaign budget exhausted' };
    }

    // Deduplicate rapid clicks from the same user on the same campaign
    const clickKey = `${campaignId}:${telegramId}`;
    if (memory.campaignClicks.has(clickKey)) {
      // Return destination without charging again
      return { success: true, destinationUrl: campaign.destination_url };
    }

    memory.campaignClicks.add(clickKey);
    campaign.clicks_count += 1;
    campaign.remaining_budget = Number((campaign.remaining_budget - campaign.cost_per_click).toFixed(2));

    // Deduct from reserved balance of creator
    const creatorWallet = memory.wallets.get(campaign.telegram_id);
    if (creatorWallet) {
      creatorWallet.reserved_balance = Number(Math.max(0, creatorWallet.reserved_balance - campaign.cost_per_click).toFixed(2));
      creatorWallet.total_spent = Number((creatorWallet.total_spent + campaign.cost_per_click).toFixed(2));
    }

    if (campaign.remaining_budget < campaign.cost_per_click || campaign.clicks_count >= campaign.max_clicks) {
      campaign.status = 'completed';
    }

    return { success: true, destinationUrl: campaign.destination_url };
  },

  async reviewCampaign(
    campaignId: string,
    status: 'active' | 'rejected' | 'paused' | 'completed' | 'refunded',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const campaign = memory.campaigns.find((c) => c.id === campaignId);
    if (!campaign) return { success: false, error: 'Campaign not found' };

    const oldStatus = campaign.status;
    campaign.status = status;
    campaign.updated_at = new Date().toISOString();

    if (status === 'active' && oldStatus === 'pending') {
      botNotify.campaignApproved(campaign.telegram_id, campaign.title);
    }

    if (status === 'rejected' || status === 'refunded') {
      if (campaign.remaining_budget > 0) {
        await this.refundReservedCoins(
          campaign.telegram_id,
          campaign.remaining_budget,
          'campaign_refund',
          `Refund for campaign: ${campaign.title}`
        );
        campaign.remaining_budget = 0;
      }
    }

    return { success: true };
  },

  // 6. WITHDRAWALS
  async getWithdrawals(telegramId?: number): Promise<Withdrawal[]> {
    if (telegramId) {
      return memory.withdrawals.filter((w) => w.telegram_id === telegramId);
    }
    return memory.withdrawals;
  },

  async createWithdrawal(
    telegramId: number,
    username: string | undefined,
    coinAmount: number,
    cryptoNetwork: string,
    walletAddress: string
  ): Promise<{ success: boolean; withdrawal?: Withdrawal; error?: string }> {
    const minCoins = memory.settings.min_withdrawal_coins || 300.0;
    if (coinAmount < minCoins) {
      return { success: false, error: `Minimum withdrawal is ${minCoins} Coins` };
    }

    if (!walletAddress || walletAddress.trim().length < 10) {
      return { success: false, error: 'Please provide a valid crypto wallet address' };
    }

    const rate = memory.settings.coin_to_usdt_rate || 0.0006;
    const usdtAmount = Number((coinAmount * rate).toFixed(4));

    // Reserve coins so user cannot double-spend
    const reserve = await this.reserveCoins(
      telegramId,
      coinAmount,
      'withdrawal',
      `Withdrawal Request (${coinAmount} Coins = ${usdtAmount} USDT to ${cryptoNetwork})`
    );

    if (!reserve.success) {
      return { success: false, error: reserve.error || 'Insufficient balance for withdrawal' };
    }

    const user = memory.users.get(telegramId);

    const withdrawal: Withdrawal = {
      id: 'wd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      user_id: user?.id || 'usr-' + telegramId,
      telegram_id: telegramId,
      username: username || user?.username || null,
      coin_amount: coinAmount,
      usdt_rate: rate,
      usdt_amount: usdtAmount,
      crypto_network: cryptoNetwork || 'USDT (BEP20)',
      wallet_address: walletAddress.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    memory.withdrawals.unshift(withdrawal);

    memory.notifications.unshift({
      id: 'notif-' + Date.now(),
      telegram_id: telegramId,
      title: 'Withdrawal Submitted',
      message: `Your request to withdraw ${coinAmount} Coins (${usdtAmount} USDT) is pending admin processing.`,
      type: 'withdrawal',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    botNotify.withdrawalStatus(telegramId, coinAmount, 'pending', `Equivalent: ${usdtAmount} USDT`);

    return { success: true, withdrawal };
  },

  async reviewWithdrawal(
    withdrawalId: string,
    status: Withdrawal['status'],
    txHash?: string,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const wd = memory.withdrawals.find((w) => w.id === withdrawalId);
    if (!wd) return { success: false, error: 'Withdrawal not found' };

    const oldStatus = wd.status;
    wd.status = status;
    wd.tx_hash = txHash || wd.tx_hash;
    wd.rejection_reason = rejectionReason || wd.rejection_reason;
    wd.processed_at = new Date().toISOString();

    const userWallet = memory.wallets.get(wd.telegram_id);

    if (status === 'completed' && oldStatus !== 'completed') {
      if (userWallet) {
        userWallet.reserved_balance = Number(Math.max(0, userWallet.reserved_balance - wd.coin_amount).toFixed(2));
        userWallet.total_spent = Number((userWallet.total_spent + wd.coin_amount).toFixed(2));
      }
      botNotify.withdrawalStatus(wd.telegram_id, wd.coin_amount, 'completed', txHash ? `TxHash: ${txHash}` : undefined);
    } else if (status === 'rejected' || status === 'cancelled') {
      // Refund reserved coins
      await this.refundReservedCoins(
        wd.telegram_id,
        wd.coin_amount,
        'withdrawal_refund',
        `Refund for rejected withdrawal #${wd.id}`
      );
      botNotify.withdrawalStatus(wd.telegram_id, wd.coin_amount, 'rejected', rejectionReason ? `Reason: ${rejectionReason}` : undefined);
    } else if (status === 'processing') {
      botNotify.withdrawalStatus(wd.telegram_id, wd.coin_amount, 'processing');
    }

    return { success: true };
  },

  // 7. NOTIFICATIONS
  async getNotifications(telegramId: number): Promise<Notification[]> {
    return memory.notifications.filter((n) => n.telegram_id === telegramId);
  },

  async markNotificationRead(telegramId: number, id?: string): Promise<{ count: number }> {
    let count = 0;
    memory.notifications.forEach((n) => {
      if (n.telegram_id === telegramId && (!id || n.id === id)) {
        if (!n.is_read) {
          n.is_read = true;
          count++;
        }
      }
    });
    return { count };
  },

  // 8. SETTINGS & ANALYTICS
  async getPlatformSettings(): Promise<PlatformSettings> {
    return memory.settings;
  },

  async updatePlatformSettings(updates: Partial<PlatformSettings>): Promise<PlatformSettings> {
    memory.settings = {
      ...memory.settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return memory.settings;
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const totalUsers = memory.users.size;
    const activeUsers = memory.users.size;
    const todayStr = new Date().toISOString().split('T')[0];
    let totalCoinsIssued = 0;
    let totalCoinsSpent = 0;
    let totalAdEarnings = 0;
    let totalTaskActivity = memory.taskSubmissions.length;
    let totalCampaignClicks = memory.campaignClicks.size;
    let totalCampaignSpending = 0;
    let totalBidVolume = 0;
    let totalPlatformFees = 0;

    memory.wallets.forEach((w) => {
      totalCoinsIssued += w.total_earned;
      totalCoinsSpent += w.total_spent;
    });

    memory.transactions.forEach((t) => {
      if (t.type === 'ad_reward') totalAdEarnings += t.amount;
      if (t.type === 'bid_payment') totalBidVolume += Math.abs(t.amount);
      if (t.type === 'platform_fee') totalPlatformFees += t.amount;
      if (t.type === 'campaign_deposit') totalCampaignSpending += Math.abs(t.amount);
    });

    const totalWithdrawalsCount = memory.withdrawals.length;
    const totalWithdrawalsCoins = memory.withdrawals.reduce((sum, w) => sum + w.coin_amount, 0);
    const pendingWithdrawalsCount = memory.withdrawals.filter((w) => w.status === 'pending').length;
    const pendingWithdrawalsCoins = memory.withdrawals
      .filter((w) => w.status === 'pending')
      .reduce((sum, w) => sum + w.coin_amount, 0);
    const completedWithdrawalsCount = memory.withdrawals.filter((w) => w.status === 'completed').length;
    const completedWithdrawalsCoins = memory.withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + w.coin_amount, 0);

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users_today: totalUsers,
      total_coins_issued: Number(totalCoinsIssued.toFixed(2)),
      total_coins_spent: Number(totalCoinsSpent.toFixed(2)),
      total_ad_earnings: Number(totalAdEarnings.toFixed(2)),
      total_task_activity: totalTaskActivity,
      total_campaign_clicks: totalCampaignClicks,
      total_campaign_spending: Number(totalCampaignSpending.toFixed(2)),
      total_bid_volume: Number(totalBidVolume.toFixed(2)),
      total_platform_fees: Number(totalPlatformFees.toFixed(2)),
      total_withdrawals_count: totalWithdrawalsCount,
      total_withdrawals_coins: Number(totalWithdrawalsCoins.toFixed(2)),
      pending_withdrawals_count: pendingWithdrawalsCount,
      pending_withdrawals_coins: Number(pendingWithdrawalsCoins.toFixed(2)),
      completed_withdrawals_count: completedWithdrawalsCount,
      completed_withdrawals_coins: Number(completedWithdrawalsCoins.toFixed(2)),
    };
  },

  async getAllUsers(search = '', page = 1, limit = 50): Promise<{ users: (User & { wallet: Wallet })[]; total: number }> {
    const list: (User & { wallet: Wallet })[] = [];
    memory.users.forEach((u) => {
      const w = memory.wallets.get(u.telegram_id)!;
      if (
        !search ||
        u.telegram_id.toString().includes(search) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
        (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase()))
      ) {
        list.push({ ...u, wallet: w });
      }
    });

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { users: paginated, total };
  },

  async toggleBanUser(telegramId: number, isBanned: boolean): Promise<boolean> {
    const user = memory.users.get(telegramId);
    if (!user) return false;
    user.is_banned = isBanned;
    return true;
  },
};
