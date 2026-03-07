import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '@/hooks/useAuth';
import { usePendingFriendRequestCountQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const router = useRouter();
  const { data: pendingCount } = usePendingFriendRequestCountQuery(userId);

  const hasNotifications = pendingCount != null && pendingCount > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, !hasNotifications && styles.scrollContentEmpty]}
      showsVerticalScrollIndicator={false}
    >
      {hasNotifications ? (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/(tabs)/notifications/friend-requests')}
          accessibilityLabel={t('notifications.friendRequests')}
          accessibilityHint={t('notifications.friendRequestsHint')}
          accessibilityRole="button"
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('notifications.friendRequests')}</Text>
            <Text style={styles.cardSubtitle}>
              {pendingCount} {t('notifications.pendingCount')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink300} />
        </Pressable>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.ink300} />
          <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
          <Text style={styles.emptySubtitle}>{t('notifications.noNotificationsSubtitle')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.cardPadding,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: shadow.cardSoft.shadowOffset,
    shadowOpacity: shadow.cardSoft.shadowOpacity,
    shadowRadius: shadow.cardSoft.shadowRadius,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
