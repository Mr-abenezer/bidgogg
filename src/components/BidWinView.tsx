/**
 * BID X — Real-Time Authoritative Bid & Win Arena
 * Live 60s countdown, 85/15 pool split, and atomic bidding
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Trophy,
  Users,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowUp,
  History,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BidRound, Bid, User, Wallet } from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  user: User;
  wallet: Wallet;
  onBalanceUpdated: (newBalance: number) => void;
}

export const BidWinView: React.FC<Props> = ({ user, wallet, onBalanceUpdated }) => {
  const [round, setRound] = useState<BidRound | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [recentWinners, setRecentWinners] = useState<BidRound[]>([]);
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);

  // Poll round state every 1s for authoritative live sync
  const fetchRoundState = async () => {
    try {
      const res = await api.getBidRound();
      if (res.success && res.data) {
        setRound(res.data.round);
        setBids(res.data.bids || []);
        setRecentWinners(res.data.recentWinners || []);

        if (res.data.round) {
          setSecondsRemaining(res.data.round.seconds_left ?? 60);
        }
      }
    } catch (e) {
      // silent polling error
    }
  };

  useEffect(() => {
    fetchRoundState();
    const interval = setInterval(fetchRoundState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Place Bid
  const handlePlaceBid = async () => {
    if (!round || isBidding) return;

    const availableBalance = Number(wallet?.coin_balance || 0);
    const cost = Number(round?.bid_cost || 10);

    if (availableBalance < cost) {
      setError(`Insufficient Coins. You need ${cost} Coins to place a bid.`);
      haptic.error();
      return;
    }

    if (round.last_bidder_id === user.telegram_id) {
      setError("You are already the highest bidder! Wait for another user to bid.");
      haptic.warning();
      return;
    }

    setIsBidding(true);
    setError(null);
    haptic.heavy();

    try {
      const res = await api.placeBid(round.id);
      if (res.success && res.data) {
        setRound(res.data.round);
        onBalanceUpdated(res.data.balance);
        haptic.success();

        // Play quick burst safely
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#ef4444', '#eab308', '#38bdf8'],
          });
        } catch (e) {
          // ignore canvas-confetti issues if any
        }

        fetchRoundState();
      } else {
        setError(res.error || 'Failed to place bid');
        haptic.error();
      }
    } catch (err: any) {
      setError(err.message || 'Bidding communication error');
      haptic.error();
    } finally {
      setIsBidding(false);
    }
  };

  const isLeading = round?.last_bidder_id === user.telegram_id;
  const bidCost = round?.bid_cost || 10;
  const winnerPercentage = round?.winner_percentage || 85;
  const platformPercentage = round?.platform_percentage || 15;
  const winnerPayout = round ? ((round.total_pool * winnerPercentage) / 100).toFixed(2) : '0';

  // Circular timer calculation
  const totalTimerSeconds = round?.timer_seconds || 60;
  const progressRatio = Math.max(0, Math.min(1, secondsRemaining / totalTimerSeconds));
  const strokeDashoffset = 283 * (1 - progressRatio); // 2 * PI * 45 ≈ 283

  const safeBids = Array.isArray(bids) ? bids : [];
  const safeRecentWinners = Array.isArray(recentWinners) ? recentWinners : [];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* 1. Arena Header Spotlight */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 shadow-2xl text-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F27D26]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Round Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#F27D26] text-[10px] font-bold uppercase tracking-widest mb-4">
          <Flame className="w-4 h-4 fill-[#F27D26]/20 animate-pulse" />
          <span>Round #{round?.round_number || 1} Live</span>
        </div>

        {/* 60s Circular Countdown */}
        <div className="relative w-44 h-44 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-white/10"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className={secondsRemaining <= 10 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-[#F27D26] drop-shadow-[0_0_10px_rgba(242,125,38,0.7)]'}
              strokeWidth="6"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-4xl font-black font-mono tracking-tight ${
                secondsRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-[#F0F0F0] neon-glow-orange'
              }`}
            >
              {secondsRemaining}s
            </span>
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-0.5">
              Seconds Left
            </span>
          </div>
        </div>

        {/* Prize Pool Display */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">
            Current Total Prize Pool
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#F0F0F0] gradient-text tracking-tight">
            {(round?.total_pool || 0).toLocaleString()} <span className="text-xl font-sans font-bold text-[#F27D26]">Coins</span>
          </div>
        </div>

        {/* Prize Split Badges */}
        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mb-5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Winner Payout ({winnerPercentage}%)</div>
            <div className="text-sm font-extrabold font-mono text-emerald-300">
              {winnerPayout} Coins
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Platform Fee ({platformPercentage}%)</div>
            <div className="text-sm font-extrabold font-mono text-white/70">
              {round ? ((round.total_pool * platformPercentage) / 100).toFixed(2) : '0'} Coins
            </div>
          </div>
        </div>

        {/* Current Leader Banner */}
        <div className="p-3.5 rounded-2xl glass-card mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#F27D26] font-bold text-sm flex-shrink-0">
              {round?.last_bidder_photo ? (
                <img
                  src={round.last_bidder_photo}
                  alt="Leader"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Trophy className="w-5 h-5 text-[#F27D26]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Current Last Bidder</div>
              <div className="text-xs font-bold text-[#F0F0F0] truncate">
                {round?.last_bidder_name || (round?.last_bidder_username ? `@${round.last_bidder_username}` : 'Waiting for first bid...')}
              </div>
            </div>
          </div>

          {isLeading && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">
              You are Winning!
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Pulsating Bid Button */}
        <button
          onClick={handlePlaceBid}
          disabled={isBidding || isLeading}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all uppercase tracking-tight active:scale-[0.98] ${
            isLeading
              ? 'bg-emerald-600 text-white cursor-default shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'neon-bg-orange text-black hover:opacity-95'
          }`}
        >
          {isBidding ? (
            <span className="animate-pulse">Placing Bid...</span>
          ) : isLeading ? (
            <>
              <Trophy className="w-5 h-5" />
              <span>You Hold the Winning Bid!</span>
            </>
          ) : (
            <>
              <ArrowUp className="w-5 h-5" />
              <span>PLACE BID ({bidCost} COINS)</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-white/40 mt-2.5 italic">
          Each bid resets the timer to 60s. If nobody bids for 60s, you win 85% of the pool!
        </p>
      </div>

      {/* 2. Real-Time Bid Stream */}
      <div className="rounded-3xl glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            Live Bid History (Round #{round?.round_number || 1})
          </h3>
          <span className="text-[10px] font-mono text-white/40">{safeBids.length} bids</span>
        </div>

        {safeBids.length === 0 ? (
          <div className="py-8 text-center text-white/40 text-xs">
            No bids in this round yet. Be the first to bid and lead the pool!
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {safeBids.map((b, idx) => (
              <div
                key={b.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  idx === 0
                    ? 'bg-[#F27D26]/10 border-[#F27D26]/30 font-semibold text-[#F27D26]'
                    : 'bg-white/[0.02] border-white/5 text-white/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/40">#{safeBids.length - idx}</span>
                  <span className="font-bold text-[#F0F0F0]">
                    {b.first_name || (b.username ? `@${b.username}` : 'Bidder')}
                  </span>
                  {b.telegram_id === user.telegram_id && (
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-bold">YOU</span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#F27D26] font-bold">+{b.bid_amount} Coins</span>
                  <span className="text-[10px] text-white/40">
                    {new Date(b.bid_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Recent Round Winners (Hall of Fame) */}
      {safeRecentWinners.length > 0 && (
        <div className="rounded-3xl glass-card p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-[#F27D26]" />
            Recent Round Winners
          </h3>

          <div className="space-y-2">
            {safeRecentWinners.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[#F0F0F0]">
                    Round #{w.round_number} Winner:{' '}
                    <span className="text-[#F27D26]">
                      {w.last_bidder_name || (w.last_bidder_username ? `@${w.last_bidder_username}` : 'Winner')}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    Pool: {w.total_pool} Coins
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold font-mono text-emerald-400">
                    +{w.winner_amount} Coins
                  </div>
                  <div className="text-[9px] text-white/40">85% Paid</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
