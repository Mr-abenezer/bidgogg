/**
 * BID X — Mobile-First Bottom Navigation Bar
 */

import React from 'react';
import { Home, Zap, Flame, Megaphone, Wallet as WalletIcon, Shield } from 'lucide-react';
import { haptic } from '../lib/telegram';

export type TabType = 'home' | 'earn' | 'bid' | 'campaigns' | 'wallet' | 'admin';

interface Props {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChangeTab, isAdmin }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'earn' as TabType, label: 'Earn', icon: Zap },
    { id: 'bid' as TabType, label: 'Bid & Win', icon: Flame, badge: 'LIVE' },
    { id: 'campaigns' as TabType, label: 'Ads', icon: Megaphone },
    { id: 'wallet' as TabType, label: 'Wallet', icon: WalletIcon },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic.selection();
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#F27D26] font-semibold'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(242,125,38,0.5)]' : 'scale-100'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[8px] font-black uppercase px-1 py-0.2 rounded-full bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[56px]">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1.5 w-8 h-1 bg-[#F27D26] rounded-full shadow-[0_0_10px_rgba(242,125,38,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
