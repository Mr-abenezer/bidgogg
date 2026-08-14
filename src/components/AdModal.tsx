/**
 * BID X — Full-Screen Verified Ad Viewer Modal
 * Enforces true countdown timer, anti-cheat tokens, and server-side reward claims
 */

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, CheckCircle2, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Advertisement } from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  ad: Advertisement;
  onClose: () => void;
  onSuccess: (reward: number, newBalance: number) => void;
}

export const AdModal: React.FC<Props> = ({ ad, onClose, onSuccess }) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(ad.required_time_seconds || 15);
  const [totalSeconds, setTotalSeconds] = useState<number>(ad.required_time_seconds || 15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initialize Ad Session with backend
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await api.startAd(ad.id);
        if (res.success && res.data && isMounted) {
          setSessionToken(res.data.sessionToken);
          setTotalSeconds(res.data.requiredTime);
          setSecondsLeft(res.data.requiredTime);
        } else if (isMounted) {
          setError(res.error || 'Failed to start ad session');
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Ad session initialization error');
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [ad.id]);

  // 2. Countdown timer
  useEffect(() => {
    if (!sessionToken || isCompleted) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          haptic.success();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionToken, isCompleted]);

  // 3. Claim reward
  const handleClaimReward = async () => {
    if (!sessionToken || !isCompleted || isClaiming) return;

    setIsClaiming(true);
    setError(null);
    haptic.medium();

    try {
      const res = await api.claimAdReward(ad.id, sessionToken);
      if (res.success && res.data) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#eab308', '#38bdf8', '#22c55e', '#ffffff'],
        });
        haptic.success();
        onSuccess(res.data.reward, res.data.newBalance);
      } else {
        setError(res.error || 'Reward validation failed');
        haptic.error();
      }
    } catch (e: any) {
      setError(e.message || 'Reward claim error');
      haptic.error();
    } finally {
      setIsClaiming(false);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border-white/10">
        {/* Top bar with Countdown Timer */}
        <div className="px-5 py-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26] font-mono text-xs font-bold">
              {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : `${secondsLeft}s`}
            </div>
            <div>
              <div className="text-xs font-bold text-[#F0F0F0]">
                {isCompleted ? 'Reward Ready to Claim!' : `Watch for ${secondsLeft}s to Earn`}
              </div>
              <div className="text-[10px] text-[#F27D26] font-bold">
                +{ad.reward} Coins Reward
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1.5">
          <div
            className="h-full bg-gradient-to-r from-[#F27D26] to-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(242,125,38,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ad Media & Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {ad.image_url && (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 bg-black/40">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-[10px] font-bold text-[#F27D26] border border-[#F27D26]/30">
                Sponsored Ad
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-[#F0F0F0] mb-1">{ad.title}</h3>
            <p className="text-xs text-white/50 leading-relaxed">{ad.description}</p>
          </div>

          {/* Sponsor Destination Link */}
          <a
            href={ad.destination_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic.light()}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-sky-400 text-xs font-semibold transition-colors group"
          >
            <span>Visit Sponsor Website</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 text-[11px] text-white/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Anti-cheat verification active. Rewards are credited directly to your Coin ledger.</span>
          </div>
        </div>

        {/* Bottom Claim Action Bar */}
        <div className="p-4 bg-black/40 border-t border-white/10">
          <button
            onClick={handleClaimReward}
            disabled={!isCompleted || isClaiming}
            className={`w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-tight text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isCompleted
                ? 'neon-bg-orange text-black active:scale-[0.98]'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
            }`}
          >
            {isClaiming ? (
              <span className="animate-pulse">Validating on Server...</span>
            ) : isCompleted ? (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Claim +{ad.reward} Coins Reward</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Wait {secondsLeft}s to Claim Reward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
