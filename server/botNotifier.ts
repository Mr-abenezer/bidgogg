/**
 * BID X — Telegram Bot Notification Dispatcher
 * Sends real Telegram messages to users for game events, earnings, and withdrawals
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8073660163:AAEyc-DmLQk16CaSSMjIfOg6OHsXfqxPGT8';
const APP_URL = process.env.APP_URL || 'http://t.me/BidX_SmartEarningsbot/Earn';

export async function sendTelegramNotification(
  telegramId: number,
  text: string,
  options?: {
    buttonText?: string;
    buttonUrl?: string;
  }
): Promise<boolean> {
  if (!BOT_TOKEN || !telegramId) {
    return false;
  }

  try {
    const payload: any = {
      chat_id: telegramId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };

    if (options?.buttonText && options?.buttonUrl) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            {
              text: options.buttonText,
              web_app: { url: options.buttonUrl },
            },
          ],
        ],
      };
    } else if (APP_URL) {
      payload.reply_markup = {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Bid X App',
              url: APP_URL,
            },
          ],
        ],
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn(`Telegram notification to ${telegramId} notice:`, result.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to send Telegram notification to ${telegramId}:`, err);
    return false;
  }
}

export const botNotify = {
  welcome: async (telegramId: number, firstName: string) => {
    const msg = `⚡ <b>Welcome to Bid X, ${firstName}!</b>\n\nYour account has been automatically activated. Start earning Coins now by watching ads, completing tasks, and participating in live <b>Bid & Win</b> rounds!\n\n💰 <i>1 Coin = 0.0006 USDT</i>\n🎯 Minimum Withdrawal: 300 Coins`;
    return sendTelegramNotification(telegramId, msg);
  },

  rewardEarned: async (telegramId: number, amount: number, source: string) => {
    const msg = `🎉 <b>Reward Credited!</b>\n\nYou received <b>+${amount} Coins</b> for completing ${source}.\nCheck your updated balance in the Bid X Mini App!`;
    return sendTelegramNotification(telegramId, msg);
  },

  outbid: async (telegramId: number, roundNumber: number, newBidder: string, currentPool: number) => {
    const msg = `⚠️ <b>You've been outbid!</b>\n\nIn Round #${roundNumber}, <b>${newBidder}</b> just placed a bid! The prize pool is now <b>${currentPool.toLocaleString()} Coins</b>.\n\n⏳ Timer reset to 60 seconds! Bid again now to win!`;
    return sendTelegramNotification(telegramId, msg);
  },

  roundWon: async (telegramId: number, roundNumber: number, prizeCoins: number) => {
    const msg = `🏆 <b>CONGRATULATIONS! YOU WON ROUND #${roundNumber}!</b>\n\n🎉 You were the final bidder and won <b>${prizeCoins.toLocaleString()} Coins</b> (85% of the pool)!\n\nThe coins have been credited to your Bid X wallet balance.`;
    return sendTelegramNotification(telegramId, msg);
  },

  withdrawalStatus: async (telegramId: number, amount: number, status: string, details?: string) => {
    let statusText = status.toUpperCase();
    let emoji = '💳';
    if (status === 'completed') emoji = '✅';
    if (status === 'rejected') emoji = '❌';
    if (status === 'processing') emoji = '⏳';

    const msg = `${emoji} <b>Withdrawal Update: ${statusText}</b>\n\nYour withdrawal request for <b>${amount} Coins</b> is now <b>${status}</b>.${details ? `\n\n<i>${details}</i>` : ''}`;
    return sendTelegramNotification(telegramId, msg);
  },

  campaignApproved: async (telegramId: number, campaignTitle: string) => {
    const msg = `📢 <b>Campaign Approved!</b>\n\nYour advertisement campaign "<b>${campaignTitle}</b>" is now live and driving real Telegram user engagement!`;
    return sendTelegramNotification(telegramId, msg);
  },
};
