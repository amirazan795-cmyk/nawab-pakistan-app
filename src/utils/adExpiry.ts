import { Product } from '../types';

export const AD_EXPIRY_DAYS = 7;
export const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const AD_EXPIRY_MS = AD_EXPIRY_DAYS * DAY_IN_MS;

export interface AdExpiryInfo {
  isExpired: boolean;
  daysRemaining: number;
  expiresAtMs: number;
  label: string;
}

export function getAdSortTimestampMs(product: Product): number {
  const iso = product.renewedAtIso || product.createdAtIso;
  if (iso) {
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (typeof product.expiresAtMs === 'number' && Number.isFinite(product.expiresAtMs)) {
    return product.expiresAtMs - AD_EXPIRY_MS;
  }
  return 0;
}

/**
 * Seller & Admin only: shows remaining days before 7-day auto-expiry ("7 days left", "6 days left", "1 day left", "Expired").
 */
export function getAdExpiryInfo(product: Product, nowMs: number = Date.now()): AdExpiryInfo {
  let expiresAtMs: number;

  if (typeof product.expiresAtMs === 'number' && Number.isFinite(product.expiresAtMs)) {
    expiresAtMs = product.expiresAtMs;
  } else {
    const startMs = getAdSortTimestampMs(product);
    expiresAtMs = startMs > 0 ? startMs + AD_EXPIRY_MS : nowMs + AD_EXPIRY_MS;
  }

  const remainingMs = expiresAtMs - nowMs;
  const isExpired = remainingMs <= 0;
  const daysRemaining = isExpired
    ? 0
    : Math.min(AD_EXPIRY_DAYS, Math.max(1, Math.ceil(remainingMs / DAY_IN_MS)));

  const label = isExpired
    ? 'Expired'
    : daysRemaining === 1
    ? '1 day left'
    : `${daysRemaining} days left`;

  return {
    isExpired,
    daysRemaining,
    expiresAtMs,
    label,
  };
}

/**
 * Buyer-facing English posted time label ("Just now", "5 mins ago", "2 hours ago", "22 hours ago", "1 day ago", "2 days ago").
 */
export function getAdPostedAgoLabel(product: Product, nowMs: number = Date.now()): string {
  const postedMs = getAdSortTimestampMs(product);
  if (postedMs <= 0) {
    return 'Just now';
  }

  const diffMs = Math.max(0, nowMs - postedMs);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / DAY_IN_MS);

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffHours < 1) {
    return diffMinutes === 1 ? '1 min ago' : `${diffMinutes} mins ago`;
  }
  if (diffDays < 1) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
}

/**
 * Normalizes any legacy Roman Urdu or mixed timestamp labels back to English.
 */
export function toEnglishTimeText(raw?: string): string {
  const val = (raw || '').trim();
  if (!val) return 'Just now';
  const lower = val.toLowerCase();
  if (lower === 'abhi abhi' || lower === 'just now' || lower === 'now') return 'Just now';
  if (lower === 'aaj' || lower === 'today') return 'Today';
  if (lower.startsWith('aaj,')) return `Today,${val.slice(4)}`;
  if (lower === 'kal' || lower === 'yesterday') return 'Yesterday';
  return val;
}
