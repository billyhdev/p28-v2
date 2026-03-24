import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';

import { useAnnouncementsQuery, useGroupAdminsQuery, useGroupQuery } from '@/hooks/useApiQueries';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { formatRelativeTime } from '@/lib/dates';
import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';
import type { Announcement } from '@/lib/api';

function statusLabel(status: Announcement['status']): string {
  if (status === 'cancelled') return t('announcements.cancelled');
  return t('announcements.published');
}

export default function AnnouncementListScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: group } = useGroupQuery(groupId);
  const { data: announcements = [], isLoading } = useAnnouncementsQuery(groupId, {
    enabled: !!groupId,
  });
  const { data: admins = [] } = useGroupAdminsQuery(groupId, { enabled: !!groupId });
  const isGroupAdmin = !!userId && admins.some((a) => a.userId === userId);

  useEffect(() => {
    if (!groupId) {
      router.back();
    }
  }, [groupId, router]);

  const renderItem = useCallback(
    ({ item }: { item: Announcement }) => {
      const showStatusBadge = isGroupAdmin && item.status !== 'published';
      return (
        <Pressable
          onPress={() => {
            router.push(`/group/announcement/${item.id}?groupId=${encodeURIComponent(groupId)}`);
          }}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
          accessibilityLabel={item.title}
          accessibilityHint={t('announcements.openDetailHint')}
          accessibilityRole="button"
        >
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              {item.authorAvatarUrl ? (
                <Image
                  source={{ uri: item.authorAvatarUrl }}
                  style={styles.avatar}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={18} color={colors.onSurfaceVariant} />
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {item.authorDisplayName ?? t('groups.groupMember')}
                </Text>
                <Text style={styles.dateText}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
            </View>
            {showStatusBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          {item.meetingLink?.trim() ? (
            <Pressable
              onPress={() => {
                void WebBrowser.openBrowserAsync(item.meetingLink.trim());
              }}
              style={styles.meetingLinkRow}
              accessibilityLabel={t('groupEvents.joinMeeting')}
              accessibilityHint={t('groupEvents.joinMeetingHint')}
              accessibilityRole="link"
            >
              <Ionicons name="videocam-outline" size={18} color={colors.primary} />
              <Text style={styles.meetingLinkText}>{t('groupEvents.joinMeeting')}</Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </Pressable>
          ) : null}
        </Pressable>
      );
    },
    [groupId, isGroupAdmin, router]
  );

  if (!groupId) {
    return null;
  }

  return (
    <View style={styles.container}>
      {group ? <Text style={styles.screenTitle}>{group.name}</Text> : null}
      <Text style={styles.sectionTitle}>{t('announcements.listTitle')}</Text>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('announcements.noAnnouncements')}</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const editorialShadow = {
  shadowColor: '#151c27',
  shadowOpacity: 0.06,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 15 },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  screenTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...editorialShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  authorName: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 13,
    color: colors.onSurface,
  },
  dateText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  badge: {
    backgroundColor: colors.amberSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.chip,
  },
  badgeText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 10,
    color: colors.onSecondaryContainer,
  },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 22,
  },
  meetingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  meetingLinkText: {
    ...typography.bodyMd,
    fontFamily: fontFamily.sansSemiBold,
    color: colors.primary,
    flex: 1,
  },
  empty: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
