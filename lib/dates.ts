import { t } from '@/lib/i18n';

export function formatRelativeTime(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMins < 1) return t('common.justNow');
  if (diffMins < 60) return t('common.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('common.hoursAgo', { count: diffHours });
  if (diffDays < 30) return t('common.daysAgo', { count: diffDays });
  if (diffMonths < 12) return t('common.monthsAgo', { count: diffMonths });
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short' }).format(d);
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateHeaderFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function formatMessageTime(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return formatRelativeTime(isoDate);
  }
  return timeFormatter.format(d);
}

export function formatDateHeader(isoDate: string): string {
  return dateHeaderFormatter.format(new Date(isoDate)).toUpperCase();
}

export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
