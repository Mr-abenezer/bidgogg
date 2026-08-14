/**
 * BID X — Telegram WebApp SDK Integration Helper
 */

import { TelegramUser } from '../types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: TelegramUser;
          receiver?: TelegramUser;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

// Initialize Telegram WebApp viewport and header styling
export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#050505');
      tg.setBackgroundColor('#050505');
      tg.enableClosingConfirmation();
    } catch (e) {
      // ignore
    }
  }
};

// Check if running strictly inside Telegram
export const isInsideTelegram = (): boolean => {
  const webApp = getTelegramWebApp();
  if (!webApp) return false;
  // If there's valid initData or user object
  if (webApp.initData && webApp.initData.length > 0) {
    return true;
  }
  if (webApp.initDataUnsafe?.user?.id) {
    return true;
  }
  return false;
};

// Local storage key for browser testing / dev mode simulator
const DEV_SESSION_KEY = 'bidx_dev_telegram_user';

export const getDevTelegramUser = (): TelegramUser | null => {
  try {
    const raw = localStorage.getItem(DEV_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return null;
};

export const setDevTelegramUser = (user: TelegramUser | null) => {
  if (user) {
    localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(DEV_SESSION_KEY);
  }
};

// Get current Telegram User (from WebApp or dev simulator)
export const getActiveTelegramUser = (): TelegramUser | null => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user?.id) {
    return tg.initDataUnsafe.user;
  }
  return getDevTelegramUser();
};

// Get current initData string (or simulated header)
export const getTelegramInitData = (): string => {
  const tg = getTelegramWebApp();
  if (tg?.initData && tg.initData.length > 0) {
    return tg.initData;
  }
  const devUser = getDevTelegramUser();
  if (devUser) {
    // Provide simulated initData encoded string for dev mode
    const params = new URLSearchParams();
    params.set('user', JSON.stringify(devUser));
    params.set('auth_date', Math.floor(Date.now() / 1000).toString());
    params.set('is_dev_simulator', 'true');
    return params.toString();
  }
  return '';
};

// Haptic feedback triggers
export const haptic = {
  light: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('light');
    } catch (e) {}
  },
  medium: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium');
    } catch (e) {}
  },
  heavy: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy');
    } catch (e) {}
  },
  success: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success');
    } catch (e) {}
  },
  warning: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning');
    } catch (e) {}
  },
  error: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error');
    } catch (e) {}
  },
  selection: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.selectionChanged();
    } catch (e) {}
  },
};
