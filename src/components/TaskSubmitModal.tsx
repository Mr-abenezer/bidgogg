/**
 * BID X — Task Submission Modal
 */

import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Task, TaskSubmission } from '../types';
import { api } from '../lib/api';
import { haptic } from '../lib/telegram';

interface Props {
  task: Task;
  onClose: () => void;
  onSubmitted: (submission: TaskSubmission) => void;
}

export const TaskSubmitModal: React.FC<Props> = ({ task, onClose, onSubmitted }) => {
  const [proofText, setProofText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (task.proof_type !== 'none' && !proofText.trim() && !proofUrl.trim()) {
      setError('Please provide proof details or confirmation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    haptic.medium();

    try {
      const res = await api.submitTask(task.id, proofText.trim(), proofUrl.trim());
      if (res.success && res.data) {
        haptic.success();
        onSubmitted(res.data);
      } else {
        setError(res.error || 'Failed to submit task');
        haptic.error();
      }
    } catch (err: any) {
      setError(err.message || 'Submission error');
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-white/10">
        {/* Header */}
        <div className="px-5 py-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#F27D26]">Complete Task</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-[#F0F0F0]">{task.title}</h3>
              <span className="text-xs font-black text-[#F27D26] bg-[#F27D26]/10 px-2 py-0.5 rounded-full border border-[#F27D26]/30">
                +{task.reward} Coins
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{task.description}</p>
          </div>

          {/* Instructions */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-white/80">Instructions:</div>
            <p className="text-xs text-white/50 whitespace-pre-line leading-relaxed">{task.instructions}</p>

            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.light()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline"
            >
              <span>Open Task Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Proof Input Fields */}
          {task.proof_type !== 'none' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {task.proof_type === 'screenshot'
                    ? 'Screenshot URL or Username Proof'
                    : 'Your Telegram Username / Answer'}
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder={
                    task.proof_type === 'screenshot'
                      ? 'e.g. Uploaded screenshot link or @my_username'
                      : 'Enter required details to verify completion'
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
                />
              </div>

              {task.proof_type === 'screenshot' && (
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Direct Image / Proof URL (Optional)</label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl neon-bg-orange active:scale-[0.98] text-black font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Submitting Proof...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit & Claim {task.reward} Coins</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
