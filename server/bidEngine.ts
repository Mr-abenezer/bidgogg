/**
 * BID X — Real-Time Authoritative Bid & Win Engine
 * Handles live auction rounds, 60s countdown resets, atomic bids, and 85/15 prize payouts
 */

import { BidRound, Bid } from '../src/types';
import { db } from './db';
import { botNotify } from './botNotifier';

class BidEngine {
  private activeRound: BidRound | null = null;
  private roundHistory: BidRound[] = [];
  private bids: Bid[] = [];
  private roundCounter = 1;
  private timerInterval: NodeJS.Timeout | null = null;
  private isProcessingBid = false;

  constructor() {
    this.initFirstRound();
    this.startTicker();
  }

  private async initFirstRound() {
    const settings = await db.getPlatformSettings();
    const timerSeconds = settings.bid_timer_seconds || 60;
    const now = Date.now();

    this.activeRound = {
      id: 'rnd-' + this.roundCounter + '-' + Date.now().toString(36),
      round_number: this.roundCounter,
      bid_cost: settings.bid_amount || 10.0,
      total_pool: 0.0,
      winner_percentage: settings.winner_percentage || 85,
      platform_percentage: settings.platform_percentage || 15,
      last_bidder_id: null,
      last_bidder_username: null,
      last_bidder_name: null,
      last_bidder_photo: null,
      last_bid_at: null,
      timer_seconds: timerSeconds,
      deadline: new Date(now + timerSeconds * 1000).toISOString(),
      status: 'active',
      winner_id: null,
      winner_amount: 0,
      platform_amount: 0,
      started_at: new Date(now).toISOString(),
      seconds_left: timerSeconds,
    };
  }

  private startTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private async tick() {
    if (!this.activeRound || this.activeRound.status !== 'active') return;

    // If no bids placed yet, keep timer refreshed so it's ready for first bidder
    if (!this.activeRound.last_bidder_id) {
      const now = Date.now();
      this.activeRound.deadline = new Date(now + this.activeRound.timer_seconds * 1000).toISOString();
      this.activeRound.seconds_left = this.activeRound.timer_seconds;
      return;
    }

    const now = Date.now();
    const deadlineTime = new Date(this.activeRound.deadline).getTime();
    const remainingMs = deadlineTime - now;
    const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

    this.activeRound.seconds_left = remainingSecs;

    // Check if round has ended (deadline reached with active bids)
    if (remainingSecs <= 0) {
      await this.finalizeRound(this.activeRound);
    }
  }

  private async finalizeRound(round: BidRound) {
    if (round.status !== 'active') return;

    round.status = 'completed';
    round.ended_at = new Date().toISOString();
    round.seconds_left = 0;

    const winnerId = round.last_bidder_id;
    if (winnerId && round.total_pool > 0) {
      const winnerShare = Number(((round.total_pool * round.winner_percentage) / 100).toFixed(2));
      const platformShare = Number(((round.total_pool * round.platform_percentage) / 100).toFixed(2));

      round.winner_id = winnerId;
      round.winner_amount = winnerShare;
      round.platform_amount = platformShare;

      // Credit winner with winning coins
      await db.creditCoins(
        winnerId,
        winnerShare,
        'bid_winnings',
        `Won Bid & Win Round #${round.round_number} (${round.winner_percentage}% of ${round.total_pool} Coins pool)`,
        round.id
      );

      // Telegram Bot notification
      botNotify.roundWon(winnerId, round.round_number, winnerShare);
    }

    this.roundHistory.unshift({ ...round });

    // Start next round after 3 seconds
    setTimeout(async () => {
      this.roundCounter++;
      const settings = await db.getPlatformSettings();
      const timerSecs = settings.bid_timer_seconds || 60;
      const now = Date.now();

      this.activeRound = {
        id: 'rnd-' + this.roundCounter + '-' + Date.now().toString(36),
        round_number: this.roundCounter,
        bid_cost: settings.bid_amount || 10.0,
        total_pool: 0.0,
        winner_percentage: settings.winner_percentage || 85,
        platform_percentage: settings.platform_percentage || 15,
        last_bidder_id: null,
        last_bidder_username: null,
        last_bidder_name: null,
        last_bidder_photo: null,
        last_bid_at: null,
        timer_seconds: timerSecs,
        deadline: new Date(now + timerSecs * 1000).toISOString(),
        status: 'active',
        winner_id: null,
        winner_amount: 0,
        platform_amount: 0,
        started_at: new Date(now).toISOString(),
        seconds_left: timerSecs,
      };
    }, 3000);
  }

