/**
 * BID X — Frontend API Client
 * Automatically attaches Telegram init-data authorization headers
 */

import {
  User,
  Wallet,
  Transaction,
  Advertisement,
  Task,
  TaskSubmission,
  Campaign,
  BidRound,
  Bid,
  Withdrawal,
  Notification,
  PlatformSettings,
  AdminAnalytics,
  ApiResponse,
} from '../types';
import { getTelegramInitData } from './telegram';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const initData = getTelegramInitData();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Request failed (${response.status})`,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network communication error',
    };
  }
}

export const api = {
  // Auth & Profile
  async auth(): Promise<ApiResponse<{ user: User; wallet: Wallet; settings: PlatformSettings }>> {
    return fetchApi('/api/auth/telegram', { method: 'POST' });
  },

  async getMe(): Promise<ApiResponse<{ user: User; wallet: Wallet; unreadNotifications: number }>> {
    return fetchApi('/api/user/me');
  },

  async getSettings(): Promise<ApiResponse<PlatformSettings>> {
    return fetchApi('/api/settings');
  },

  // Earning - Ads
  async getAds(): Promise<ApiResponse<Advertisement[]>> {
    return fetchApi('/api/ads');
  },

  async startAd(adId: string): Promise<ApiResponse<{ sessionToken: string; requiredTime: number }>> {
    return fetchApi('/api/ads/start', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    });
  },

  async claimAd(adId: string, sessionToken: string): Promise<ApiResponse<{ reward: number; newBalance: number }>> {
    return fetchApi('/api/ads/claim', {
      method: 'POST',
      body: JSON.stringify({ adId, sessionToken }),
    });
  },

  async claimAdReward(adId: string, sessionToken: string): Promise<ApiResponse<{ reward: number; newBalance: number }>> {
    return this.claimAd(adId, sessionToken);
  },

  // Earning - Tasks
  async getTasks(): Promise<ApiResponse<Task[]>> {
    return fetchApi('/api/tasks');
  },

  async submitTask(taskId: string, proofText?: string, proofUrl?: string): Promise<ApiResponse<TaskSubmission>> {
    return fetchApi('/api/tasks/submit', {
      method: 'POST',
      body: JSON.stringify({ taskId, proofText, proofUrl }),
    });
  },

  // User Campaigns
  async getCampaigns(): Promise<ApiResponse<{ activeCampaigns: Campaign[]; myCampaigns: Campaign[] }>> {
    return fetchApi('/api/campaigns');
  },

  async getActiveCampaigns(): Promise<ApiResponse<Campaign[]>> {
    const res = await this.getCampaigns();
    if (res.success && res.data) {
      return { success: true, data: res.data.activeCampaigns };
    }
    return { success: false, error: res.error };
  },

  async getMyCampaigns(): Promise<ApiResponse<Campaign[]>> {
    const res = await this.getCampaigns();
    if (res.success && res.data) {
      return { success: true, data: res.data.myCampaigns };
    }
    return { success: false, error: res.error };
  },

  async createCampaign(data: {
    title: string;
    description: string;
    image_url?: string;
    destination_url: string;
    budget: number;
    cost_per_click?: number;
  }): Promise<ApiResponse<Campaign>> {
    return fetchApi('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async trackCampaignClick(campaignId: string): Promise<ApiResponse<{ destinationUrl: string }>> {
    return fetchApi('/api/campaigns/click', {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
    });
  },

  // Bid & Win
  async getBidRound(): Promise<ApiResponse<{ round: BidRound | null; bids: Bid[]; recentWinners: any[] }>> {
    return fetchApi('/api/bid-and-win/active');
  },

  async placeBid(roundId: string): Promise<ApiResponse<{ round: BidRound; balance: number }>> {
    return fetchApi('/api/bid-and-win/bid', {
      method: 'POST',
      body: JSON.stringify({ roundId }),
    });
  },

  // Wallet & Withdrawals
  async getTransactions(page = 1, limit = 50): Promise<ApiResponse<Transaction[]>> {
    return fetchApi(`/api/wallet/transactions?page=${page}&limit=${limit}`);
  },

  async getWithdrawals(): Promise<ApiResponse<Withdrawal[]>> {
    return fetchApi('/api/wallet/withdrawals');
  },

  async requestWithdrawal(data: {
    coinAmount: number;
    cryptoNetwork: string;
    walletAddress: string;
  }): Promise<ApiResponse<Withdrawal>> {
    return fetchApi('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return fetchApi('/api/notifications');
  },

  async markNotificationRead(id?: string): Promise<ApiResponse<{ count: number }>> {
    return fetchApi('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // Admin Endpoints
  admin: {
    async getAnalytics(): Promise<ApiResponse<AdminAnalytics>> {
      return fetchApi('/api/admin/analytics');
    },

    async getUsers(search = '', page = 1): Promise<ApiResponse<{ users: (User & { wallet: Wallet })[]; total: number }>> {
      return fetchApi(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}`);
    },

    async creditDebitUser(telegramId: number, amount: number, reason: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/users/balance', {
        method: 'POST',
        body: JSON.stringify({ telegramId, amount, reason }),
      });
    },

    async toggleBanUser(telegramId: number, isBanned: boolean): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/users/ban', {
        method: 'POST',
        body: JSON.stringify({ telegramId, isBanned }),
      });
    },

    // Ads
    async getAds(): Promise<ApiResponse<Advertisement[]>> {
      return fetchApi('/api/admin/ads');
    },
    async createAd(data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
      return fetchApi('/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateAd(id: string, data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
      return fetchApi(`/api/admin/ads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async deleteAd(id: string): Promise<ApiResponse<any>> {
      return fetchApi(`/api/admin/ads/${id}`, { method: 'DELETE' });
    },

    // Tasks & Submissions
    async getTasks(): Promise<ApiResponse<Task[]>> {
      return fetchApi('/api/admin/tasks');
    },
    async createTask(data: Partial<Task>): Promise<ApiResponse<Task>> {
      return fetchApi('/api/admin/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async updateTask(id: string, data: Partial<Task>): Promise<ApiResponse<Task>> {
      return fetchApi(`/api/admin/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    async deleteTask(id: string): Promise<ApiResponse<any>> {
      return fetchApi(`/api/admin/tasks/${id}`, { method: 'DELETE' });
    },
    async getTaskSubmissions(status = 'pending'): Promise<ApiResponse<TaskSubmission[]>> {
      return fetchApi(`/api/admin/task-submissions?status=${status}`);
    },
    async reviewTaskSubmission(submissionId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/task-submissions/review', {
        method: 'POST',
        body: JSON.stringify({ submissionId, status, adminNotes }),
      });
    },

    // Campaigns
    async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
      return fetchApi('/api/admin/campaigns');
    },
    async reviewCampaign(campaignId: string, status: string, notes?: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/campaigns/review', {
        method: 'POST',
        body: JSON.stringify({ campaignId, status, notes }),
      });
    },
    async refundCampaign(campaignId: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/campaigns/refund', {
        method: 'POST',
        body: JSON.stringify({ campaignId }),
      });
    },

    // Bid & Win
    async getBidRounds(): Promise<ApiResponse<BidRound[]>> {
      return fetchApi('/api/admin/bid-rounds');
    },
    async createBidRound(data: { bid_cost: number; timer_seconds: number; winner_percentage: number; platform_percentage: number }): Promise<ApiResponse<BidRound>> {
      return fetchApi('/api/admin/bid-rounds', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async forceFinishBidRound(roundId: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/bid-rounds/finish', {
        method: 'POST',
        body: JSON.stringify({ roundId }),
      });
    },

    // Withdrawals
    async getWithdrawals(status = 'all'): Promise<ApiResponse<Withdrawal[]>> {
      return fetchApi(`/api/admin/withdrawals?status=${status}`);
    },
    async reviewWithdrawal(withdrawalId: string, status: string, txHash?: string, rejectionReason?: string): Promise<ApiResponse<any>> {
      return fetchApi('/api/admin/withdrawals/review', {
        method: 'POST',
        body: JSON.stringify({ withdrawalId, status, txHash, rejectionReason }),
      });
    },

    // Settings
    async updateSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
      return fetchApi('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    },
  },
};
