/**
 * BID X — Header Component
 * User Telegram Profile, Real-time Coin Balance, and Notification Drawer Trigger
 */

import React from 'react';
import { Coins, Bell, Shield, Sparkles } from 'lucide-react';
import { User, Wallet, PlatformSettings } from '../types';
import { haptic } from '../lib/telegram';

interface Props {
  user: User;
  wallet: Wallet;
  settings: PlatformSettings;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<Props> = ({
  user,
  wallet,
  settings,
  unreadCount,
  onOpenNotifications,
  onOpenWallet,
  onOpenAdmin,
}) => {
  const usdtValue = (wallet.coin_balance * (settings.coin_to_usdt_rate || 0.0006)).toFixed(4);

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: User Profile */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F27D26] to-[#FF4E00] flex items-center justify-center text-black font-extrabold text-sm shadow-sm">
                {(user.first_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            {user.is_admin && (
              <div
                title="Verified Admin"
                onClick={onOpenAdmin}
                className="cursor-pointer absolute -bottom-1 -right-1 bg-[#F27D26] text-black rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
              >
                <Shield className="w-2.5 h-2.5 fill-black" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#F0F0F0] truncate">
                {user.first_name || (user.username ? `@${user.username}` : 'Bidder')}
              </span>
              {user.is_admin && (
                <span
                  onClick={onOpenAdmin}
                  className="cursor-pointer text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] hover:bg-[#F27D26]/30 transition-colors"
                >
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-white/40 truncate">
              ID: {user.telegram_id}
            </p>
          </div>
        </div>

        {/* Right: Coin Balance & Notifications */}
        <div className="flex items-center gap-2">
          {/* Coin Balance Pill */}
          <button
            onClick={() => {
              haptic.light();
              onOpenWallet();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#F27D26]/30 hover:border-[#F27D26]/70 transition-all shadow-sm hover:shadow-[0_0_15px_rgba(242,125,38,0.2)] group active:scale-95"
          >
            <div className="w-5 h-5 rounded-full bg-[#F27D26]/20 flex items-center justify-center text-[#F27D26] group-hover:scale-110 transition-transform">
              <Coins className="w-3.5 h-3.5 fill-[#F27D26]/30 text-[#F27D26]" />
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold font-mono text-[#F27D26] leading-tight">
                {wallet.coin_balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                <span className="text-[10px] font-sans font-bold text-white/50 ml-1">Coins</span>
              </div>
              <div className="text-[9px] text-white/40 font-mono leading-none">
                ≈ ${usdtValue} USDT
              </div>
            </div>
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => {
              haptic.light();
              onOpenNotifications();
            }}
            className="relative p-2 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-colors active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#F27D26] rounded-full ring-2 ring-[#050505] shadow-[0_0_8px_rgba(242,125,38,0.8)] animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