  // Atomic Place Bid
  async placeBid(
    roundId: string,
    user: { id: number; username?: string | null; first_name?: string | null; photo_url?: string | null }
  ): Promise<{ success: boolean; round?: BidRound; balance?: number; error?: string }> {
    // Acquire mutex lock
    while (this.isProcessingBid) {
      await new Promise((r) => setTimeout(r, 10));
    }
    this.isProcessingBid = true;

    try {
      if (!this.activeRound || this.activeRound.status !== 'active') {
        return { success: false, error: 'Round is no longer active or has completed' };
      }

      const now = Date.now();
      const deadlineTime = new Date(this.activeRound.deadline).getTime();
      if (now >= deadlineTime && this.activeRound.last_bidder_id && this.activeRound.seconds_left <= 0) {
        return { success: false, error: 'Round timer has expired' };
      }

      const bidCost = this.activeRound.bid_cost;

      // Debit coins from user
      const debit = await db.debitCoins(
        user.id,
        bidCost,
        'bid_payment',
        `Bid in Round #${this.activeRound.round_number}`,
        this.activeRound.id
      );

      if (!debit.success) {
        return { success: false, error: debit.error || 'Insufficient Coin balance to place bid' };
      }

      const previousBidderId = this.activeRound.last_bidder_id;

      // Increment pool & update round state
      this.activeRound.total_pool = Number((this.activeRound.total_pool + bidCost).toFixed(2));
      this.activeRound.last_bidder_id = user.id;
      this.activeRound.last_bidder_username = user.username || null;
      this.activeRound.last_bidder_name = user.first_name || 'Bidder';
      this.activeRound.last_bidder_photo = user.photo_url || null;
      this.activeRound.last_bid_at = new Date(now).toISOString();

      // Reset timer to configured seconds (default 60s)
      this.activeRound.deadline = new Date(now + this.activeRound.timer_seconds * 1000).toISOString();
      this.activeRound.seconds_left = this.activeRound.timer_seconds;

      // Record bid in bid stream
      const bidRecord: Bid = {
        id: 'bid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        round_id: this.activeRound.id,
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || 'Bidder',
        bid_amount: bidCost,
        pool_after: this.activeRound.total_pool,
        bid_time: new Date(now).toISOString(),
      };
      this.bids.unshift(bidRecord);
      if (this.bids.length > 200) this.bids.pop();

      // Notify previous bidder that they were outbid
      if (previousBidderId && previousBidderId !== user.id) {
        botNotify.outbid(
          previousBidderId,
          this.activeRound.round_number,
          user.first_name || `@${user.username || 'User'}`,
          this.activeRound.total_pool
        );
      }

      return {
        success: true,
        round: this.activeRound,
        balance: debit.newBalance,
      };
    } finally {
      this.isProcessingBid = false;
    }
  }

  getActiveRound(): { round: BidRound | null; bids: Bid[]; recentWinners: BidRound[] } {
    if (this.activeRound && this.activeRound.status === 'active') {
      const now = Date.now();
      const deadline = new Date(this.activeRound.deadline).getTime();
      this.activeRound.seconds_left = this.activeRound.last_bidder_id
        ? Math.max(0, Math.ceil((deadline - now) / 1000))
        : this.activeRound.timer_seconds;
    }

    const roundBids = this.activeRound ? this.bids.filter((b) => b.round_id === this.activeRound!.id).slice(0, 30) : [];
    const recentWinners = this.roundHistory.filter((r) => r.winner_id).slice(0, 10);

    return {
      round: this.activeRound,
      bids: roundBids,
      recentWinners,
    };
  }

  getAllRounds(): BidRound[] {
    const list = [...this.roundHistory];
    if (this.activeRound) list.unshift(this.activeRound);
    return list;
  }

  async forceFinishRound(roundId: string): Promise<boolean> {
    if (this.activeRound && this.activeRound.id === roundId) {
      await this.finalizeRound(this.activeRound);
      return true;
    }
    return false;
  }

  async createNewRound(config: {
    bid_cost: number;
    timer_seconds: number;
    winner_percentage: number;
    platform_percentage: number;
  }): Promise<BidRound> {
    if (this.activeRound && this.activeRound.status === 'active') {
      await this.finalizeRound(this.activeRound);
    }

    this.roundCounter++;
    const now = Date.now();

    this.activeRound = {
      id: 'rnd-' + this.roundCounter + '-' + Date.now().toString(36),
      round_number: this.roundCounter,
      bid_cost: config.bid_cost,
      total_pool: 0.0,
      winner_percentage: config.winner_percentage,
      platform_percentage: config.platform_percentage,
      last_bidder_id: null,
      last_bidder_username: null,
      last_bidder_name: null,
      last_bidder_photo: null,
      last_bid_at: null,
      timer_seconds: config.timer_seconds,
      deadline: new Date(now + config.timer_seconds * 1000).toISOString(),
      status: 'active',
      winner_id: null,
      winner_amount: 0,
      platform_amount: 0,
      started_at: new Date(now).toISOString(),
      seconds_left: config.timer_seconds,
    };

    return this.activeRound;
  }
}

export const bidEngine = new BidEngine();
