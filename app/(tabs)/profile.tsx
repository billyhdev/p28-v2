import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery } from '@/hooks/useApiQueries';
import { getUserFacingError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { Avatar, Button } from '@/components/primitives';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';

// Pill height + outer padding; extra buffer so sign out button clears the floating tab bar
const FLOATING_TAB_BAR_HEIGHT = 110;

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = session?.user?.id;
  const { data: profile, isLoading: loading, isError, error, refetch } = useProfileQuery(userId);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const errorMessage = isError && error && 'message' in error ? getUserFacingError(error) : null;

  const displayName = profile?.displayName ?? session?.user?.email ?? 'Your profile';
  const fullName = useMemo(() => {
    const parts = [profile?.firstName, profile?.lastName].filter(Boolean) as string[];
    return parts.length ? parts.join(' ') : profile?.displayName;
  }, [profile?.firstName, profile?.lastName, profile?.displayName]);

  const birthDateLabel = useMemo(() => {
    const d = profile?.birthDate;
    if (!d) return null;
    return d;
  }, [profile?.birthDate]);

  const isLegacyProfile = !!profile && (!profile.firstName || !profile.lastName);

  const handleSignOutPress = useCallback(() => {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('auth.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  if (loading && !profile) {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: FLOATING_TAB_BAR_HEIGHT + insets.bottom },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.animatedContent}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <Avatar
            source={profile?.avatarUrl ? { uri: profile.avatarUrl } : null}
            fallbackText={displayName}
            size="xl"
            accessibilityLabel={t('profile.profilePhoto')}
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{fullName || t('profile.title')}</Text>
            {session?.user?.email ? (
              <Text style={styles.subtitle}>{session.user.email}</Text>
            ) : null}
          </View>
        </View>

        {isLegacyProfile ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('profile.completeProfile')}</Text>
            <Text style={styles.noticeText}>{t('profile.completeProfileHint')}</Text>
            <Button
              title={t('profile.completeOnboarding')}
              onPress={() => router.push('/auth/onboarding')}
              variant="secondary"
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.about')}</Text>
          <View style={styles.aboutFields}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.displayName')}</Text>
              <Text style={styles.rowValue}>{profile?.displayName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.firstName')}</Text>
              <Text style={styles.rowValue}>{profile?.firstName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.lastName')}</Text>
              <Text style={styles.rowValue}>{profile?.lastName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.birthDate')}</Text>
              <Text style={styles.rowValue}>{birthDateLabel ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.country')}</Text>
              <Text style={styles.rowValue}>{profile?.country ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('profile.preferredLanguage')}</Text>
              <Text style={styles.rowValue}>
                {profile?.preferredLanguage === 'en'
                  ? t('language.english')
                  : profile?.preferredLanguage === 'ko'
                    ? t('language.korean')
                    : profile?.preferredLanguage === 'km'
                      ? t('language.khmer')
                      : (profile?.preferredLanguage ?? '—')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.bio')}</Text>
          <Text style={styles.bio}>{profile?.bio ?? t('profile.bioPlaceholder')}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('profile.editProfile')}
            onPress={() => router.push('/profile/edit')}
            variant="primary"
            style={styles.actionButton}
            accessibilityLabel={t('profile.editProfile')}
          />
          <Button
            title={t('profile.settings')}
            onPress={() => router.push('/profile/settings')}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel={t('profile.settings')}
            accessibilityHint={t('profile.settingsHint')}
          />
          <Button
            title={t('conduct.title')}
            onPress={() => router.push('/profile/conduct')}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel={t('conduct.title')}
            accessibilityHint={t('conduct.openHint')}
          />
          <Button
            title={t('profile.signOut')}
            onPress={handleSignOutPress}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel={t('profile.signOut')}
            accessibilityHint="Opens a confirmation before signing out"
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.cardPadding,
  marginBottom: spacing.cardGap,
  shadowColor: colors.shadow,
  shadowOffset: shadow.cardSoft.shadowOffset,
  shadowOpacity: shadow.cardSoft.shadowOpacity,
  shadowRadius: shadow.cardSoft.shadowRadius,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
  },
  animatedContent: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: { flex: 1 },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  card: { ...cardStyle },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.sm },
  aboutFields: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: { ...typography.caption, color: colors.textSecondary },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right' as const,
    flexShrink: 1,
  },
  bio: { ...typography.body, color: colors.textSecondary },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  actionButton: { width: '100%', maxWidth: 400 },
  noticeCard: { ...cardStyle, backgroundColor: colors.brandSoft },
  noticeTitle: { ...typography.cardTitle, color: colors.primary, marginBottom: spacing.xs },
  noticeText: { ...typography.body, color: colors.ink700, marginBottom: spacing.sm },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
