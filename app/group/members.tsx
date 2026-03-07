import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/primitives';
import { EmptyState } from '@/components/patterns/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useFriendIdsQuery, useGroupMembersQuery, useGroupQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? '';

  const { isLoading: groupLoading } = useGroupQuery(groupId);
  const { data: members = [], isLoading: membersLoading } = useGroupMembersQuery(groupId);
  const { data: friendIds = [] } = useFriendIdsQuery(currentUserId || undefined);
  const friendSet = new Set(friendIds);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0
      ),
    [members, currentUserId]
  );

  const handleMemberPress = useCallback(
    (memberId: string) => {
      router.push(`/profile/${memberId}`);
    },
    [router]
  );

  if (!groupId) {
    router.back();
    return null;
  }

  if (groupLoading || membersLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>
        {members.length} {members.length === 1 ? t('groups.member') : t('groups.members')}
      </Text>
      {members.length === 0 ? (
        <EmptyState
          iconName="people-outline"
          title={t('groups.noMembers')}
          subtitle={t('groups.noMembersSubtitle')}
        />
      ) : (
        <View style={styles.list}>
          {sortedMembers.map((m) => {
            const isSelf = m.userId === currentUserId;
            const rowContent = (
              <>
                <Avatar
                  source={m.avatarUrl ? { uri: m.avatarUrl } : null}
                  fallbackText={m.displayName}
                  size="md"
                  accessibilityLabel={
                    m.displayName
                      ? `${m.displayName} ${t('groups.profilePicture')}`
                      : t('groups.groupMember')
                  }
                />
                <View style={styles.memberInfo}>
                  <Text
                    style={isSelf ? styles.memberNameMuted : styles.memberName}
                    numberOfLines={1}
                  >
                    {m.displayName ?? t('common.loading')}
                  </Text>
                  {isSelf ? (
                    <Text style={styles.friendLabel}>{t('groups.yourself')}</Text>
                  ) : currentUserId && friendSet.has(m.userId) ? (
                    <Text style={styles.friendLabel}>{t('friends.friend')}</Text>
                  ) : null}
                </View>
              </>
            );
            if (isSelf) {
              return (
                <View
                  key={m.userId}
                  style={[styles.memberRow, styles.memberRowSelf]}
                  accessibilityLabel={
                    m.displayName
                      ? `${m.displayName}, ${t('groups.yourself')}`
                      : t('groups.yourself')
                  }
                >
                  {rowContent}
                </View>
              );
            }
            return (
              <Pressable
                key={m.userId}
                onPress={() => handleMemberPress(m.userId)}
                style={({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]}
                accessibilityLabel={m.displayName ?? t('groups.groupMember')}
                accessibilityHint={t('groups.opensProfile')}
              >
                {rowContent}
              </Pressable>
            );
          })}
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
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  memberRowSelf: {
    opacity: 0.55,
  },
  memberRowPressed: {
    opacity: 0.8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  memberNameMuted: {
    ...typography.body,
    color: colors.textSecondary,
  },
  friendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
