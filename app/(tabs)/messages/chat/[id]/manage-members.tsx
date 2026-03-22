import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/primitives';

import { useAuth } from '@/hooks/useAuth';
import {
  useAddChatMembersMutation,
  useChatQuery,
  useFriendIdsQuery,
  useProfilesQuery,
} from '@/hooks/useApiQueries';
import { getUserFacingError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ManageChatMembersScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = session?.user?.id ?? '';

  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const { data: chat, isLoading: loadingChat } = useChatQuery(id);
  const { data: friendIds = [] } = useFriendIdsQuery(userId, { enabled: !!userId });
  const { data: profiles = [] } = useProfilesQuery(friendIds.length > 0 ? friendIds : undefined, {
    enabled: friendIds.length > 0,
  });
  const addMembersMutation = useAddChatMembersMutation();

  const memberUserIds = useMemo(
    () => new Set((chat?.members ?? []).map((m) => m.userId).filter(Boolean)),
    [chat?.members]
  );

  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.userId, p])), [profiles]);

  const friendsToAdd = useMemo(() => {
    const ids = friendIds.filter((fid) => !memberUserIds.has(fid));
    const q = search.trim().toLowerCase();
    if (!q) return ids;
    return ids.filter((fid) => {
      const p = profileMap.get(fid);
      const name = p?.displayName ?? [p?.firstName, p?.lastName].filter(Boolean).join(' ') ?? '';
      return name.toLowerCase().includes(q);
    });
  }, [friendIds, memberUserIds, search, profileMap]);

  const handleToggleUser = useCallback((uid: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const insets = useSafeAreaInsets();

  const handleSave = useCallback(() => {
    const toAdd = [...selectedUserIds];
    if (!id || !userId) return;
    if (toAdd.length === 0) {
      router.back();
      return;
    }

    addMembersMutation.mutate(
      { chatId: id, addedByUserId: userId, memberUserIds: toAdd },
      {
        onSuccess: () => router.back(),
        onError: (err) => {
          Alert.alert(t('common.error'), getUserFacingError(err));
        },
      }
    );
  }, [id, userId, selectedUserIds, addMembersMutation, router]);

  if (!userId || !id) return null;

  const isSaving = addMembersMutation.isPending;
  const bottomPadding = insets.bottom + spacing.xl;

  if (loadingChat && !chat) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={styles.subtitle}>{t('messages.selectPeopleToAddSubtitle')}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={t('messages.searchFriends')}
        placeholderTextColor={colors.ink300}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel={t('messages.searchFriends')}
      />
      {friendsToAdd.length === 0 ? (
        <Text style={styles.emptyText}>
          {memberUserIds.size > 0 ? t('messages.noFriendsToAdd') : t('messages.noFriendsSubtitle')}
        </Text>
      ) : (
        <View style={styles.friendList}>
          {friendsToAdd.map((friendId) => {
            const profile = profileMap.get(friendId);
            const displayName =
              profile?.displayName ??
              [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ??
              t('common.loading');
            const isSelected = selectedUserIds.has(friendId);
            return (
              <Pressable
                key={friendId}
                onPress={() => handleToggleUser(friendId)}
                style={[styles.friendRow, isSelected && styles.friendRowSelected]}
                accessibilityLabel={displayName}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityHint={t('messages.selectFriends')}
              >
                <Avatar
                  source={profile?.avatarUrl ? { uri: profile.avatarUrl } : null}
                  fallbackText={displayName}
                  size="md"
                />
                <Text style={styles.friendName} numberOfLines={1}>
                  {displayName}
                </Text>
                {isSelected ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={isSaving || selectedUserIds.size === 0}
          style={[
            styles.saveButton,
            (isSaving || selectedUserIds.size === 0) && styles.saveButtonDisabled,
          ]}
          accessibilityLabel={t('common.save')}
          accessibilityHint={t('profile.saveHint')}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
  searchInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface100,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  friendList: { gap: spacing.sm, marginBottom: spacing.lg },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface100,
    borderRadius: radius.card,
    gap: spacing.md,
  },
  friendRowSelected: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  friendName: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  check: {
    ...typography.label,
    color: colors.primary,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  saveButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    ...typography.label,
    color: colors.surface,
  },
});
