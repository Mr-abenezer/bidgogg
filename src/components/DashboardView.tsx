/**
 * BID X — Home Dashboard View
 * Responsive mobile-first dashboard with earnings, live round tracker, and quick actions
 */

import React from 'react';
import {
  Coins,
  TrendingUp,
  Flame,
  Zap,
  CheckSquare,
  Megaphone,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { User, Wallet, PlatformSettings, BidRound, Transaction } from '../types';
import { TabType } from './BottomNav';
import { haptic } from '../lib/telegram';

interface Props {
  user: User;
  wallet: Wallet;
  settings: PlatformSettings;
  activeRound: BidRound | null;
  recentTransactions: Transaction[];
  availableAdsCount: number;
  availableTasksCount: number;
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<Props> = ({
  user,
  wallet,
  settings,
  activeRound,
  recentTransactions,
  availableAdsCount,
  availableTasksCount,
  onNavigate,
}) => {
  const usdtEquivalent = (wallet.coin_balance * (settings.coin_to_usdt_rate || 0.0006)).toFixed(4);
  const totalEarnedUsdt = (wallet.total_earned * (settings.coin_to_usdt_rate || 0.0006)).toFixed(2);

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      {/* 1. Main Coin Balance Card */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#F27D26]" />
              Available Coin Balance
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#F27D26] px-2 py-0.5 rounded-full">
              1 Coin = {settings.coin_to_usdt_rate} USDT
            </span>
          </div>

          {/* Big Balance */}
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-4xl font-extrabold font-mono text-[#F0F0F0] tracking-tight">
              {wallet.coin_balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </h1>
            <span className="text-lg font-bold text-[#F27D26] font-sans">Coins</span>
          </div>

          <p className="text-xs font-mono text-white/40 mb-6">
            ≈ <span className="text-white font-semibold">${usdtEquivalent} USDT</span> (Available for withdrawal)
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Today's Earnings</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                +{wallet.today_earned.toLocaleString()} Coins
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
                <Sparkles className="w-3 h-3 text-[#F27D26]" />
                <span>Total Earned</span>
              </div>
              <div className="text-sm font-bold font-mono text-[#F27D26]">
                {wallet.total_earned.toLocaleString()} Coins
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Watch Ads */}
          <button
            onClick={() => {
              haptic.selection();
              onNavigate('earn');
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-card glass-card-hover border-l-4 border-l-[#F27D26] active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26] mb-2 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 fill-[#F27D26]/20" />
            </div>
            <span className="text-xs font-bold text-[#F0F0F0]">Watch Ads</span>
            <span className="text-[10px] text-[#F27D26] font-semibold mt-0.5">+{settings.ad_reward} Coins</span>
          </button>

          {/* Tasks */}
          <button
            onClick={() => {
              haptic.selection();
              onNavigate('earn');
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-card glass-card-hover border-l-4 border-l-sky-500 active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#F0F0F0]">Tasks</span>
            <span className="text-[10px] text-sky-400 font-semibold mt-0.5">+{settings.task_reward} Coins</span>
          </button>

          {/* Bid & Win */}
          <button
            onClick={() => {
              haptic.selection();
              onNavigate('bid');
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-card glass-card-hover border-l-4 border-l-red-500 active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 fill-red-400/20 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-[#F0F0F0]">Bid & Win</span>
            <span className="text-[10px] text-red-400 font-semibold mt-0.5">{settings.winner_percentage}% Pool</span>
          </button>

          {/* Post Ad / Campaign */}
          <button
            onClick={() => {
              haptic.selection();
              onNavigate('campaigns');
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl glass-card glass-card-hover border-l-4 border-l-indigo-500 active:scale-95 transition-all text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#F0F0F0]">Post Ad</span>
            <span className="text-[10px] text-white/40 mt-0.5">Promote</span>
          </button>

          {/* Withdraw */}
          <button
            onClick={() => {
              haptic.selection();
              onNavigate('wallet');
            }}
            className="col-span-2 flex items-center justify-between p-3.5 rounded-2xl glass-card glass-card-hover border-l-4 border-l-emerald-500 active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#F0F0F0]">Withdraw USDT</div>
                <div className="text-[10px] text-white/40">Min {settings.min_withdrawal_coins} Coins</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3. Live Bid & Win Spotlight */}
      {activeRound && (
        <div
          onClick={() => {
            haptic.selection();
            onNavigate('bid');
          }}
          className="cursor-pointer relative overflow-hidden rounded-3xl glass-card border border-red-500/30 p-5 shadow-lg hover:border-red-500/60 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                Bid & Win Round #{activeRound.round_number}
              </span>
            </div>
            <span className="text-[10px] font-bold font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
              {activeRound.seconds_left ?? activeRound.timer_seconds}s LEFT
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Current Prize Pool</div>
              <div className="text-2xl font-black font-mono text-[#F27D26]">
                {activeRound.total_pool.toLocaleString()} <span className="text-sm font-sans font-bold text-white/60">Coins</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Winner Gets (85%)</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {((activeRound.total_pool * activeRound.winner_percentage) / 100).toLocaleString()} Coins
              </div>
            </div>
          </div>

          {/* Current Leader */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="text-white/40">Leader:</span>
              <span className="font-bold text-white">
                {activeRound.last_bidder_name || (activeRound.last_bidder_username ? `@${activeRound.last_bidder_username}` : 'No bids yet')}
              </span>
            </div>

            <span className="text-xs font-bold text-[#F27D26] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Bid Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* 4. Recent Transactions Ledger */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Recent Transactions</h2>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-[11px] text-[#F27D26] hover:text-[#F27D26]/80 font-semibold flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 rounded-2xl glass-card text-center text-white/40 text-xs">
            No transactions yet. Start earning Coins today!
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 4).map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#F0F0F0] truncate">{tx.description}</div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Bal: {tx.balance_after}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-xs font-mono font-bold ${
                        isCredit ? 'text-emerald-400' : 'text-white/60'
                      }`}
                    >
                      {isCredit ? '+' : ''}{tx.amount} Coins
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
