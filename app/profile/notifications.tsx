import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography, minTouchTarget } from '@/theme/tokens';
import type { NotificationPreferences } from '@/lib/api';

export default function NotificationPreferencesScreen() {
  const { session } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const requestIdRef = useRef(0);

  const userId = session?.user?.id;

  const fetchPrefs = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.data.getNotificationPreferences(userId).then((r) => {
      setLoading(false);
      if (isApiError(r)) {
        setError(getUserFacingError(r));
        setPrefs(null);
      } else {
        setPrefs(r);
        setError(null);
      }
    });
  }, [userId]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = async (
    key: 'eventsEnabled' | 'announcementsEnabled' | 'messagesEnabled',
    value: boolean
  ) => {
    if (!userId || !prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setIsSubmitting(true);
    setError(null);
    const id = ++requestIdRef.current;
    const result = await api.data.updateNotificationPreferences(userId, {
      eventsEnabled: next.eventsEnabled,
      announcementsEnabled: next.announcementsEnabled,
      messagesEnabled: next.messagesEnabled,
    });
    setIsSubmitting(false);
    if (id !== requestIdRef.current) return; // Stale response, ignore
    if (isApiError(result)) {
      setError(getUserFacingError(result));
      setPrefs(prefs);
    } else {
      setPrefs(result);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  if (!userId) return null;

  if (loading && !prefs) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel={t('notifications.loadingLabel')}
        />
      </View>
    );
  }

  const showToggles = prefs != null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading && !!prefs}
          onRefresh={fetchPrefs}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.intro}>{t('notifications.intro')}</Text>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => fetchPrefs()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            accessibilityLabel={t('notifications.retry')}
            accessibilityHint={t('notifications.retryHint')}
          >
            <Text style={styles.retryButtonText}>{t('notifications.retry')}</Text>
          </Pressable>
        </View>
      ) : null}
      {savedFeedback ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{t('notifications.saved')}</Text>
        </View>
      ) : null}

      {showToggles ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('notifications.typesTitle')}</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('notifications.events')}</Text>
            <Pressable
              onPress={() => prefs && handleToggle('eventsEnabled', !prefs.eventsEnabled)}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel="Events notifications"
              accessibilityHint="Toggles events notifications on or off"
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.eventsEnabled ?? true }}
            >
              <Switch
                value={prefs?.eventsEnabled ?? true}
                onValueChange={(v) => handleToggle('eventsEnabled', v)}
                disabled={isSubmitting}
                trackColor={{ false: colors.surface100, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('notifications.announcements')}</Text>
            <Pressable
              onPress={() =>
                prefs && handleToggle('announcementsEnabled', !prefs.announcementsEnabled)
              }
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel="Announcements notifications"
              accessibilityHint="Toggles announcements notifications on or off"
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.announcementsEnabled ?? true }}
            >
              <Switch
                value={prefs?.announcementsEnabled ?? true}
                onValueChange={(v) => handleToggle('announcementsEnabled', v)}
                disabled={isSubmitting}
                trackColor={{ false: colors.surface100, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('notifications.messages')}</Text>
            <Pressable
              onPress={() => prefs && handleToggle('messagesEnabled', !prefs.messagesEnabled)}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel="Messages notifications"
              accessibilityHint="Toggles messages notifications on or off"
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.messagesEnabled ?? true }}
            >
              <Switch
                value={prefs?.messagesEnabled ?? true}
                onValueChange={(v) => handleToggle('messagesEnabled', v)}
                disabled={isSubmitting}
                trackColor={{ false: colors.surface100, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.cardPadding,
  marginBottom: spacing.cardGap,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.xs },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  retryButtonPressed: { opacity: 0.8 },
  retryButtonText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  successBanner: {
    backgroundColor: colors.greenSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  successText: { ...typography.body, color: colors.success },
  card: { ...cardStyle },
  cardTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    minHeight: minTouchTarget + spacing.sm,
  },
  toggleLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  toggleTouchTarget: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTouchTargetPressed: { opacity: 0.8 },
});
