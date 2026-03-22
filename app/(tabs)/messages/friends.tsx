import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '@/components/primitives';
import { EmptyState } from '@/components/patterns/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import {
  useFriendIdsQuery,
  useProfilesQuery,
  useReceivedFriendRequestsQuery,
  useSearchProfilesQuery,
  useSentFriendRequestsQuery,
} from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import type { Profile } from '@/lib/api';
import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';

function getDisplayName(profile: Profile | undefined): string {
  return (
    profile?.displayName ??
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ??
    t('common.loading')
  );
}

export default function FriendsListScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const userId = session?.user?.id;
  const [search, setSearch] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { data: friendIds = [], isLoading } = useFriendIdsQuery(userId);
  const { data: profiles = [] } = useProfilesQuery(friendIds.length > 0 ? friendIds : undefined);
  const { data: receivedRequests = [] } = useReceivedFriendRequestsQuery(userId);
  const { data: sentRequests = [] } = useSentFriendRequestsQuery(userId);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.userId, p])), [profiles]);

  const trimmedSearch = search.trim();
  const { data: searchResults = [], isLoading: isSearching } = useSearchProfilesQuery(
    trimmedSearch,
    userId,
    { enabled: trimmedSearch.length >= 2 }
  );

  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  const pendingPeople = useMemo(() => {
    const items: { userId: string; profile: Profile }[] = [];
    for (const r of receivedRequests) {
      items.push({
        userId: r.senderId,
        profile: {
          userId: r.senderId,
          displayName: r.senderDisplayName,
          avatarUrl: r.senderAvatarUrl,
        },
      });
    }
    for (const r of sentRequests) {
      items.push({
        userId: r.receiverId,
        profile: {
          userId: r.receiverId,
          displayName: r.receiverDisplayName,
          avatarUrl: r.receiverAvatarUrl,
        },
      });
    }
    const seen = new Set<string>();
    return items.filter(({ userId: id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [receivedRequests, sentRequests]);

  const filteredPendingPeople = useMemo(() => {
    if (!trimmedSearch) return pendingPeople;
    const q = trimmedSearch.toLowerCase();
    return pendingPeople.filter(({ profile }) => {
      const name = (profile.displayName ?? '').toLowerCase();
      return name.includes(q);
    });
  }, [pendingPeople, trimmedSearch]);

  const pendingIdSet = useMemo(() => new Set(pendingPeople.map((p) => p.userId)), [pendingPeople]);

  const sortedFriendIds = useMemo(() => {
    return [...friendIds].sort((a, b) => {
      const nameA = getDisplayName(profileMap.get(a));
      const nameB = getDisplayName(profileMap.get(b));
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [friendIds, profileMap]);

  const filteredFriendIds = useMemo(() => {
    if (!trimmedSearch) return sortedFriendIds;
    const q = trimmedSearch.toLowerCase();
    return sortedFriendIds.filter((id) => {
      const name = getDisplayName(profileMap.get(id)).toLowerCase();
      return name.includes(q);
    });
  }, [sortedFriendIds, profileMap, trimmedSearch]);

  const otherPeopleProfiles = useMemo(() => {
    if (trimmedSearch.length < 2) return [];
    return searchResults.filter((p) => !friendIdSet.has(p.userId) && !pendingIdSet.has(p.userId));
  }, [searchResults, friendIdSet, pendingIdSet, trimmedSearch]);

  const sections = useMemo(() => {
    const result: { title: string; data: { userId: string; profile: Profile }[] }[] = [];
    if (filteredPendingPeople.length > 0) {
      result.push({
        title: t('messages.pendingSection'),
        data: filteredPendingPeople,
      });
    }
    if (filteredFriendIds.length > 0) {
      result.push({
        title: t('messages.friendsSection'),
        data: filteredFriendIds.map((id) => ({
          userId: id,
          profile: profileMap.get(id)!,
        })),
      });
    }
    if (otherPeopleProfiles.length > 0) {
      result.push({
        title: t('messages.otherPeopleSection'),
        data: otherPeopleProfiles.map((p) => ({ userId: p.userId, profile: p })),
      });
    }
    return result;
  }, [filteredPendingPeople, filteredFriendIds, profileMap, otherPeopleProfiles]);

  const handlePersonPress = (targetUserId: string) => {
    router.push(`/profile/${targetUserId}`);
  };

  if (!userId) {
    return null;
  }

  const showSearchResults = trimmedSearch.length >= 2;
  const hasAnyResults =
    filteredPendingPeople.length > 0 ||
    filteredFriendIds.length > 0 ||
    otherPeopleProfiles.length > 0;
  const showEmptyState =
    !isLoading &&
    (!showSearchResults && sortedFriendIds.length === 0 && pendingPeople.length === 0
      ? {
          empty: true,
          title: t('messages.friendsListEmpty'),
          subtitle: t('messages.friendsListEmptySubtitle'),
        }
      : showSearchResults && !hasAnyResults
        ? {
            empty: true,
            title: t('messages.noSearchResults'),
            subtitle: t('messages.noSearchResultsSubtitle'),
          }
        : null);

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.heading}>{t('messages.friendsList')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('messages.searchFriendsAndPeople')}
          placeholderTextColor={`${colors.onSurfaceVariant}99`}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          accessibilityLabel={t('messages.searchFriendsAndPeople')}
          accessibilityHint={t('messages.searchFriendsAndPeopleHint')}
        />
      </View>
    </View>
  );

  const renderPersonRow = ({ item }: { item: { userId: string; profile: Profile } }) => {
    const displayName = getDisplayName(item.profile);
    return (
      <Pressable
        onPress={() => handlePersonPress(item.userId)}
        style={({ pressed }) => [styles.personRow, pressed && styles.personRowPressed]}
        accessibilityLabel={displayName}
        accessibilityHint={t('messages.viewProfileHint')}
        accessibilityRole="button"
      >
        <Avatar
          source={item.profile.avatarUrl ? { uri: item.profile.avatarUrl } : null}
          fallbackText={displayName}
          size="md"
        />
        <Text style={styles.personName} numberOfLines={1}>
          {displayName}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          {renderListHeader()}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </>
      ) : showEmptyState ? (
        <>
          {renderListHeader()}
          <View style={styles.emptyWrap}>
            <EmptyState
              iconName="people-outline"
              title={showEmptyState.title}
              subtitle={showEmptyState.subtitle}
            />
          </View>
        </>
      ) : showSearchResults && isSearching && sections.length === 0 ? (
        <>
          {renderListHeader()}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.userId}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={renderListHeader}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={renderPersonRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fontFamily.serifBold,
    fontSize: 30,
    color: colors.primary,
    letterSpacing: -0.3,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 14,
  },

  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xs,
  },
  personRowPressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  personName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    color: colors.onSurface,
    flex: 1,
  },
});
