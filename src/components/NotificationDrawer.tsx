/**
 * BID X — Notifications Slide-Out Drawer
 */

import React from 'react';
import { X, Bell, Check, Sparkles, Flame, Wallet as WalletIcon, Megaphone, Info } from 'lucide-react';
import { Notification } from '../types';
import { api } from '../lib/api';

interface Props {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({
  notifications,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    await api.markNotificationRead();
    onRefresh();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reward':
      case 'win':
        return <Sparkles className="w-4 h-4 text-[#F27D26]" />;
      case 'outbid':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'withdrawal':
        return <WalletIcon className="w-4 h-4 text-emerald-400" />;
      case 'campaign':
        return <Megaphone className="w-4 h-4 text-sky-400" />;
      default:
        return <Info className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex justify-end">
      <div className="w-full max-w-sm glass-card border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#F27D26]" />
            <h2 className="text-sm font-bold text-[#F0F0F0]">Notifications</h2>
            <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">
              {notifications.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-[#F27D26] hover:text-[#F27D26]/80 font-bold transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.is_read
                    ? 'bg-black/30 border-white/5 opacity-70'
                    : 'glass-card border-[#F27D26]/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex-shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-[#F0F0F0] truncate">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#F27D26] shadow-[0_0_8px_#F27D26] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-white/30 font-mono mt-1.5 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
