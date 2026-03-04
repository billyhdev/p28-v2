import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { Avatar, Button } from '@/components/primitives';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';
import type { Profile } from '@/lib/api';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;
  const fetchProfile = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.data.getProfile(userId).then((r) => {
      setLoading(false);
      if (isApiError(r)) {
        setError(getUserFacingError(r));
        setProfile(null);
      } else {
        setProfile(r);
        setError(null);
      }
    });
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const displayName = profile?.displayName ?? session?.user?.email ?? 'Your profile';
  const fullName = useMemo(() => {
    const parts = [profile?.firstName, profile?.lastName].filter(Boolean) as string[];
    return parts.length ? parts.join(' ') : profile?.displayName;
  }, [profile?.firstName, profile?.lastName, profile?.displayName]);

  const birthDateLabel = useMemo(() => {
    const d = profile?.birthDate;
    if (!d) return null;
    // Stored as YYYY-MM-DD; keep formatting predictable without extra deps.
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
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.animatedContent}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.header}>
          <Avatar
            source={profile?.avatarUrl ? { uri: profile.avatarUrl } : null}
            fallbackText={displayName}
            size="lg"
            accessibilityLabel="Profile photo"
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
            title={t('profile.notificationPreferences')}
            onPress={() => router.push('/profile/notifications')}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel={t('profile.notificationPreferences')}
            accessibilityHint="Opens settings for events, announcements, and messages notifications"
          />
          <Button
            title={t('profile.appLanguage')}
            onPress={() => router.push('/profile/language')}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel={t('profile.appLanguage')}
            accessibilityHint={t('profile.appLanguageHint')}
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
  shadowOffset: shadow.card.shadowOffset,
  shadowOpacity: shadow.card.shadowOpacity,
  shadowRadius: shadow.card.shadowRadius,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  animatedContent: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerText: { flex: 1 },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  card: { ...cardStyle },
  cardTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.md },
  aboutFields: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
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
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  actionButton: { width: '100%', maxWidth: 400 },
  noticeCard: { ...cardStyle },
  noticeTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.xs },
  noticeText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorBanner: {
    backgroundColor: colors.surfaceHighlight,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
