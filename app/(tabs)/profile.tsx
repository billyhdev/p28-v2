import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { api, isApiError } from '@/lib/api';
import { Avatar, Button } from '@/components/primitives';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';
import type { Profile } from '@/lib/api';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const userId = session?.user?.id;
  const fetchProfile = useCallback(() => {
    if (!userId) return;
    api.data.getProfile(userId).then((r) => {
      if (!isApiError(r)) setProfile(r);
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
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ]
    );
  }, [signOut]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.animatedContent}>
        <View style={styles.header}>
          <Avatar
            source={profile?.avatarUrl ? { uri: profile.avatarUrl } : null}
            fallbackText={displayName}
            size="lg"
            accessibilityLabel="Profile photo"
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>{fullName || 'Profile'}</Text>
            {session?.user?.email ? (
              <Text style={styles.subtitle}>{session.user.email}</Text>
            ) : null}
          </View>
        </View>

        {isLegacyProfile ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Complete your profile</Text>
            <Text style={styles.noticeText}>
              Add your name, country, and preferred language so your profile looks great across the
              app.
            </Text>
            <Button
              title="Complete onboarding"
              onPress={() => router.push('/auth/onboarding')}
              variant="secondary"
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.aboutFields}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Display name</Text>
              <Text style={styles.rowValue}>{profile?.displayName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>First name</Text>
              <Text style={styles.rowValue}>{profile?.firstName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Last name</Text>
              <Text style={styles.rowValue}>{profile?.lastName ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Birth date</Text>
              <Text style={styles.rowValue}>{birthDateLabel ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Country</Text>
              <Text style={styles.rowValue}>{profile?.country ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Preferred language</Text>
              <Text style={styles.rowValue}>{profile?.preferredLanguage ?? '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bio</Text>
          <Text style={styles.bio}>
            {profile?.bio ?? 'Add a short bio to help others get to know you.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Edit profile"
            onPress={() => router.push('/profile/edit')}
            variant="primary"
            style={styles.actionButton}
            accessibilityLabel="Edit profile"
          />
          <Button
            title="Sign out"
            onPress={handleSignOutPress}
            variant="secondary"
            style={styles.actionButton}
            accessibilityLabel="Sign out"
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
});
