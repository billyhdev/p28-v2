import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
import { api, isApiError } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import type { Group, GroupType } from '@/lib/api';
import { colors, spacing, typography } from '@/theme/tokens';

type FilterType = 'all' | GroupType;

export default function GroupsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberGroupIds, setMemberGroupIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadGroups = useCallback(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const typeFilter = filter === 'all' ? undefined : filter;
    api.data
      .getGroups({ type: typeFilter, search: search.trim() || undefined })
      .then((r) => {
        if (isApiError(r)) {
          setError(getUserFacingError(r));
          setGroups([]);
        } else {
          setGroups(r);
        }
      })
      .finally(() => setIsLoading(false));
  }, [session?.user?.id, filter, search]);

  const loadGroupsRef = useRef(loadGroups);
  loadGroupsRef.current = loadGroups;

  const loadMemberGroups = useCallback(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    api.data.getGroupsForUser(userId).then((r) => {
      if (!isApiError(r)) {
        setMemberGroupIds(new Set(r.map((g) => g.id)));
      }
    });
  }, [session?.user?.id]);

  const loadAdminStatus = useCallback(() => {
    const userId = session?.user?.id;
    const email = session?.user?.email?.toLowerCase();
    if (!userId) return;
    api.data.isAdmin(userId).then((r) => {
      const fromApi = !isApiError(r) && r === true;
      const superAdminFallback = email === 'billyhdev@gmail.com';
      setIsAdmin(fromApi || superAdminFallback);
    });
  }, [session?.user?.id, session?.user?.email]);

  useFocusEffect(
    useCallback(() => {
      loadGroupsRef.current();
      loadMemberGroups();
      loadAdminStatus();
    }, [loadMemberGroups, loadAdminStatus])
  );

  const isFirstMount = useRef(true);
  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(loadGroups, 300);
    return () => clearTimeout(timer);
  }, [filter, search, loadGroups]);

  useLayoutEffect(() => {
    if (!isAdmin) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
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
      ),
    });
  }, [isAdmin, navigation, router]);

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
              accessibilityHint="Search groups by name"
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'forum', 'ministry'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              accessibilityLabel={
                f === 'all'
                  ? t('groups.filterAll')
                  : f === 'forum'
                    ? t('groups.filterForums')
                    : t('groups.filterMinistries')
              }
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all'
                  ? t('groups.filterAll')
                  : f === 'forum'
                    ? t('groups.filterForums')
                    : t('groups.filterMinistries')}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            title={search || filter !== 'all' ? t('groups.noGroupsFound') : t('groups.noGroups')}
            subtitle={
              search || filter !== 'all'
                ? 'Try a different search or filter'
                : 'Groups will appear here once they are created.'
            }
          />
        ) : (
          <View style={styles.list}>
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} isMember={memberGroupIds.has(group.id)} />
            ))}
          </View>
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
    paddingBottom: spacing.xl,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    color: colors.surface,
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
  loading: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  list: {
    gap: spacing.cardGap,
  },
});
