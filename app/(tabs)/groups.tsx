import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyState } from '@/components/patterns/EmptyState';
import { GroupCard } from '@/components/patterns/GroupCard';
import { useAuth } from '@/hooks/useAuth';
import { useGroupsQuery, useGroupsForUserQuery, useIsAdminQuery } from '@/hooks/useApiQueries';
import { getUserFacingError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import type { GroupType } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type FilterType = 'all' | 'joined' | GroupType;

export default function GroupsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const p = params?.filter as FilterType | undefined;
    if (p && ['all', 'joined', 'forum', 'ministry'].includes(p)) {
      setFilter(p);
    }
  }, [params?.filter]);

  const userId = session?.user?.id;
  const typeFilter = filter === 'all' || filter === 'joined' ? undefined : filter;
  const {
    data: groups = [],
    isLoading,
    isError,
    error,
    refetch: refetchGroups,
  } = useGroupsQuery({
    type: typeFilter,
    search,
    enabled: !!userId,
  });
  const { data: memberGroups = [], refetch: refetchMemberGroups } = useGroupsForUserQuery(userId);
  const { data: isAdminFromApi } = useIsAdminQuery(userId);
  const email = session?.user?.email?.toLowerCase();
  const isAdmin = isAdminFromApi === true || email === 'billyhdev@gmail.com';

  const memberGroupIds = new Set(memberGroups.map((g) => g.id));

  const showAddGroup = isAdmin;

  useFocusEffect(
    useCallback(() => {
      setFilter('all');
      refetchGroups();
      refetchMemberGroups();
    }, [refetchGroups, refetchMemberGroups])
  );

  useLayoutEffect(() => {
    const buttons: React.ReactNode[] = [];
    if (showAddGroup) {
      buttons.push(
        <Pressable
          key="create-group"
          onPress={() => router.push('/group/create')}
          accessibilityLabel={t('groups.createGroup')}
          accessibilityHint={t('groups.createGroupHint')}
          hitSlop={8}
        >
          {({ pressed }) => (
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={colors.primary}
              style={{ marginRight: spacing.md, opacity: pressed ? 0.6 : 1 }}
            />
          )}
        </Pressable>
      );
    }
    navigation.setOptions({
      headerRight:
        buttons.length > 0
          ? () => <View style={{ flexDirection: 'row', alignItems: 'center' }}>{buttons}</View>
          : undefined,
    });
  }, [showAddGroup, navigation, router]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('groups.title')}</Text>
          <Text style={styles.subtitle}>{t('groups.subtitle')}</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.ink300}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t('groups.searchPlaceholder')}
              placeholderTextColor={colors.ink300}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              accessibilityLabel={t('groups.searchPlaceholder')}
              accessibilityHint={t('groups.searchGroupsHint')}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'joined', 'forum', 'ministry'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              accessibilityLabel={
                f === 'all'
                  ? t('groups.filterAll')
                  : f === 'joined'
                    ? t('groups.filterJoined')
                    : f === 'forum'
                      ? t('groups.filterForums')
                      : t('groups.filterMinistries')
              }
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all'
                  ? t('groups.filterAll')
                  : f === 'joined'
                    ? t('groups.filterJoined')
                    : f === 'forum'
                      ? t('groups.filterForums')
                      : t('groups.filterMinistries')}
              </Text>
            </Pressable>
          ))}
        </View>

        {isError && error && 'message' in error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{getUserFacingError(error)}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          (() => {
            const displayed =
              filter === 'joined' ? groups.filter((g) => memberGroupIds.has(g.id)) : groups;
            return displayed.length === 0 ? (
              <EmptyState
                iconName="people-outline"
                title={
                  filter === 'joined'
                    ? t('groups.noJoinedGroups')
                    : search || filter !== 'all'
                      ? t('groups.noGroupsFound')
                      : t('groups.noGroups')
                }
                subtitle={
                  filter === 'joined'
                    ? t('groups.noJoinedGroupsSubtitle')
                    : search || filter !== 'all'
                      ? t('groups.tryDifferentSearch')
                      : t('groups.groupsWillAppear')
                }
              />
            ) : (
              <View style={styles.list}>
                {displayed.map((group) => (
                  <GroupCard key={group.id} group={group} isMember={memberGroupIds.has(group.id)} />
                ))}
              </View>
            );
          })()
        )}
      </Animated.View>
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
    paddingBottom: 100, // Space for floating tab bar
  },
  content: { flex: 1 },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  errorBanner: {
    backgroundColor: colors.amberSoft,
    padding: spacing.md,
    borderRadius: radius.button,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  loading: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  list: {
    gap: spacing.cardGap,
  },
});
