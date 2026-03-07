import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Avatar } from '@/components/primitives';
import { EmptyState } from '@/components/patterns/EmptyState';
import { FadeActionSheet } from '@/components/patterns/FadeActionSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useDiscussionsQuery,
  useGroupQuery,
  useGroupMembersQuery,
  useGroupsForUserQuery,
  useJoinGroupMutation,
  useLeaveGroupMutation,
} from '@/hooks/useApiQueries';
import { getUserFacingError } from '@/lib/api';
import { formatRelativeTime } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    en: t('language.english'),
    km: t('language.khmer'),
    ko: t('language.korean'),
  };
  return map[code] ?? code;
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const {
    data: group,
    isLoading,
    isError: isGroupError,
    error: groupError,
    refetch: refetchGroup,
  } = useGroupQuery(id);
  const { data: memberGroups = [], refetch: refetchMembership } = useGroupsForUserQuery(userId);
  const isMember = !!id && memberGroups.some((g) => g.id === id);
  const { data: members = [], refetch: refetchMembers } = useGroupMembersQuery(id, {
    enabled: !!id,
  });
  const {
    data: discussions = [],
    isLoading: discussionsLoading,
    refetch: refetchDiscussions,
  } = useDiscussionsQuery({ groupId: id, enabled: !!id });

  const joinMutation = useJoinGroupMutation();
  const leaveMutation = useLeaveGroupMutation();
  const isJoining = joinMutation.isPending || leaveMutation.isPending;

  const isCreator = !!userId && !!group && group.createdByUserId === userId;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isCreator
        ? () => (
            <Pressable
              onPress={() => id && router.push(`/group/edit?groupId=${id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8, marginRight: 4 })}
              accessibilityLabel={t('groups.editGroup')}
              accessibilityHint={t('groups.editGroupHint')}
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={24} color={colors.primary} />
            </Pressable>
          )
        : undefined,
    });
  }, [isCreator, id, navigation, router]);

  const mutationError = joinMutation.error ?? leaveMutation.error;
  const error =
    (isGroupError && groupError && 'message' in groupError ? groupError : null) ?? mutationError;

  useFocusEffect(
    useCallback(() => {
      refetchGroup();
      refetchMembership();
      refetchMembers();
      refetchDiscussions();
    }, [refetchGroup, refetchMembership, refetchMembers, refetchDiscussions])
  );

  const handleJoin = useCallback(() => {
    if (!userId || !id) return;
    joinMutation.mutate(
      { groupId: id, userId },
      {
        onError: () => {},
      }
    );
  }, [userId, id, joinMutation]);

  const handleLeave = useCallback(() => {
    if (!userId || !id) return;
    leaveMutation.mutate(
      { groupId: id, userId },
      {
        onError: () => {},
      }
    );
  }, [userId, id, leaveMutation]);

  const handleCreateDiscussion = useCallback(() => {
    router.push(`/group/discussion/create?groupId=${id}`);
  }, [router, id]);

  const handleSeeAllMembers = useCallback(() => {
    router.push(`/group/members?groupId=${id}`);
  }, [router, id]);

  const [joinedSheetVisible, setJoinedSheetVisible] = useState(false);

  const handleOpenJoinedSheet = useCallback(() => {
    setJoinedSheetVisible(true);
  }, []);

  const handleCloseJoinedSheet = useCallback(() => {
    setJoinedSheetVisible(false);
  }, []);

  const handleManageSettings = useCallback(() => {
    router.push(`/group/settings?groupId=${id}`);
  }, [router, id]);

  if (!id) {
    router.back();
    return null;
  }

  if ((isLoading && !group) || (isGroupError && !group)) {
    return (
      <View style={styles.centered}>
        {isGroupError ? (
          <Text style={styles.errorText}>
            {groupError && 'message' in groupError
              ? getUserFacingError(groupError)
              : t('common.error')}
          </Text>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }

  if (!group) {
    return null;
  }

  const typeLabel = group.type === 'forum' ? t('groups.forum') : t('groups.ministry');
  const languageName = getLanguageName(group.preferredLanguage);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {group.bannerImageUrl ? (
        <Image
          source={{ uri: group.bannerImageUrl }}
          style={styles.banner}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="people-outline" size={48} color={colors.ink300} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{typeLabel}</Text>
          <View style={styles.badgeRowRight}>
            {group.country && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.location}>{group.country}</Text>
              </View>
            )}
            <View
              style={styles.languageMeta}
              accessibilityLabel={t('groups.language')}
              accessibilityHint={languageName}
            >
              <Ionicons name="language-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.languageText}>{languageName}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.name}>{group.name}</Text>

        {group.description ? (
          <View style={styles.section}>
            <Text style={styles.description}>{group.description}</Text>
          </View>
        ) : null}

        {error && 'message' in error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{getUserFacingError(error)}</Text>
          </View>
        ) : null}

        <View style={styles.peopleSection}>
          <View style={styles.peopleHeader}>
            <Text style={styles.peopleSectionTitle}>{t('groups.people')}</Text>
            <Pressable
              onPress={handleSeeAllMembers}
              style={({ pressed }) => [styles.seeAllLink, pressed && styles.seeAllLinkPressed]}
              accessibilityLabel={t('groups.seeAll')}
              accessibilityHint={t('groups.viewAllMembersHint')}
            >
              <Text style={styles.seeAllText}>{t('groups.seeAll')}</Text>
            </Pressable>
          </View>
          <View style={styles.peopleContent}>
            <View style={styles.peopleAvatars}>
              {members.slice(0, 3).map((m, idx) => (
                <View
                  key={m.userId}
                  style={[styles.peopleAvatarWrap, { marginLeft: idx > 0 ? -12 : 0 }]}
                >
                  <Avatar
                    source={m.avatarUrl ? { uri: m.avatarUrl } : null}
                    fallbackText={m.displayName}
                    size="md"
                    ringed
                    accessibilityLabel={
                      m.displayName
                        ? `${m.displayName} ${t('groups.profilePicture')}`
                        : `${t('groups.groupMember')} ${idx + 1}`
                    }
                  />
                </View>
              ))}
            </View>
            <Text style={styles.memberCount}>
              {members.length} {members.length === 1 ? t('groups.member') : t('groups.members')}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {isMember ? (
            <Pressable
              onPress={handleOpenJoinedSheet}
              style={({ pressed }) => [styles.joinedButton, pressed && styles.joinedButtonPressed]}
              disabled={isJoining}
              accessibilityLabel={t('groups.joined')}
              accessibilityHint={t('groups.opensOptions')}
            >
              <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.joinedButtonText}>{t('groups.joined')}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleJoin}
              style={({ pressed }) => [
                styles.joinButton,
                pressed && styles.joinButtonPressed,
                isJoining && styles.joinButtonDisabled,
              ]}
              disabled={isJoining}
              accessibilityLabel={t('groups.join')}
              accessibilityHint={t('groups.joinsGroupHint')}
              accessibilityRole="button"
            >
              {joinMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={colors.onPrimary} />
                  <Text style={styles.joinButtonText}>{t('groups.join')}</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.discussionsSection}>
          <View style={styles.discussionsHeader}>
            <Text style={[styles.sectionTitle, styles.discussionsSectionTitle]}>
              {t('groups.discussions')}
            </Text>
            {isMember ? (
              <Pressable
                onPress={handleCreateDiscussion}
                style={styles.createDiscussionButton}
                accessibilityLabel={t('discussions.addDiscussion')}
                accessibilityHint={t('discussions.addDiscussionHint')}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                <Text style={styles.createDiscussionText}>{t('discussions.addDiscussion')}</Text>
              </Pressable>
            ) : null}
          </View>
          {discussionsLoading ? (
            <View style={styles.discussionsLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : discussions.length === 0 ? (
            <EmptyState
              iconName="chatbubble-outline"
              title={t('discussions.noDiscussions')}
              subtitle={t('discussions.noDiscussionsHint')}
            />
          ) : (
            <View style={styles.discussionList}>
              {discussions.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => router.push(`/group/discussion/${d.id}`)}
                  style={styles.discussionCard}
                  accessibilityLabel={`${d.title}, ${d.postCount ?? 0}`}
                  accessibilityHint={t('groups.opensDiscussion')}
                >
                  <View style={styles.discussionTopRight}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={colors.textSecondary}
                      style={styles.replyIcon}
                    />
                    <Text style={styles.discussionReplies}>{d.postCount ?? 0}</Text>
                  </View>
                  <Text style={styles.discussionTitle} numberOfLines={2}>
                    {d.title}
                  </Text>
                  <Text style={styles.discussionMeta} numberOfLines={2}>
                    {d.body}
                  </Text>
                  <View style={styles.discussionBottom}>
                    <View style={styles.discussionAuthorRow}>
                      <Avatar
                        source={d.authorAvatarUrl ? { uri: d.authorAvatarUrl } : null}
                        fallbackText={d.authorDisplayName}
                        size="sm"
                        accessibilityLabel={
                          d.authorDisplayName
                            ? `${d.authorDisplayName} ${t('groups.profilePicture')}`
                            : t('groups.originalPoster')
                        }
                      />
                      <Text style={styles.discussionAuthor} numberOfLines={1}>
                        {d.authorDisplayName ?? t('common.loading')}
                      </Text>
                    </View>
                    <Text style={styles.discussionDate}>{formatRelativeTime(d.createdAt)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <FadeActionSheet
        visible={joinedSheetVisible}
        onRequestClose={handleCloseJoinedSheet}
        options={[
          {
            icon: 'notifications-outline',
            label: t('groups.manageNotifications'),
            onPress: handleManageSettings,
            accessibilityHint: t('groups.opensNotificationSettings'),
          },
          {
            icon: 'exit-outline',
            label: t('groups.leaveGroup'),
            onPress: handleLeave,
            destructive: true,
            accessibilityHint: t('groups.leavesGroupHint'),
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  banner: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface100,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  badgeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: 'auto',
  },
  badge: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  languageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  languageText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: colors.amberSoft,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  peopleSection: {
    marginBottom: spacing.xl,
  },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  peopleSectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  peopleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  peopleAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peopleAvatarWrap: {
    zIndex: 1,
  },
  seeAllLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  seeAllLinkPressed: {
    opacity: 0.7,
  },
  seeAllText: {
    ...typography.label,
    color: colors.primary,
  },
  memberCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  joinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface100,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  joinedButtonPressed: {
    opacity: 0.8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
  },
  joinButtonPressed: {
    opacity: 0.9,
  },
  joinButtonDisabled: {
    opacity: 0.4,
  },
  joinButtonText: {
    ...typography.buttonLabel,
    color: colors.onPrimary,
  },
  joinedButtonText: {
    ...typography.label,
    color: colors.textPrimary,
  },
  discussionsSection: {
    marginTop: spacing.lg,
  },
  discussionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  discussionsSectionTitle: {
    marginBottom: 0,
  },
  createDiscussionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createDiscussionText: {
    ...typography.label,
    color: colors.primary,
  },
  discussionsLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  discussionList: {
    gap: spacing.md,
  },
  discussionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  discussionTopRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  replyIcon: {
    marginRight: 0,
  },
  discussionReplies: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  discussionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingRight: 80,
  },
  discussionMeta: {
    ...typography.body,
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  discussionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discussionAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  discussionAuthor: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  discussionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
