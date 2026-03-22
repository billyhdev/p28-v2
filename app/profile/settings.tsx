import { useCallback } from 'react';
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
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useUpdateProfileMutation,
} from '@/hooks/useApiQueries';
import { getUserFacingError } from '@/lib/api';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography, minTouchTarget } from '@/theme/tokens';

type LocaleOption = 'en' | 'ko' | 'km';

const LOCALES: {
  value: LocaleOption;
  labelKey: 'language.english' | 'language.korean' | 'language.khmer';
}[] = [
  { value: 'en', labelKey: 'language.english' },
  { value: 'ko', labelKey: 'language.korean' },
  { value: 'km', labelKey: 'language.khmer' },
];

export default function SettingsScreen() {
  const { session } = useAuth();
  const { locale, setLocale } = useLocale();
  const userId = session?.user?.id;

  const {
    data: prefs,
    isLoading: loading,
    isError: prefsError,
    error: prefsErrorObj,
    refetch: fetchPrefs,
  } = useNotificationPreferencesQuery(userId);

  const updatePrefsMutation = useUpdateNotificationPreferencesMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const isSubmittingPrefs = updatePrefsMutation.isPending;
  const isSubmittingLang = updateProfileMutation.isPending;
  const mutationError = updatePrefsMutation.error ?? updateProfileMutation.error;
  const error =
    (prefsError && prefsErrorObj && 'message' in prefsErrorObj
      ? getUserFacingError(prefsErrorObj)
      : null) ??
    (mutationError && 'message' in mutationError ? getUserFacingError(mutationError) : null);

  const handleToggle = useCallback(
    (key: 'eventsEnabled' | 'announcementsEnabled' | 'messagesEnabled', value: boolean) => {
      if (!userId || !prefs) return;
      const next = {
        eventsEnabled: prefs.eventsEnabled,
        announcementsEnabled: prefs.announcementsEnabled,
        messagesEnabled: prefs.messagesEnabled,
        [key]: value,
      };
      updatePrefsMutation.mutate(
        {
          userId,
          updates: next,
        },
        { onError: () => {} }
      );
    },
    [userId, prefs, updatePrefsMutation]
  );

  const handleSelectLanguage = useCallback(
    (next: LocaleOption) => {
      if (next === locale) return;
      if (!userId) return;
      setLocale(next);
      updateProfileMutation.mutate(
        { userId, updates: { preferredLanguage: next } },
        { onError: () => {} }
      );
    },
    [locale, userId, setLocale, updateProfileMutation]
  );

  if (!userId) return null;

  if (loading && !prefs) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel={t('common.loading')}
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
        <RefreshControl refreshing={loading} onRefresh={fetchPrefs} tintColor={colors.primary} />
      }
    >
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

      {/* Notification preferences */}
      <Text style={styles.sectionTitle}>{t('profile.notificationPreferences')}</Text>
      <Text style={styles.intro}>{t('notifications.intro')}</Text>
      {showToggles ? (
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('notifications.events')}</Text>
            <Pressable
              onPress={() => prefs && handleToggle('eventsEnabled', !prefs.eventsEnabled)}
              disabled={isSubmittingPrefs}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel={t('notifications.events')}
              accessibilityHint={t('notifications.eventsHint')}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.eventsEnabled ?? true }}
            >
              <Switch
                value={prefs?.eventsEnabled ?? true}
                onValueChange={(v) => handleToggle('eventsEnabled', v)}
                disabled={isSubmittingPrefs}
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
              disabled={isSubmittingPrefs}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel={t('notifications.announcements')}
              accessibilityHint={t('notifications.announcementsHint')}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.announcementsEnabled ?? true }}
            >
              <Switch
                value={prefs?.announcementsEnabled ?? true}
                onValueChange={(v) => handleToggle('announcementsEnabled', v)}
                disabled={isSubmittingPrefs}
                trackColor={{ false: colors.surface100, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('notifications.messages')}</Text>
            <Pressable
              onPress={() => prefs && handleToggle('messagesEnabled', !prefs.messagesEnabled)}
              disabled={isSubmittingPrefs}
              style={({ pressed }) => [
                styles.toggleTouchTarget,
                pressed && styles.toggleTouchTargetPressed,
              ]}
              accessibilityLabel={t('notifications.messages')}
              accessibilityHint={t('notifications.messagesHint')}
              accessibilityRole="switch"
              accessibilityState={{ checked: prefs?.messagesEnabled ?? true }}
            >
              <Switch
                value={prefs?.messagesEnabled ?? true}
                onValueChange={(v) => handleToggle('messagesEnabled', v)}
                disabled={isSubmittingPrefs}
                trackColor={{ false: colors.surface100, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* App language */}
      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
        {t('profile.appLanguage')}
      </Text>
      <Text style={styles.intro}>{t('language.subtitle')}</Text>
      <View style={styles.card}>
        {LOCALES.map(({ value, labelKey }) => (
          <Pressable
            key={value}
            onPress={() => handleSelectLanguage(value)}
            disabled={isSubmittingLang}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
              value === locale && styles.optionRowSelected,
            ]}
            accessibilityLabel={t(labelKey)}
            accessibilityHint={t('profile.appLanguageHint')}
            accessibilityRole="button"
          >
            <Text style={styles.optionLabel}>{t(labelKey)}</Text>
            {value === locale ? <Text style={styles.optionCheck}>✓</Text> : null}
          </Pressable>
        ))}
      </View>

      {isSubmittingLang ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            accessibilityLabel={t('common.loading')}
          />
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
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionTitleSpaced: { marginTop: spacing.lg },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.xs,
    minHeight: minTouchTarget,
  },
  toggleLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  toggleTouchTarget: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTouchTargetPressed: { opacity: 0.8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.cardPadding,
    minHeight: minTouchTarget,
  },
  optionRowPressed: { backgroundColor: colors.surface100 },
  optionRowSelected: { backgroundColor: colors.brandSoft },
  optionLabel: { ...typography.body, color: colors.textPrimary },
  optionCheck: { ...typography.bodyStrong, color: colors.primary },
  loadingRow: { marginTop: spacing.md, alignItems: 'center' },
});
