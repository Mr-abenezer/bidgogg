/**
 * BID X — Main Telegram Mini App Container
 * Production-ready architecture, real-time sync, and Telegram security
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Wallet,
  PlatformSettings,
  Advertisement,
  Task,
  Campaign,
  BidRound,
  Withdrawal,
  Transaction,
  Notification,
  TelegramUser,
} from './types';
import { api } from './lib/api';
import { isInsideTelegram, initTelegramApp, getActiveTelegramUser } from './lib/telegram';
import { NonTelegramScreen } from './components/NonTelegramScreen';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { EarnView } from './components/EarnView';
import { BidWinView } from './components/BidWinView';
import { CampaignsView } from './components/CampaignsView';
import { WalletView } from './components/WalletView';
import { AdminView } from './components/AdminView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [isTelegramEnv, setIsTelegramEnv] = useState<boolean>(true);
  const [devUserBypass, setDevUserBypass] = useState<TelegramUser | null>(null);

  // App Data State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({
    ad_reward: 5.0,
    task_reward: 10.0,
    click_price: 5.0,
    min_campaign_budget: 50.0,
    bid_amount: 10.0,
    bid_timer_seconds: 60,
    winner_percentage: 85,
    platform_percentage: 15,
    coin_to_usdt_rate: 0.0006,
    min_withdrawal_coins: 300,
    maintenance_mode: false,
  });

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [activeRound, setActiveRound] = useState<BidRound | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 1. Check Telegram environment on load
  useEffect(() => {
    const insideTg = isInsideTelegram();
    setIsTelegramEnv(insideTg);
    if (insideTg) {
      initTelegramApp();
    }
  }, []);

  // 2. Fetch all app state
  const loadAppData = useCallback(async () => {
    try {
      setError(null);

      // Authenticate / fetch profile & wallet
      const meRes = await api.getMe();
      if (!meRes.success || !meRes.data) {
        setError(meRes.error || 'Failed to authenticate with Telegram session');
        setIsLoading(false);
        return;
      }

      setUser(meRes.data.user);
      setWallet(meRes.data.wallet);

      // Fetch supplementary data in parallel
      const [
        settingsRes,
        adsRes,
        tasksRes,
        campRes,
        myCampRes,
        roundRes,
        wdRes,
        txRes,
        notifRes,
      ] = await Promise.allSettled([
        api.getSettings(),
        api.getAds(),
        api.getTasks(),
        api.getActiveCampaigns(),
        api.getMyCampaigns(),
        api.getBidRound(),
        api.getWithdrawals(),
        api.getTransactions(),
        api.getNotifications(),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.data) {
        setSettings(settingsRes.value.data);
      }
      if (adsRes.status === 'fulfilled' && adsRes.value.success && adsRes.value.data) {
        setAds(adsRes.value.data);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.success && tasksRes.value.data) {
        setTasks(tasksRes.value.data);
      }
      if (campRes.status === 'fulfilled' && campRes.value.success && campRes.value.data) {
        setActiveCampaigns(campRes.value.data);
      }
      if (myCampRes.status === 'fulfilled' && myCampRes.value.success && myCampRes.value.data) {
        setMyCampaigns(myCampRes.value.data);
      }
      if (roundRes.status === 'fulfilled' && roundRes.value.success && roundRes.value.data) {
        setActiveRound(roundRes.value.data.round);
      }
      if (wdRes.status === 'fulfilled' && wdRes.value.success && wdRes.value.data) {
        setWithdrawals(wdRes.value.data);
      }
      if (txRes.status === 'fulfilled' && txRes.value.success && txRes.value.data) {
        setTransactions(txRes.value.data);
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.success && notifRes.value.data) {
        setNotifications(notifRes.value.data);
        setUnreadNotificationsCount(notifRes.value.data.filter((n) => !n.is_read).length);
      }
    } catch (err: any) {
      setError(err.message || 'Network communication failure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTelegramEnv || devUserBypass) {
      loadAppData();
    } else {
      setIsLoading(false);
    }
  }, [isTelegramEnv, devUserBypass, loadAppData]);

  // Handle Non-Telegram screen
  if (!isTelegramEnv && !devUserBypass) {
    return (
      <NonTelegramScreen
        onBypass={(devUser) => {
          setDevUserBypass(devUser);
          setIsLoading(true);
        }}
      />
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col items-center justify-center p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F27D26] to-[#FF4E00] flex items-center justify-center shadow-[0_0_25px_rgba(242,125,38,0.4)] animate-pulse relative z-10">
          <span className="text-2xl font-black text-black font-mono">X</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#F27D26] relative z-10">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Authenticating Telegram WebApp...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !user || !wallet) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4 relative z-10">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold mb-2 text-white relative z-10">Connection Error</h2>
        <p className="text-xs text-white/50 max-w-sm mb-6 leading-relaxed relative z-10">
          {error || 'Unable to establish secure session with Bid X servers.'}
        </p>
        <button
          onClick={() => {
            setIsLoading(true);
            loadAppData();
          }}
          className="px-6 py-2.5 rounded-xl neon-bg-orange text-black font-black text-xs uppercase tracking-tight active:scale-95 transition-all relative z-10"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F0F0F0] font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Top Header */}
      <Header
        user={user}
        wallet={wallet}
        settings={settings}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenWallet={() => setActiveTab('wallet')}
        onOpenAdmin={() => setActiveTab('admin')}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-4 pt-4 min-h-[calc(100vh-130px)]">
        {activeTab === 'home' && (
          <DashboardView
            user={user}
            wallet={wallet}
            settings={settings}
            activeRound={activeRound}
            recentTransactions={transactions}
            availableAdsCount={ads.filter((a) => !a.already_completed).length}
            availableTasksCount={tasks.length}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'earn' && (
          <EarnView
            ads={ads}
            tasks={tasks}
            onAdCompleted={(reward, newBal) => {
              setWallet((prev) => (prev ? { ...prev, coin_balance: newBal, today_earned: prev.today_earned + reward, total_earned: prev.total_earned + reward } : prev));
              loadAppData();
            }}
            onTaskSubmitted={() => {
              loadAppData();
            }}
          />
        )}

        {activeTab === 'bid' && (
          <BidWinView
            user={user}
            wallet={wallet}
            onBalanceUpdated={(newBal) => {
              setWallet((prev) => (prev ? { ...prev, coin_balance: newBal } : prev));
              loadAppData();
            }}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignsView
            user={user}
            wallet={wallet}
            settings={settings}
            activeCampaigns={activeCampaigns}
            myCampaigns={myCampaigns}
            onCampaignCreated={(camp) => {
              setMyCampaigns((prev) => [camp, ...prev]);
              loadAppData();
            }}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletView
            user={user}
            wallet={wallet}
            settings={settings}
            withdrawals={withdrawals}
            transactions={transactions}
            onWithdrawalRequested={(wd) => {
              setWithdrawals((prev) => [wd, ...prev]);
              loadAppData();
            }}
          />
        )}

        {activeTab === 'admin' && user.is_admin && (
          <AdminView onRefreshAll={loadAppData} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        isAdmin={Boolean(user.is_admin)}
      />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onRefresh={loadAppData}
      />
    </div>
  );
}
