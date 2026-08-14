/**
 * BID X — User Campaigns & Advertising System
 * Allows users to spend Coins to create real-world Telegram traffic campaigns
 */

import React, { useState } from 'react';
import {
  Megaphone,
  PlusCircle,
  ExternalLink,
  Coins,
  MousePointerClick,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Campaign, User, Wallet, PlatformSettings } from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  user: User;
  wallet: Wallet;
  settings: PlatformSettings;
  activeCampaigns: Campaign[];
  myCampaigns: Campaign[];
  onCampaignCreated: (campaign: Campaign) => void;
}

export const CampaignsView: React.FC<Props> = ({
  user,
  wallet,
  settings,
  activeCampaigns,
  myCampaigns,
  onCampaignCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my' | 'browse'>('create');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [budget, setBudget] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cpc = settings.click_price || 5.0;
  const minBudget = settings.min_campaign_budget || 50.0;
  const estimatedClicks = Math.floor((budget || 0) / cpc);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !destinationUrl.trim()) {
      setError('Please fill in all required campaign fields.');
      return;
    }

    if (budget < minBudget) {
      setError(`Minimum campaign budget is ${minBudget} Coins.`);
      return;
    }

    if (wallet.coin_balance < budget) {
      setError(`Insufficient Coin balance. You have ${wallet.coin_balance} Coins, needed ${budget} Coins.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    haptic.medium();

    try {
      const res = await api.createCampaign({
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
        destination_url: destinationUrl.trim(),
        budget: Number(budget),
        cost_per_click: cpc,
      });

      if (res.success && res.data) {
        haptic.success();
        setSuccessMsg(`Campaign "${res.data.title}" submitted successfully! It is now pending admin approval.`);
        setTitle('');
        setDescription('');
        setImageUrl('');
        setDestinationUrl('');
        setBudget(100);
        onCampaignCreated(res.data);
        setActiveTab('my');
      } else {
        setError(res.error || 'Failed to create campaign');
        haptic.error();
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCampaignClick = async (c: Campaign) => {
    haptic.light();
    try {
      await api.trackCampaignClick(c.id);
    } catch (e) {}
    window.open(c.destination_url, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl glass-card">
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('create');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'create'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Ad</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('my');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'my'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Campaigns ({myCampaigns.length})</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setActiveTab('browse');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'browse'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Explore ({activeCampaigns.length})</span>
        </button>
      </div>

      {/* 1. CREATE CAMPAIGN TAB */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-4 rounded-3xl glass-card border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Promote with Coins</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Drive authentic Telegram traffic to your channel, bot, or website. Pay only for valid clicks!
            </p>
          </div>

          <form onSubmit={handleCreateCampaign} className="p-5 rounded-3xl glass-card space-y-4 shadow-2xl">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Campaign Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Join My Crypto Signals Channel"
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Campaign Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe why users should click your link..."
                rows={2}
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Destination URL *</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://t.me/your_channel"
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Banner Image URL (Optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              />
            </div>

            {/* Budget & Click Calculator */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/80">Campaign Budget (Coins)</span>
                <span className="text-white/40 font-mono">Min: {minBudget} Coins</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={minBudget}
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2 bg-black/60 border border-white/10 rounded-xl text-sm font-bold font-mono text-[#F27D26] focus:outline-none focus:border-[#F27D26]"
                />
                <span className="text-xs font-bold text-[#F27D26]">Coins</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-white/40 text-[11px]">Cost Per Click</span>
                  <div className="font-bold text-white/90 font-mono">{cpc} Coins</div>
                </div>
                <div>
                  <span className="text-white/40 text-[11px]">Estimated Clicks</span>
                  <div className="font-bold text-emerald-400 font-mono">~{estimatedClicks} Clicks</div>
                </div>
              </div>
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
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl neon-bg-orange active:scale-[0.98] text-black font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Reserving Budget & Creating...</span>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Launch Campaign ({budget} Coins)</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 2. MY CAMPAIGNS TAB */}
      {activeTab === 'my' && (
        <div className="space-y-3">
          {myCampaigns.length === 0 ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl p-8">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs mb-3">You have not created any advertising campaigns yet.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl neon-bg-orange text-black font-black text-xs uppercase tracking-tight"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            myCampaigns.map((c) => (
              <div key={c.id} className="p-4 rounded-3xl glass-card space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#F0F0F0]">{c.title}</h4>
                    <a
                      href={c.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span className="truncate max-w-[200px]">{c.destination_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : c.status === 'pending'
                        ? 'bg-[#F27D26]/10 text-[#F27D26] border-[#F27D26]/20'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-sans font-semibold">Budget</div>
                    <div className="text-xs font-bold text-white/90">{c.budget} Coins</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-sans font-semibold">Clicks</div>
                    <div className="text-xs font-bold text-sky-400">{c.clicks_count} / {c.max_clicks}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 uppercase font-sans font-semibold">Remaining</div>
                    <div className="text-xs font-bold text-[#F27D26]">{c.remaining_budget} Coins</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. BROWSE ACTIVE ADVERTISER CAMPAIGNS */}
      {activeTab === 'browse' && (
        <div className="space-y-3">
          {activeCampaigns.length === 0 ? (
            <div className="py-16 text-center text-white/40 glass-card rounded-3xl p-8">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No active user campaigns right now.</p>
            </div>
          ) : (
            activeCampaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCampaignClick(c)}
                className="cursor-pointer p-4 rounded-3xl glass-card hover:border-sky-500/40 transition-all shadow-md group flex items-start gap-3.5"
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.title}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <Megaphone className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs font-bold text-[#F0F0F0] truncate group-hover:text-sky-400 transition-colors">
                      {c.title}
                    </h4>
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-sky-400 flex-shrink-0" />
                  </div>

                  <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-2">
                    {c.description}
                  </p>

                  <div className="text-[10px] text-white/40 font-mono">
                    Sponsored • {c.clicks_count} clicks
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
