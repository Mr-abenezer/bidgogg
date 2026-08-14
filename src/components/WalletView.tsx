/**
 * BID X — Coin Wallet & USDT Withdrawal View
 */

import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { User, Wallet, PlatformSettings, Withdrawal, Transaction } from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  user: User;
  wallet: Wallet;
  settings: PlatformSettings;
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  onWithdrawalRequested: (wd: Withdrawal) => void;
}

export const WalletView: React.FC<Props> = ({
  user,
  wallet,
  settings,
  withdrawals = [],
  transactions = [],
  onWithdrawalRequested,
}) => {
  const [subTab, setSubTab] = useState<'withdraw' | 'history' | 'ledger'>('withdraw');

  // Safe defaults
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const minCoins = Number(settings?.min_withdrawal_coins || 300);
  const rate = Number(settings?.coin_to_usdt_rate || 0.0006);
  const coinBalance = Number(wallet?.coin_balance || 0);
  const reservedBalance = Number(wallet?.reserved_balance || 0);

  const [coinAmount, setCoinAmount] = useState<number>(minCoins);
  const [network, setNetwork] = useState<string>('USDT (BEP20)');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const usdtEquivalent = Number(((Number(coinAmount) || 0) * rate).toFixed(4));
  const availableCoins = coinBalance;

  const handleSetAmount = (val: number) => {
    haptic.selection();
    setCoinAmount(val);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      setError('Please provide a valid USDT recipient address.');
      return;
    }

    if (coinAmount < minCoins) {
      setError(`Minimum withdrawal is ${minCoins} Coins (${(minCoins * rate).toFixed(2)} USDT).`);
      return;
    }

    if (coinAmount > availableCoins) {
      setError(`Withdrawal amount exceeds your available balance of ${availableCoins} Coins.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    haptic.medium();

    try {
      const res = await api.requestWithdrawal({
        coinAmount: Number(coinAmount),
        cryptoNetwork: network,
        walletAddress: walletAddress.trim(),
      });

      if (res.success && res.data) {
        haptic.success();
        setSuccessMsg(`Withdrawal of ${res.data.coin_amount} Coins (${res.data.usdt_amount} USDT) submitted! It is now pending admin processing.`);
        setWalletAddress('');
        onWithdrawalRequested(res.data);
      } else {
        setError(res.error || 'Failed to submit withdrawal request');
        haptic.error();
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission error');
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <XCircle className="w-3 h-3" />
            <span>{status === 'rejected' ? 'Rejected' : 'Cancelled'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* 1. Wallet Balance Overview */}
      <div className="rounded-3xl glass-card p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <WalletIcon className="w-4 h-4 text-[#F27D26]" />
            Coin Wallet
          </span>
          <span className="text-[10px] font-mono text-[#F27D26] bg-[#F27D26]/10 border border-[#F27D26]/30 px-2 py-0.5 rounded-full font-bold">
            1 Coin = {rate} USDT
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-3xl font-extrabold font-mono text-[#F0F0F0] tracking-tight">
            {coinBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </h2>
          <span className="text-base font-bold text-[#F27D26] font-sans">Coins</span>
        </div>

        <p className="text-xs text-white/40 font-mono mb-4">
          ≈ <span className="text-white font-semibold">${(coinBalance * rate).toFixed(4)} USDT</span> equivalent
        </p>

        {/* Reserved balance if any */}
        {reservedBalance > 0 && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-[#F27D26] font-mono">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {reservedBalance} Coins reserved in pending withdrawals/campaigns
            </span>
          </div>
        )}
      </div>

      {/* Sub Tab Switcher */}
      <div className="flex p-1 rounded-2xl glass-card">
        <button
          onClick={() => {
            haptic.selection();
            setSubTab('withdraw');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
            subTab === 'withdraw'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Withdraw USDT
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setSubTab('history');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
            subTab === 'history'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Withdrawals ({safeWithdrawals.length})
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setSubTab('ledger');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
            subTab === 'ledger'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Ledger
        </button>
      </div>

      {/* 2. WITHDRAW FORM */}
      {subTab === 'withdraw' && (
        <form onSubmit={handleWithdraw} className="p-5 rounded-3xl glass-card space-y-4 shadow-2xl">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white/70">Withdraw Amount (Coins)</label>
              <span className="text-[11px] text-white/40 font-mono">Available: {availableCoins} Coins</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={minCoins}
                max={availableCoins}
                step="10"
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
                required
                className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm font-bold font-mono text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
              />
              <span className="text-xs font-bold text-[#F27D26]">Coins</span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2">
              {[300, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSetAmount(val)}
                  className="flex-1 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono font-semibold text-white/70 transition-colors"
                >
                  {val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSetAmount(Math.floor(availableCoins))}
                className="flex-1 py-1 rounded-lg bg-[#F27D26]/10 hover:bg-[#F27D26]/20 text-[11px] font-mono font-bold text-[#F27D26] border border-[#F27D26]/30 transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* You Receive Calculation Box */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-white/40">You Receive</div>
              <div className="text-xl font-black font-mono text-emerald-400">{usdtEquivalent} USDT</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/40">Min. Withdrawal</div>
              <div className="text-xs font-bold font-mono text-white/80">{minCoins} Coins ({(minCoins * rate).toFixed(2)} USDT)</div>
            </div>
          </div>

          {/* Crypto Network */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Select Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26]"
            >
              <option value="USDT (BEP20)" className="bg-[#050505] text-white">USDT (BEP-20 / BNB Smart Chain) — Low Fees</option>
              <option value="USDT (TRC20)" className="bg-[#050505] text-white">USDT (TRC-20 / Tron)</option>
              <option value="USDT (TON)" className="bg-[#050505] text-white">USDT (TON Network)</option>
              <option value="USDT (Polygon)" className="bg-[#050505] text-white">USDT (Polygon Network)</option>
            </select>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Your USDT Recipient Address *</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="e.g. 0x... or T..."
              required
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F27D26]"
            />
            <p className="text-[10px] text-white/40 mt-1">
              Ensure you input the correct address corresponding to the selected network.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || availableCoins < minCoins}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing Withdrawal...</span>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw {usdtEquivalent} USDT</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 3. WITHDRAWAL HISTORY */}
      {subTab === 'history' && (
        <div className="space-y-3">
          {safeWithdrawals.length === 0 ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl p-8">
              <ArrowUpRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No withdrawal requests yet.</p>
            </div>
          ) : (
            safeWithdrawals.map((w) => (
              <div key={w.id} className="p-4 rounded-3xl glass-card space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black font-mono text-[#F0F0F0]">
                      {Number(w.coin_amount || 0)} Coins <span className="text-emerald-400 font-sans font-bold">({Number(w.usdt_amount || 0)} USDT)</span>
                    </div>
                    <div className="text-[11px] text-white/40">{String(w.crypto_network || 'USDT')}</div>
                  </div>
                  {getStatusBadge(w.status)}
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-white/40 truncate">
                  To: <span className="text-white/80">{String(w.wallet_address || '')}</span>
                </div>

                {w.tx_hash && (
                  <div className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                    <span>TxHash: {String(w.tx_hash)}</span>
                  </div>
                )}

                {w.rejection_reason && (
                  <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    Reason: {String(w.rejection_reason)}
                  </div>
                )}

                <div className="text-[10px] text-white/40 font-mono text-right">
                  {new Date(w.created_at || Date.now()).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. TRANSACTION LEDGER */}
      {subTab === 'ledger' && (
        <div className="space-y-2">
          {safeTransactions.length === 0 ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl p-8">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No transactions recorded yet.</p>
            </div>
          ) : (
            safeTransactions.map((tx) => {
              const isCredit = (Number(tx.amount) || 0) > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#F0F0F0] truncate">{String(tx.description || 'Transaction')}</div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {new Date(tx.created_at || Date.now()).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} • Bal: {Number(tx.balance_after || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono">
                    <div
                      className={`text-xs font-bold ${
                        isCredit ? 'text-emerald-400' : 'text-white/60'
                      }`}
                    >
                      {isCredit ? '+' : ''}{Number(tx.amount || 0)} Coins
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
