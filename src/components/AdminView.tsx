/**
 * BID X — Full Admin Command Center
 * Restricted to Telegram ID: 7734124559
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BarChart3,
  Zap,
  CheckSquare,
  Megaphone,
  Flame,
  Wallet as WalletIcon,
  Settings,
  Search,
  PlusCircle,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Coins,
  Send,
} from 'lucide-react';
import {
  AdminAnalytics,
  PlatformSettings,
  User,
  Wallet,
  TaskSubmission,
  Campaign,
  BidRound,
  Withdrawal,
  Advertisement,
  Task,
} from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  onRefreshAll: () => void;
}

type AdminSection =
  | 'analytics'
  | 'users'
  | 'tasks'
  | 'campaigns'
  | 'bid'
  | 'withdrawals'
  | 'settings';

export const AdminView: React.FC<Props> = ({ onRefreshAll }) => {
  const [section, setSection] = useState<AdminSection>('analytics');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({
    id: 1,
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
    updated_at: new Date().toISOString(),
  });
  const [users, setUsers] = useState<(User & { wallet: Wallet })[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bidRounds, setBidRounds] = useState<BidRound[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals / Dialogs
  const [balanceModal, setBalanceModal] = useState<{ user: User & { wallet: Wallet }; amount: string; reason: string } | null>(null);
  const [txHashModal, setTxHashModal] = useState<{ wd: Withdrawal; txHash: string } | null>(null);
  const [rejectWdModal, setRejectWdModal] = useState<{ wd: Withdrawal; reason: string } | null>(null);

  // Fetch data on section change
  const loadSectionData = async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      if (section === 'analytics') {
        const res = await api.admin.getAnalytics();
        if (res.success && res.data) setAnalytics(res.data);
      } else if (section === 'users') {
        const res = await api.admin.getUsers(userSearch);
        if (res.success && res.data) {
          setUsers(Array.isArray(res.data.users) ? res.data.users : []);
        }
      } else if (section === 'tasks') {
        const res = await api.admin.getTaskSubmissions('all');
        if (res.success && res.data) {
          setSubmissions(Array.isArray(res.data) ? res.data : []);
        }
      } else if (section === 'campaigns') {
        const res = await api.admin.getCampaigns();
        if (res.success && res.data) {
          setCampaigns(Array.isArray(res.data) ? res.data : []);
        }
      } else if (section === 'bid') {
        const res = await api.admin.getBidRounds();
        if (res.success && res.data) {
          setBidRounds(Array.isArray(res.data) ? res.data : []);
        }
      } else if (section === 'withdrawals') {
        const res = await api.admin.getWithdrawals('all');
        if (res.success && res.data) {
          setWithdrawals(Array.isArray(res.data) ? res.data : []);
        }
      } else if (section === 'settings') {
        const res = await api.getSettings();
        if (res.success && res.data) setSettings(res.data);
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message || 'Failed to load admin data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSectionData();
  }, [section]);

  // Handle User Balance Credit / Debit
  const handleAdjustBalance = async () => {
    if (!balanceModal) return;
    const amount = Number(balanceModal.amount);
    if (isNaN(amount) || amount === 0) {
      setActionMsg({ type: 'error', text: 'Enter a valid non-zero amount.' });
      return;
    }

    try {
      const res = await api.admin.creditDebitUser(balanceModal.user.telegram_id, amount, balanceModal.reason);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: `Adjusted balance for User #${balanceModal.user.telegram_id}` });
        setBalanceModal(null);
        loadSectionData();
        onRefreshAll();
      } else {
        setActionMsg({ type: 'error', text: res.error || 'Adjustment failed' });
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle User Ban Toggle
  const handleToggleBan = async (user: User & { wallet: Wallet }) => {
    try {
      const res = await api.admin.toggleBanUser(user.telegram_id, !user.is_banned);
      if (res.success) {
        haptic.medium();
        setActionMsg({ type: 'success', text: `User ${user.is_banned ? 'unbanned' : 'banned'}` });
        loadSectionData();
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle Task Review
  const handleReviewTask = async (submissionId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await api.admin.reviewTaskSubmission(submissionId, status);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: `Submission ${status}` });
        loadSectionData();
        onRefreshAll();
      } else {
        setActionMsg({ type: 'error', text: res.error || 'Review failed' });
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle Campaign Review
  const handleReviewCampaign = async (campaignId: string, status: string) => {
    try {
      const res = await api.admin.reviewCampaign(campaignId, status);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: `Campaign set to ${status}` });
        loadSectionData();
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle Force Finish Bid Round
  const handleForceFinishRound = async (roundId: string) => {
    try {
      const res = await api.admin.forceFinishBidRound(roundId);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: 'Round finalized and payout executed!' });
        loadSectionData();
        onRefreshAll();
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle Withdrawal Actions
  const handleWithdrawalAction = async (wdId: string, status: string, txHash?: string, reason?: string) => {
    try {
      const res = await api.admin.reviewWithdrawal(wdId, status, txHash, reason);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: `Withdrawal marked as ${status}` });
        setTxHashModal(null);
        setRejectWdModal(null);
        loadSectionData();
        onRefreshAll();
      } else {
        setActionMsg({ type: 'error', text: res.error || 'Failed' });
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await api.admin.updateSettings(settings);
      if (res.success) {
        haptic.success();
        setActionMsg({ type: 'success', text: 'Platform settings updated successfully!' });
        onRefreshAll();
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  const navItems = [
    { id: 'analytics' as AdminSection, label: 'Analytics', icon: BarChart3 },
    { id: 'users' as AdminSection, label: 'Users', icon: Users },
    { id: 'tasks' as AdminSection, label: 'Tasks Submissions', icon: CheckSquare },
    { id: 'campaigns' as AdminSection, label: 'Campaigns', icon: Megaphone },
    { id: 'bid' as AdminSection, label: 'Bid & Win', icon: Flame },
    { id: 'withdrawals' as AdminSection, label: 'Withdrawals', icon: WalletIcon },
    { id: 'settings' as AdminSection, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      {/* Admin Title Banner */}
      <div className="p-4 rounded-3xl glass-card border-[#F27D26]/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl neon-bg-orange text-black flex items-center justify-center font-black">
            <Shield className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#F0F0F0] tracking-tight">Admin Command Center</h2>
            <p className="text-[10px] text-[#F27D26] font-mono">Telegram ID: 7734124559 (Authorized)</p>
          </div>
        </div>

        <button
          onClick={loadSectionData}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Admin Horizontal Scrollable Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.selection();
                setSection(item.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'neon-bg-orange text-black font-black'
                  : 'glass-card border-white/10 text-white/50 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {actionMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 1. ANALYTICS SECTION */}
      {section === 'analytics' && analytics && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Total Users</div>
              <div className="text-2xl font-black text-[#F0F0F0]">{analytics.total_users}</div>
            </div>

            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Coins Issued</div>
              <div className="text-2xl font-black text-[#F27D26]">+{analytics.total_coins_issued}</div>
            </div>

            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Bid Volume</div>
              <div className="text-xl font-black text-red-400">{analytics.total_bid_volume} Coins</div>
            </div>

            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Platform Fees (15%)</div>
              <div className="text-xl font-black text-emerald-400">{analytics.total_platform_fees} Coins</div>
            </div>

            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Pending Withdrawals</div>
              <div className="text-xl font-black text-[#F27D26]">{analytics.pending_withdrawals_count} ({analytics.pending_withdrawals_coins} Coins)</div>
            </div>

            <div className="p-4 rounded-3xl glass-card border-white/10">
              <div className="text-[11px] font-sans font-semibold text-white/40 mb-1">Completed Withdrawals</div>
              <div className="text-xl font-black text-sky-400">{analytics.completed_withdrawals_count} ({analytics.completed_withdrawals_coins} Coins)</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS SECTION */}
      {section === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by Telegram ID or Username..."
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>
            <button
              onClick={() => loadSectionData()}
              className="px-4 py-2.5 rounded-xl neon-bg-orange text-black text-xs font-black uppercase"
            >
              Search
            </button>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="p-4 rounded-3xl glass-card border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                      {(u.first_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F0F0F0]">
                        {u.first_name} {u.username ? `(@${u.username})` : ''}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">TG ID: {u.telegram_id}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black font-mono text-[#F27D26]">
                      {u.wallet?.coin_balance ?? 0} Coins
                    </div>
                    {u.is_banned && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                        BANNED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() =>
                      setBalanceModal({
                        user: u,
                        amount: '100',
                        reason: 'Admin Bonus',
                      })
                    }
                    className="flex-1 py-1.5 rounded-lg bg-[#F27D26]/10 hover:bg-[#F27D26]/20 text-[#F27D26] text-xs font-bold border border-[#F27D26]/30"
                  >
                    Credit / Debit Coins
                  </button>

                  <button
                    onClick={() => handleToggleBan(u)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border ${
                      u.is_banned
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TASKS SUBMISSIONS SECTION */}
      {section === 'tasks' && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">No task submissions found.</div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className="p-4 rounded-3xl glass-card border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#F0F0F0]">{sub.task_title || 'Task'}</h4>
                    <div className="text-[11px] text-white/40">User ID: {sub.telegram_id} {sub.user_username ? `(@${sub.user_username})` : ''}</div>
                  </div>
                  <span className="text-xs font-mono font-black text-[#F27D26]">+{sub.reward_amount} Coins</span>
                </div>

                {sub.proof_text && (
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/70">
                    Proof: <span className="font-mono text-[#F27D26]">{sub.proof_text}</span>
                  </div>
                )}

                {sub.proof_url && (
                  <a
                    href={sub.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:underline block truncate"
                  >
                    View Proof Image / Link: {sub.proof_url}
                  </a>
                )}

                {sub.status === 'pending' ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleReviewTask(sub.id, 'approved')}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
                    >
                      Approve & Credit Reward
                    </button>
                    <button
                      onClick={() => handleReviewTask(sub.id, 'rejected')}
                      className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-[11px] font-bold uppercase text-white/40">
                    Status: <span className={sub.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}>{sub.status}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. CAMPAIGNS SECTION */}
      {section === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">No advertiser campaigns.</div>
          ) : (
            campaigns.map((c) => (
              <div key={c.id} className="p-4 rounded-3xl glass-card border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#F0F0F0]">{c.title}</h4>
                    <div className="text-[10px] text-white/40">Creator TG: {c.telegram_id}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-white/50">{c.description}</div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {c.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReviewCampaign(c.id, 'active')}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-black font-black text-xs"
                      >
                        Approve Campaign
                      </button>
                      <button
                        onClick={() => handleReviewCampaign(c.id, 'rejected')}
                        className="flex-1 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-xs"
                      >
                        Reject & Refund
                      </button>
                    </>
                  )}

                  {c.status === 'active' && (
                    <button
                      onClick={() => handleReviewCampaign(c.id, 'paused')}
                      className="flex-1 py-1.5 rounded-xl bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/30 font-bold text-xs"
                    >
                      Pause Campaign
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. BID & WIN MANAGEMENT */}
      {section === 'bid' && (
        <div className="space-y-3">
          {bidRounds.map((r) => (
            <div key={r.id} className="p-4 rounded-3xl glass-card border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#F0F0F0]">Round #{r.round_number}</h4>
                  <div className="text-[11px] text-white/40">
                    Pool: <span className="font-mono font-black text-[#F27D26]">{r.total_pool} Coins</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    r.status === 'active'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-white/5 border border-white/10 text-white/40'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="text-xs text-white/70">
                Leader:{' '}
                <span className="font-bold text-emerald-400">
                  {r.last_bidder_name || (r.last_bidder_username ? `@${r.last_bidder_username}` : 'None')}
                </span>
              </div>

              {r.status === 'active' && (
                <button
                  onClick={() => handleForceFinishRound(r.id)}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
                >
                  Force Finalize Round & Pay Winner
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 6. WITHDRAWALS MANAGEMENT */}
      {section === 'withdrawals' && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">No withdrawal requests found.</div>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="p-4 rounded-3xl glass-card border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black font-mono text-[#F0F0F0]">
                      {w.coin_amount} Coins <span className="text-emerald-400 font-sans font-bold">({w.usdt_amount} USDT)</span>
                    </div>
                    <div className="text-[11px] text-white/40">User TG: {w.telegram_id} {w.username ? `(@${w.username})` : ''}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                    {w.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-white/70 break-all">
                  Address ({w.crypto_network}): {w.wallet_address}
                </div>

                {w.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleWithdrawalAction(w.id, 'processing')}
                      className="flex-1 py-1.5 rounded-xl bg-sky-500 text-black font-bold text-xs"
                    >
                      Mark Processing
                    </button>
                    <button
                      onClick={() => setTxHashModal({ wd: w, txHash: '' })}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
                    >
                      Complete (TxHash)
                    </button>
                    <button
                      onClick={() => setRejectWdModal({ wd: w, reason: 'Invalid address' })}
                      className="py-1.5 px-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-xs"
                    >
                      Reject & Refund
                    </button>
                  </div>
                )}

                {w.status === 'processing' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setTxHashModal({ wd: w, txHash: '' })}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs"
                    >
                      Complete & Enter TxHash
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 7. SETTINGS SECTION */}
      {section === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-3xl glass-card border-white/10 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F27D26] mb-2">Global Platform Settings</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/40">Ad Reward (Coins)</label>
              <input
                type="number"
                step="0.5"
                value={settings.ad_reward}
                onChange={(e) => setSettings({ ...settings, ad_reward: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Task Reward (Coins)</label>
              <input
                type="number"
                step="0.5"
                value={settings.task_reward}
                onChange={(e) => setSettings({ ...settings, task_reward: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Click Price / CPC (Coins)</label>
              <input
                type="number"
                step="0.5"
                value={settings.click_price}
                onChange={(e) => setSettings({ ...settings, click_price: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Min Campaign Budget (Coins)</label>
              <input
                type="number"
                value={settings.min_campaign_budget}
                onChange={(e) => setSettings({ ...settings, min_campaign_budget: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Bid Amount (Coins)</label>
              <input
                type="number"
                value={settings.bid_amount}
                onChange={(e) => setSettings({ ...settings, bid_amount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-red-400 focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Bid Timer (Seconds)</label>
              <input
                type="number"
                value={settings.bid_timer_seconds}
                onChange={(e) => setSettings({ ...settings, bid_timer_seconds: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Winner % (e.g. 85)</label>
              <input
                type="number"
                value={settings.winner_percentage}
                onChange={(e) => setSettings({ ...settings, winner_percentage: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Platform % (e.g. 15)</label>
              <input
                type="number"
                value={settings.platform_percentage}
                onChange={(e) => setSettings({ ...settings, platform_percentage: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-white/60 focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Coin → USDT Rate</label>
              <input
                type="number"
                step="0.000001"
                value={settings.coin_to_usdt_rate}
                onChange={(e) => setSettings({ ...settings, coin_to_usdt_rate: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Min Withdrawal (Coins)</label>
              <input
                type="number"
                value={settings.min_withdrawal_coins}
                onChange={(e) => setSettings({ ...settings, min_withdrawal_coins: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-[#F27D26]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl neon-bg-orange text-black font-black uppercase text-xs mt-4 tracking-tight"
          >
            Save Global Platform Settings
          </button>
        </form>
      )}

      {/* Credit / Debit Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-xs w-full glass-card border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-[#F0F0F0]">
              Adjust Coins for User #{balanceModal.user.telegram_id}
            </h3>

            <div>
              <label className="text-[11px] text-white/40">Amount (Positive = Credit, Negative = Debit)</label>
              <input
                type="number"
                value={balanceModal.amount}
                onChange={(e) => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono font-bold text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/40">Reason</label>
              <input
                type="text"
                value={balanceModal.reason}
                onChange={(e) => setBalanceModal({ ...balanceModal, reason: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleAdjustBalance}
                className="flex-1 py-2 rounded-xl neon-bg-orange text-black font-black text-xs"
              >
                Confirm
              </button>
              <button
                onClick={() => setBalanceModal(null)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete TxHash Modal */}
      {txHashModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-sm w-full glass-card border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-[#F0F0F0]">Complete Withdrawal with TxHash</h3>

            <div>
              <label className="text-[11px] text-white/40">Blockchain Transaction Hash</label>
              <input
                type="text"
                value={txHashModal.txHash}
                onChange={(e) => setTxHashModal({ ...txHashModal, txHash: e.target.value })}
                placeholder="0x..."
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleWithdrawalAction(txHashModal.wd.id, 'completed', txHashModal.txHash)}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs"
              >
                Mark Completed
              </button>
              <button
                onClick={() => setTxHashModal(null)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {rejectWdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-sm w-full glass-card border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-red-400">Reject Withdrawal & Refund Coins</h3>

            <div>
              <label className="text-[11px] text-white/40">Rejection Reason</label>
              <input
                type="text"
                value={rejectWdModal.reason}
                onChange={(e) => setRejectWdModal({ ...rejectWdModal, reason: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleWithdrawalAction(rejectWdModal.wd.id, 'rejected', undefined, rejectWdModal.reason)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setRejectWdModal(null)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
