/**
 * BID X — Earn View (Watch Ads & Tasks)
 */

import React, { useState } from 'react';
import { Zap, CheckSquare, Clock, CheckCircle2, ChevronRight, ExternalLink, Sparkles, Play, ShieldAlert } from 'lucide-react';
import { Advertisement, Task, TaskSubmission } from '../types';
import { AdModal } from './AdModal';
import { TaskSubmitModal } from './TaskSubmitModal';
import { haptic } from '../lib/telegram';

interface Props {
  ads: Advertisement[];
  tasks: Task[];
  onAdCompleted: (reward: number, newBalance: number) => void;
  onTaskSubmitted: (submission: TaskSubmission) => void;
}

export const EarnView: React.FC<Props> = ({
  ads = [],
  tasks = [],
  onAdCompleted,
  onTaskSubmitted,
}) => {
  const [subTab, setSubTab] = useState<'ads' | 'tasks'>('ads');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const safeAds = Array.isArray(ads) ? ads : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const availableAds = safeAds.filter((a) => !a.already_completed);
  const completedAds = safeAds.filter((a) => a.already_completed);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl glass-card">
        <button
          onClick={() => {
            haptic.selection();
            setSubTab('ads');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-tight ${
            subTab === 'ads'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Watch Ads ({availableAds.length})</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setSubTab('tasks');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-tight ${
            subTab === 'tasks'
              ? 'neon-bg-orange text-black'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks ({safeTasks.length})</span>
        </button>
      </div>

      {/* ADS TAB */}
      {subTab === 'ads' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-[#F27D26]/10 border border-[#F27D26]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#F27D26]">
              <Sparkles className="w-4 h-4 text-[#F27D26]" />
              <span className="font-semibold text-white/90">Watch full 15s to earn <b className="text-[#F27D26]">+5 Coins</b> per ad!</span>
            </div>
            <span className="text-[10px] font-mono bg-[#F27D26]/20 text-[#F27D26] px-2 py-0.5 rounded-full font-bold">
              Instant Credit
            </span>
          </div>

          {availableAds.length === 0 && completedAds.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No active ads available right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableAds.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => {
                    haptic.medium();
                    setSelectedAd(ad);
                  }}
                  className="cursor-pointer p-4 rounded-3xl glass-card glass-card-hover hover:border-[#F27D26]/50 transition-all shadow-md active:scale-[0.99] group flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    {ad.image_url ? (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F27D26] flex-shrink-0">
                        <Zap className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-sm font-bold text-[#F0F0F0] truncate group-hover:text-[#F27D26] transition-colors">
                          {ad.title}
                        </h4>
                        <span className="text-xs font-black font-mono text-[#F27D26] bg-[#F27D26]/10 px-2 py-0.5 rounded-lg border border-[#F27D26]/30 flex-shrink-0">
                          +{ad.reward} Coins
                        </span>
                      </div>

                      <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-2">
                        {ad.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-white/40 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ad.required_time_seconds}s view
                        </span>
                        <span>•</span>
                        <span>{ad.completions_count} completed</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-white/[0.04] group-hover:neon-bg-orange group-hover:text-black text-[#F0F0F0] text-xs font-black uppercase tracking-tight flex items-center justify-center gap-2 transition-all">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch & Earn +{ad.reward} Coins</span>
                  </button>
                </div>
              ))}

              {/* Already Completed Today */}
              {completedAds.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">
                    Completed Today ({completedAds.length})
                  </h4>
                  <div className="space-y-2">
                    {completedAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between opacity-60"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white/70 truncate">{ad.title}</span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold flex-shrink-0">
                          +{ad.reward} Claimed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TASKS TAB */}
      {subTab === 'tasks' && (
        <div className="space-y-3">
          {safeTasks.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No active tasks right now.</p>
            </div>
          ) : (
            safeTasks.map((task) => {
              const submission = task.user_submission;
              const isApproved = submission?.status === 'approved';
              const isPending = submission?.status === 'pending';

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-3xl glass-card space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#F0F0F0] mb-1">{task.title}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{task.description}</p>
                    </div>

                    <span className="text-xs font-black font-mono text-[#F27D26] bg-[#F27D26]/10 px-2.5 py-1 rounded-xl border border-[#F27D26]/30 flex-shrink-0">
                      +{task.reward} Coins
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => haptic.light()}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F27D26] bg-[#F27D26]/10 px-3 py-1 rounded-xl border border-[#F27D26]/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Under Review</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          haptic.medium();
                          setSelectedTask(task);
                        }}
                        className="px-4 py-2 rounded-xl neon-bg-orange text-black font-black text-xs uppercase tracking-tight flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                      >
                        <span>Complete Task</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Ad Modal */}
      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onSuccess={(reward, newBalance) => {
            onAdCompleted(reward, newBalance);
            setSelectedAd(null);
          }}
        />
      )}

      {/* Task Submit Modal */}
      {selectedTask && (
        <TaskSubmitModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmitted={(sub) => {
            onTaskSubmitted(sub);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
