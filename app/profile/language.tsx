import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
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

export default function LanguageScreen() {
  const { session } = useAuth();
  const { locale, setLocale } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const userId = session?.user?.id;

  const handleSelect = useCallback(
    async (next: LocaleOption) => {
      if (next === locale) return;
      if (!userId) return;
      setLocale(next);
      setIsSubmitting(true);
      setError(null);
      const result = await api.data.updateProfile(userId, { preferredLanguage: next });
      setIsSubmitting(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
      }
    },
    [locale, userId, setLocale]
  );

  if (!userId) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {savedFeedback ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{t('language.updated')}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        {LOCALES.map(({ value, labelKey }) => (
          <Pressable
            key={value}
            onPress={() => handleSelect(value)}
            disabled={isSubmitting}
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

      {isSubmitting ? (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.cardPadding,
    minHeight: minTouchTarget,
  },
  optionRowPressed: {
    backgroundColor: colors.surfaceHighlight,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceHighlight,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionCheck: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: colors.surfaceHighlight,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.button,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  successBanner: {
    backgroundColor: colors.surfaceHighlight,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.button,
  },
  successText: {
    ...typography.body,
    color: colors.success,
  },
  loadingRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
});
