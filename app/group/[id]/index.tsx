import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Avatar, StackedAvatars } from '@/components/primitives';
import { EmptyState } from '@/components/patterns/EmptyState';
import { FadeActionSheet } from '@/components/patterns/FadeActionSheet';
import { GroupEventFormSheet } from '@/components/patterns/GroupEventFormSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useAnnouncementsQuery,
  useCreateGroupEventMutation,
  useDiscussionsQuery,
  useGroupAdminsQuery,
  useGroupEventsQuery,
  useGroupMembersQuery,
  useGroupQuery,
  useGroupsForUserQuery,
  useIsSuperAdminQuery,
  useJoinGroupMutation,
  useLeaveGroupMutation,
} from '@/hooks/useApiQueries';
import { getUserFacingError, isApiError } from '@/lib/api';
import { formatGroupEventDateTime, formatRelativeTime } from '@/lib/dates';
import { compareGroupEventsByStartThenCreated } from '@/lib/groupEventsSort';
import { t } from '@/lib/i18n';
import { colors, fontFamily, radius, shadow, spacing, typography } from '@/theme/tokens';

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
  const { data: groupEvents = [], refetch: refetchGroupEvents } = useGroupEventsQuery(id, {
    enabled: !!id && isMember,
  });
  const { data: members = [], refetch: refetchMembers } = useGroupMembersQuery(id, {
    enabled: !!id,
  });
  const {
    data: discussions = [],
    isLoading: discussionsLoading,
    refetch: refetchDiscussions,
  } = useDiscussionsQuery({ groupId: id, enabled: !!id });
  const { data: announcements = [], refetch: refetchAnnouncements } = useAnnouncementsQuery(id, {
    enabled: !!id,
  });
  const { data: groupAdmins = [] } = useGroupAdminsQuery(id, { enabled: !!id });
  const { data: isSuperAdmin = false } = useIsSuperAdminQuery(userId, { enabled: !!userId });
  const createEventMutation = useCreateGroupEventMutation();
  const isGroupAdmin = !!userId && groupAdmins.some((a) => a.userId === userId);
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
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
              accessibilityLabel={t('groups.editGroup')}
              accessibilityHint={t('groups.editGroupHint')}
              accessibilityRole="button"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#ffffff" />
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
      refetchAnnouncements();
      refetchGroupEvents();
    }, [
      refetchGroup,
      refetchMembership,
      refetchMembers,
      refetchDiscussions,
      refetchAnnouncements,
      refetchGroupEvents,
    ])
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

  const handleCreateAnnouncement = useCallback(() => {
    if (id) router.push(`/group/announcement/create?groupId=${id}`);
  }, [router, id]);

  const handleSeeAllAnnouncements = useCallback(() => {
    if (id) router.push(`/group/announcement/list?groupId=${id}`);
  }, [router, id]);

  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  const handleOpenCreateEvent = useCallback(() => {
    setEventFormError(null);
    setEventSheetOpen(true);
  }, []);

  const handleCloseEventSheet = useCallback(() => {
    setEventSheetOpen(false);
    setEventFormError(null);
  }, []);

  const handleSeeAllEvents = useCallback(() => {
    if (id) router.push(`/group/event/list?groupId=${id}`);
  }, [router, id]);

  const handleSubmitCreateEvent = useCallback(
    (payload: {
      title: string;
      description: string;
      location: string;
      meetingLink: string;
      startsAt: string;
      requiresRsvp: boolean;
    }) => {
      if (!userId || !id) return;
      const start = new Date(payload.startsAt);
      if (start.getTime() <= Date.now()) {
        setEventFormError(t('groupEvents.futureOnly'));
        return;
      }
      setEventFormError(null);
      createEventMutation.mutate(
        { groupId: id, userId, input: payload },
        {
          onSuccess: () => {
            setEventSheetOpen(false);
            refetchGroupEvents();
          },
          onError: (err) => {
            setEventFormError(isApiError(err) ? getUserFacingError(err) : t('common.error'));
          },
        }
      );
    },
    [userId, id, createEventMutation, refetchGroupEvents]
  );

  const publishedAnnouncements = announcements.filter((a) => a.status === 'published');
  const latestPublished =
    publishedAnnouncements.length > 0
      ? publishedAnnouncements.reduce((acc, cur) =>
          new Date(cur.createdAt) > new Date(acc.createdAt) ? cur : acc
        )
      : undefined;

  const handleOpenLatestAnnouncementDetail = useCallback(() => {
    if (!id || !latestPublished) return;
    router.push(`/group/announcement/${latestPublished.id}?groupId=${encodeURIComponent(id)}`);
  }, [router, id, latestPublished]);

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
  const memberCountLabel = `${members.length} ${members.length === 1 ? t('groups.member') : t('groups.members')}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero: Editorial featured card ── */}
      <View style={styles.heroWrap}>
        {group.bannerImageUrl ? (
          <Image
            source={{ uri: group.bannerImageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroPlaceholderBg]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,32,70,0.18)', 'rgba(0,32,70,0.88)']}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.heroTitle}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.heroDescription} numberOfLines={3}>
              {'\u201C'}
              {group.description}
              {'\u201D'}
            </Text>
          ) : null}
          <View style={styles.heroMetaRow}>
            {group.country ? (
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroMetaText}>{group.country}</Text>
              </View>
            ) : null}
            <View style={styles.heroMetaItem}>
              <Ionicons name="globe-outline" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.heroMetaText}>{languageName}</Text>
            </View>
          </View>
          <View style={styles.heroActionsColumn}>
            <View style={styles.heroPrimaryRow}>
              {isMember ? (
                <Pressable
                  onPress={handleOpenJoinedSheet}
                  style={({ pressed }) => [styles.heroJoinedPill, pressed && { opacity: 0.85 }]}
                  disabled={isJoining}
                  accessibilityLabel={t('groups.joined')}
                  accessibilityHint={t('groups.opensOptions')}
                >
                  <Ionicons name="checkmark-circle" size={15} color={colors.onSecondaryContainer} />
                  <Text style={styles.heroJoinedPillText}>{t('groups.joined')}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.onSecondaryContainer} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleJoin}
                  style={({ pressed }) => [
                    styles.heroJoinPill,
                    pressed && { opacity: 0.9 },
                    isJoining && { opacity: 0.5 },
                  ]}
                  disabled={isJoining}
                  accessibilityLabel={t('groups.join')}
                  accessibilityHint={t('groups.joinsGroupHint')}
                  accessibilityRole="button"
                >
                  {joinMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.heroJoinPillText}>{t('groups.join')}</Text>
                  )}
                </Pressable>
              )}
              <View style={styles.heroMemberCount}>
                <Ionicons name="people" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroMemberCountText}>{memberCountLabel}</Text>
              </View>
            </View>
            {(isGroupAdmin && isMember) || (isSuperAdmin && id) ? (
              <View style={styles.heroLeaderRow}>
                {isGroupAdmin && isMember ? (
                  <>
                    <Pressable
                      onPress={handleCreateAnnouncement}
                      style={({ pressed }) => [
                        styles.heroAnnounceBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityLabel={t('announcements.newAnnouncement')}
                      accessibilityHint={t('announcements.announceHint')}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="megaphone-outline"
                        size={20}
                        color={colors.onSecondaryContainer}
                      />
                    </Pressable>
                    <Pressable
                      onPress={handleOpenCreateEvent}
                      style={({ pressed }) => [
                        styles.heroAnnounceBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityLabel={t('groupEvents.newEvent')}
                      accessibilityHint={t('groupEvents.newEventHint')}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={colors.onSecondaryContainer}
                      />
                    </Pressable>
                  </>
                ) : null}
                {isSuperAdmin && id ? (
                  <Pressable
                    onPress={() => router.push(`/group/${id}/super-admin`)}
                    style={({ pressed }) => [styles.heroAnnounceBtn, pressed && { opacity: 0.85 }]}
                    accessibilityLabel={t('groups.superAdminAssignEntryLabel')}
                    accessibilityHint={t('groups.superAdminAssignEntryHint')}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={colors.onSecondaryContainer}
                    />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Content canvas ── */}
      <View style={styles.contentCanvas}>
        {error && 'message' in error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{getUserFacingError(error)}</Text>
          </View>
        ) : null}

        {/* ── Community section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('groups.people')}</Text>
            <Text style={styles.sectionCount}>{memberCountLabel}</Text>
          </View>
          <View style={styles.memberCard}>
            <Pressable
              onPress={handleSeeAllMembers}
              style={({ pressed }) => [styles.memberRow, pressed && { opacity: 0.8 }]}
              accessibilityLabel={t('groups.seeAll')}
              accessibilityHint={t('groups.viewAllMembersHint')}
            >
              <StackedAvatars members={members} maxCount={4} size="md" ringed />
              <View style={styles.memberRowRight}>
                <Text style={styles.viewAllText}>{t('groups.seeAll')}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── Announcements section (members) ── */}
        {isMember ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('announcements.sectionTitle')}</Text>
              {announcements.length > 0 ? (
                <Pressable
                  onPress={handleSeeAllAnnouncements}
                  style={styles.addTopicButton}
                  accessibilityLabel={t('announcements.seeAll')}
                  accessibilityHint={t('announcements.seeAll')}
                >
                  <Text style={styles.addTopicText}>{t('announcements.seeAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
                </Pressable>
              ) : null}
            </View>
            {latestPublished ? (
              <View style={styles.announcementCard}>
                <Pressable
                  onPress={handleOpenLatestAnnouncementDetail}
                  style={({ pressed }) => [
                    styles.announcementCardPressable,
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityLabel={latestPublished.title}
                  accessibilityHint={t('announcements.openDetailHint')}
                >
                  <Text style={styles.announcementCardTitle}>{latestPublished.title}</Text>
                  <Text style={styles.announcementPreview} numberOfLines={3}>
                    {latestPublished.body}
                  </Text>
                  <Text style={styles.announcementMeta}>
                    {latestPublished.authorDisplayName ?? t('groups.groupMember')}
                    {' \u00B7 '}
                    {formatRelativeTime(latestPublished.createdAt)}
                  </Text>
                </Pressable>
                {latestPublished.meetingLink?.trim() ? (
                  <Pressable
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(latestPublished.meetingLink.trim());
                    }}
                    style={styles.announcementMeetingLinkRow}
                    accessibilityLabel={t('groupEvents.joinMeeting')}
                    accessibilityHint={t('groupEvents.joinMeetingHint')}
                    accessibilityRole="link"
                  >
                    <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                    <Text style={styles.announcementMeetingLinkText}>
                      {t('groupEvents.joinMeeting')}
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {!latestPublished ? (
              <EmptyState
                iconName="megaphone-outline"
                title={t('announcements.noAnnouncements')}
                subtitle={t('announcements.noAnnouncementsHint')}
              />
            ) : null}
          </View>
        ) : null}

        {/* ── Events section (members) ── */}
        {isMember ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('groupEvents.sectionTitle')}</Text>
              {groupEvents.length > 0 ? (
                <Pressable
                  onPress={handleSeeAllEvents}
                  style={styles.addTopicButton}
                  accessibilityLabel={t('groupEvents.seeAll')}
                  accessibilityHint={t('groupEvents.seeAll')}
                >
                  <Text style={styles.addTopicText}>{t('groupEvents.seeAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.secondary} />
                </Pressable>
              ) : null}
            </View>
            {(() => {
              const now = Date.now();
              const upcoming = groupEvents
                .filter((e) => e.status === 'active' && new Date(e.startsAt).getTime() > now)
                .sort(compareGroupEventsByStartThenCreated)
                .slice(0, 3);
              if (upcoming.length === 0) {
                return (
                  <EmptyState
                    iconName="calendar-outline"
                    title={t('groupEvents.noEvents')}
                    subtitle={t('groupEvents.noEventsHint')}
                  />
                );
              }
              return (
                <View style={styles.eventList}>
                  {upcoming.map((ev) => (
                    <Pressable
                      key={ev.id}
                      onPress={() => router.push(`/group/event/${ev.id}`)}
                      style={({ pressed }) => [styles.eventCard, pressed && { opacity: 0.92 }]}
                      accessibilityLabel={ev.title}
                      accessibilityHint={t('groupEvents.eventTitle')}
                    >
                      <Text style={styles.eventCardTitle}>{ev.title}</Text>
                      <Text style={styles.eventCardMeta}>
                        {formatGroupEventDateTime(ev.startsAt)}
                      </Text>
                      {ev.requiresRsvp ? (
                        <Text style={styles.eventRsvpLine}>
                          {t('groupEvents.goingCount', {
                            count: ev.goingCount ?? 0,
                          })}
                          {typeof ev.maybeCount === 'number' && ev.maybeCount > 0
                            ? ` · ${t('groupEvents.maybeCount', { count: ev.maybeCount })}`
                            : ''}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              );
            })()}
          </View>
        ) : null}

        {/* ── Discussions section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('groups.discussions')}</Text>
            {isMember ? (
              <Pressable
                onPress={handleCreateDiscussion}
                style={styles.addTopicButton}
                accessibilityLabel={t('discussions.addDiscussion')}
                accessibilityHint={t('discussions.addDiscussionHint')}
              >
                <Ionicons name="add-circle" size={16} color={colors.secondary} />
                <Text style={styles.addTopicText}>{t('discussions.addDiscussion')}</Text>
              </Pressable>
            ) : null}
          </View>
          {discussionsLoading ? (
            <View style={styles.loadingWrap}>
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
                  style={({ pressed }) => [styles.discussionCard, pressed && { opacity: 0.92 }]}
                  accessibilityLabel={`${d.title}, ${d.postCount ?? 0}`}
                  accessibilityHint={t('groups.opensDiscussion')}
                >
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
                    <Text style={styles.discussionMeta} numberOfLines={1}>
                      {d.authorDisplayName ?? t('common.loading')}{' '}
                      <Text style={styles.discussionMetaDot}>{'\u00B7'}</Text>{' '}
                      {formatRelativeTime(d.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.discussionBody} numberOfLines={2}>
                    {d.body}
                  </Text>
                  <View style={styles.discussionFooter}>
                    <View style={styles.discussionStat}>
                      <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                      <Text style={styles.discussionStatText}>{d.postCount ?? 0}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── CTA for non-members ── */}
        {!isMember ? (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaHeading}>{t('groups.readyToJoin')}</Text>
            <Text style={styles.ctaBody}>{t('groups.joinCta', { name: group.name })}</Text>
            <Pressable
              onPress={handleJoin}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { transform: [{ scale: 1.03 }] },
                isJoining && { opacity: 0.5 },
              ]}
              disabled={isJoining}
              accessibilityLabel={t('groups.join')}
              accessibilityHint={t('groups.joinsGroupHint')}
              accessibilityRole="button"
            >
              {joinMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.onSecondaryContainer} />
              ) : (
                <Text style={styles.ctaButtonText}>{t('groups.join').toUpperCase()}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
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

      <GroupEventFormSheet
        visible={eventSheetOpen}
        onRequestClose={handleCloseEventSheet}
        mode="create"
        onSubmit={handleSubmitCreateEvent}
        isSubmitting={createEventMutation.isPending}
        errorMessage={eventFormError}
      />
    </ScrollView>
  );
}

const HERO_HEIGHT = 480;

const editorialShadow = {
  shadowColor: '#151c27',
  shadowOpacity: 0.06,
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 15 },
  ...Platform.select({ android: { elevation: 3 } }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  /* ── Hero ── */
  heroWrap: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroPlaceholderBg: {
    backgroundColor: colors.primaryContainer,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.chip,
    marginBottom: spacing.sm,
  },
  typeBadgeText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 34,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  heroDescription: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
    marginBottom: spacing.sm,
    maxWidth: '90%',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  heroMetaText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  heroActionsColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  heroLeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  heroJoinPill: {
    backgroundColor: '#ffffff',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 36,
  },
  heroJoinPillText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  heroJoinedPill: {
    backgroundColor: colors.secondaryContainer,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 36,
  },
  heroJoinedPillText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  heroMemberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  heroMemberCountText: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  heroAnnounceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ── Content canvas ── */
  contentCanvas: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  errorBanner: {
    backgroundColor: colors.amberSoft,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },

  /* ── Section pattern ── */
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400',
    color: colors.primary,
    letterSpacing: -0.1,
  },
  sectionCount: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },

  /* ── Community / members ── */
  memberCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  viewAllText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  /* ── Discussions ── */
  addTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  addTopicText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  announcementCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...editorialShadow,
  },
  announcementCardPressable: {
    width: '100%',
  },
  announcementMeetingLinkRow: {
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
  announcementMeetingLinkText: {
    ...typography.bodyMd,
    fontFamily: fontFamily.sansSemiBold,
    color: colors.primary,
    flex: 1,
  },
  announcementCardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '400',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  announcementPreview: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  announcementMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  eventList: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...editorialShadow,
  },
  eventCardTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    fontWeight: '400',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  eventCardMeta: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xxs,
  },
  eventRsvpLine: {
    ...typography.caption,
    color: colors.secondary,
    fontFamily: fontFamily.sansSemiBold,
    fontWeight: '600',
  },
  loadingWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  discussionList: {
    gap: spacing.md,
  },
  discussionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...editorialShadow,
  },
  discussionAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  discussionMeta: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  discussionMetaDot: {
    color: colors.outlineVariant,
  },
  discussionBody: {
    ...typography.bodyMd,
    color: colors.onSurface,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  discussionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  discussionStatText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* ── CTA (non-member) ── */
  ctaCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  ctaHeading: {
    fontFamily: fontFamily.serif,
    fontSize: 22,
    fontWeight: '400',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaBody: {
    ...typography.bodyMd,
    color: 'rgba(174,199,247,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  ctaButton: {
    backgroundColor: colors.secondaryContainer,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl + spacing.xs,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  ctaButtonText: {
    fontFamily: fontFamily.sansBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
    letterSpacing: 0.5,
  },
});
