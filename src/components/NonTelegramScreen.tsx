/**
 * BID X — Non-Telegram Warning Screen & Developer Simulator
 * Shown when the app is opened outside the Telegram Mini App environment
 */

import React, { useState } from 'react';
import { ShieldAlert, Send, Smartphone, ArrowRight, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import { TelegramUser } from '../types';
import { setDevTelegramUser } from '../lib/telegram';

interface Props {
  onBypass: (user: TelegramUser) => void;
}

export const NonTelegramScreen: React.FC<Props> = ({ onBypass }) => {
  const [showDevModal, setShowDevModal] = useState(false);
  const [customId, setCustomId] = useState('7734124559'); // Default to Admin ID for easy testing
  const [customUsername, setCustomUsername] = useState('bidx_admin');
  const [customName, setCustomName] = useState('Admin User');

  const botUrl = 'http://t.me/BidX_SmartEarningsbot/Earn';

  const handleStartDevSession = (asAdmin: boolean) => {
    const user: TelegramUser = asAdmin
      ? {
          id: 7734124559,
          username: 'bidx_admin',
          first_name: 'Admin',
          last_name: 'Master',
          photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        }
      : {
          id: Number(customId) || 123456789,
          username: customUsername || 'telegram_user',
          first_name: customName || 'Alex',
          last_name: 'Bidder',
          photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        };

    setDevTelegramUser(user);
    onBypass(user);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F0F0F0] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center relative z-10 border-white/10">
        {/* App Logo */}
        <div className="w-20 h-20 neon-bg-orange rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
          <span className="text-3xl font-black text-black font-mono tracking-tighter">BID X</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#F27D26] text-xs font-black uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          Telegram Environment Required
        </div>

        <h1 className="text-2xl font-black text-[#F0F0F0] mb-3 tracking-tight">
          Bid X can only be used inside Telegram
        </h1>

        <p className="text-white/50 text-xs leading-relaxed mb-8">
          This WebApp uses Telegram Mini App cryptographic authentication to secure your Coin wallet, ads rewards, and live Bid & Win rounds.
        </p>

        {/* Telegram Direct Launch Button */}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-3 neon-bg-orange active:scale-[0.98] text-black font-black uppercase tracking-tight py-3.5 px-6 rounded-2xl transition-all mb-4 group"
        >
          <Send className="w-5 h-5 fill-black group-hover:translate-x-0.5 transition-transform" />
          <span>Launch on Telegram Bot</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </a>

        {/* Browser Developer / Testing Simulator Toggle */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => setShowDevModal(!showDevModal)}
            className="text-xs text-white/40 hover:text-[#F27D26] flex items-center justify-center gap-1.5 mx-auto transition-colors font-medium"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Developer / Preview Simulator</span>
          </button>
        </div>

        {showDevModal && (
          <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-white/10 text-left animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-[#F27D26] uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preview Mode Testing</span>
            </div>

            <p className="text-xs text-white/40 mb-4">
              Simulate Telegram Mini App authentication in this browser session to test all user & admin features:
            </p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleStartDevSession(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 hover:bg-[#F27D26]/20 text-[#F27D26] text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F27D26]" />
                  <span>Admin Session (ID: 7734124559)</span>
                </div>
                <span className="bg-[#F27D26] text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">Admin</span>
              </button>

              <button
                onClick={() => handleStartDevSession(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <span>Regular User (ID: {customId})</span>
                </div>
                <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded text-[10px]">User</span>
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div>
                <label className="text-[11px] text-white/40">Custom Telegram ID</label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#F27D26] font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
