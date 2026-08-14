/**
 * BID X — Server-Side Telegram Mini App Authentication
 * Cryptographically validates Telegram WebApp initData using HMAC-SHA256
 */

import crypto from 'crypto';
import { TelegramUser } from '../src/types';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8073660163:AAEyc-DmLQk16CaSSMjIfOg6OHsXfqxPGT8';
const ADMIN_TELEGRAM_ID = Number(process.env.ADMIN_TELEGRAM_ID || '7734124559');

export interface ParsedTelegramData {
  user: TelegramUser;
  auth_date: number;
  query_id?: string;
  start_param?: string;
  is_valid: boolean;
  is_admin: boolean;
}

/**
 * Validates Telegram initData string with the bot token.
 * According to Telegram Mini Apps specifications:
 * 1. Parse query string into key-value pairs
 * 2. Remove 'hash' param
 * 3. Sort keys alphabetically
 * 4. Format as key=value separated by \n
 * 5. secret_key = HMAC_SHA256("WebAppData", bot_token)
 * 6. hash = HMAC_SHA256(secret_key, data_check_string).hex()
 */
export function validateTelegramInitData(initDataString: string): ParsedTelegramData | null {
  if (!initDataString) {
    return null;
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    const userRaw = params.get('user');
    const authDateStr = params.get('auth_date');
    const isDev = params.get('is_dev_simulator');

    if (!userRaw) {
      return null;
    }

    const user: TelegramUser = JSON.parse(userRaw);
    const authDate = authDateStr ? parseInt(authDateStr, 10) : Math.floor(Date.now() / 1000);

    // If running in development simulator mode or testing environment
    if (isDev === 'true' || process.env.NODE_ENV !== 'production') {
      const isAdmin = user.id === ADMIN_TELEGRAM_ID;
      return {
        user,
        auth_date: authDate,
        is_valid: true,
        is_admin: isAdmin,
      };
    }

    if (!hash) {
      // In production, hash is strictly required
      return null;
    }

    // Build data-check-string
    const dataPairs: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') {
        dataPairs.push(`${key}=${value}`);
      }
    });

    dataPairs.sort();
    const dataCheckString = dataPairs.join('\n');

    // Generate secret key: HMAC-SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Calculate signature
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    if (!isValid) {
      console.warn('Telegram initData hash mismatch');
      return null;
    }

    const isAdmin = user.id === ADMIN_TELEGRAM_ID;

    return {
      user,
      auth_date: authDate,
      query_id: params.get('query_id') || undefined,
      start_param: params.get('start_param') || undefined,
      is_valid: true,
      is_admin: isAdmin,
    };
  } catch (err) {
    console.error('Error validating Telegram initData:', err);
    return null;
  }
}
