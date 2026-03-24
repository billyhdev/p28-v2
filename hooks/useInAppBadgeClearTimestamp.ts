import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (userId: string) => `@p28/in_app_notification_badge_cleared_at:${userId}`;

/**
 * Persists when the user last focused the Notifications tab so the tab badge can
 * ignore older unread in-app rows (badge clears) while `read_at` stays null until
 * the user opens each notification.
 */
export function useInAppBadgeClearTimestamp(userId: string | undefined) {
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setClearedAt(null);
      setHydrated(true);
      return;
    }
    setHydrated(false);
    setClearedAt(null);
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        if (!cancelled) {
          setClearedAt(raw);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const recordNotificationsTabVisited = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    try {
      await AsyncStorage.setItem(storageKey(userId), now);
    } catch {
      // Still update in-memory so the badge reacts; persistence can retry next visit.
    }
    setClearedAt(now);
  }, [userId]);

  return { badgeClearedAt: clearedAt, recordNotificationsTabVisited, hydrated };
}
