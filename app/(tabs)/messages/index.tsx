import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { StackedAvatars } from '@/components/primitives';
import { FriendPickerSheet } from '@/components/messages';
import { EmptyState } from '@/components/patterns/EmptyState';
import { FadeActionSheet } from '@/components/patterns/FadeActionSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useChatFoldersQuery,
  useChatsForUserQuery,
  useCreateChatMutation,
  useDeleteChatFolderMutation,
} from '@/hooks/useApiQueries';
import { api, getUserFacingError, type ApiError, type Chat, type ChatFolder } from '@/lib/api';
import { formatRelativeTime } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { colors, fontFamily, radius, shadow, spacing, typography } from '@/theme/tokens';

const CHAT_AVATAR_SIZE = 56;

function ChatAvatar({
  imageUrl,
  fallbackText,
  isFirstChat,
}: {
  imageUrl?: string | null;
  fallbackText: string;
  isFirstChat?: boolean;
}) {
  const initial = fallbackText ? fallbackText.trim().charAt(0).toUpperCase() : '?';

  return (
    <View style={avatarStyles.wrapper}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={avatarStyles.image}
          contentFit="cover"
          accessibilityRole="image"
        />
      ) : (
        <View style={[avatarStyles.image, avatarStyles.fallback]}>
          <Text style={avatarStyles.fallbackText}>{initial}</Text>
        </View>
      )}
      {isFirstChat && <View style={avatarStyles.onlineIndicator} />}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  wrapper: {
    width: CHAT_AVATAR_SIZE,
    height: CHAT_AVATAR_SIZE,
    position: 'relative',
  },
  image: {
    width: CHAT_AVATAR_SIZE,
    height: CHAT_AVATAR_SIZE,
    borderRadius: CHAT_AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: CHAT_AVATAR_SIZE * 0.36,
    color: colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
});

function ChatRow({
  chat,
  currentUserId,
  onPress,
  isFirst,
}: {
  chat: Chat;
  currentUserId: string;
  onPress: () => void;
  isFirst: boolean;
}) {
  const otherMembers = (chat.members ?? []).filter((m) => m.userId && m.userId !== currentUserId);
  const hasOtherMembers = otherMembers.length > 0;
  const isGroupChat = otherMembers.length > 1;

  const displayName =
    chat.name?.trim() ||
    chat.participantDisplayNames ||
    (hasOtherMembers
      ? otherMembers.map((m) => m.displayName ?? t('common.loading')).join(', ')
      : t('messages.lastMessage'));

  const firstOtherMember = otherMembers[0];
  const avatarUrl = chat.imageUrl || firstOtherMember?.avatarUrl;
  const fallbackText = displayName?.slice(0, 2) ?? '?';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chatRow,
        isFirst && styles.chatRowFirst,
        pressed && styles.chatRowPressed,
      ]}
      accessibilityLabel={displayName}
      accessibilityHint={t('messages.lastMessage')}
      accessibilityRole="button"
    >
      {isGroupChat && !chat.imageUrl ? (
        <StackedAvatars
          members={chat.members ?? []}
          excludeUserId={currentUserId}
          maxCount={3}
          size="lg"
          ringed
        />
      ) : (
        <ChatAvatar imageUrl={avatarUrl} fallbackText={fallbackText} isFirstChat={isFirst} />
      )}

      <View style={styles.chatRowContent}>
        <View style={styles.chatRowHeader}>
          <Text style={[styles.chatName, !isFirst && styles.chatNameSecondary]} numberOfLines={1}>
            {displayName}
          </Text>
          {chat.lastMessageAt && (
            <Text style={styles.chatTime}>{formatRelativeTime(chat.lastMessageAt)}</Text>
          )}
        </View>
        {chat.lastMessagePreview ? (
          <Text style={[styles.chatPreview, isFirst && styles.chatPreviewFirst]} numberOfLines={1}>
            {chat.lastMessagePreview}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MessagesIndexScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = session?.user?.id;

  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [folderOptionsFolder, setFolderOptionsFolder] = useState<ChatFolder | null>(null);
  const [friendPickerVisible, setFriendPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: chats = [],
    isLoading,
    refetch,
  } = useChatsForUserQuery(userId, { folderId: selectedFolderId });
  const { data: folders = [] } = useChatFoldersQuery(userId);
  const deleteFolderMutation = useDeleteChatFolderMutation();
  const createChatMutation = useCreateChatMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleCreateChat = useCallback(() => {
    setFriendPickerVisible(true);
  }, []);

  const handleSelectFriend = useCallback(
    async (friendId: string) => {
      if (!userId) return;
      try {
        const existing = await api.data.findExisting1on1Chat(userId, friendId);
        if (existing && !('message' in existing)) {
          router.push(`/messages/chat/${existing.id}`);
        } else {
          createChatMutation.mutate(
            { userId, input: { memberUserIds: [friendId] } },
            {
              onSuccess: (chat) => router.push(`/messages/chat/${chat.id}`),
              onError: (err) => {
                const msg = getUserFacingError(err);
                Alert.alert(t('common.error'), msg);
              },
            }
          );
        }
      } catch (err) {
        const msg = getUserFacingError(err as ApiError);
        Alert.alert(t('common.error'), msg);
      }
    },
    [userId, router, createChatMutation]
  );

  const handleOpenFriends = useCallback(() => {
    router.push('/messages/friends');
  }, [router]);

  const sortedChats = useMemo(
    () =>
      [...chats].sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }),
    [chats]
  );

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return sortedChats;
    const q = searchQuery.toLowerCase().trim();
    return sortedChats.filter((chat) => {
      const name = (
        chat.name ||
        chat.participantDisplayNames ||
        chat.members?.map((m) => m.displayName).join(' ') ||
        ''
      ).toLowerCase();
      const preview = (chat.lastMessagePreview ?? '').toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [sortedChats, searchQuery]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>{t('messages.conversations')}</Text>
          <Pressable
            onPress={handleOpenFriends}
            accessibilityLabel={t('messages.friendsList')}
            accessibilityHint={t('messages.friendsListHint')}
            hitSlop={8}
            style={styles.friendsButton}
          >
            {({ pressed }) => (
              <Ionicons
                name="people-outline"
                size={24}
                color={colors.primary}
                style={{ opacity: pressed ? 0.6 : 1 }}
              />
            )}
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('messages.searchPlaceholder')}
            placeholderTextColor={`${colors.onSurfaceVariant}99`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel={t('messages.searchPlaceholder')}
          />
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContent}
          style={styles.pillsScroll}
        >
          <Pressable
            onPress={() => setSelectedFolderId(undefined)}
            style={[styles.pill, !selectedFolderId && styles.pillSelected]}
            accessibilityLabel={t('messages.folderAll')}
            accessibilityRole="button"
          >
            <Text style={[styles.pillText, !selectedFolderId && styles.pillTextSelected]}>
              {t('messages.folderAll')}
            </Text>
          </Pressable>
          {folders.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setSelectedFolderId(f.id)}
              onLongPress={() => setFolderOptionsFolder(f)}
              style={[styles.pill, selectedFolderId === f.id && styles.pillSelected]}
              accessibilityLabel={f.name}
              accessibilityHint={t('messages.folderOptionsHint')}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, selectedFolderId === f.id && styles.pillTextSelected]}>
                {f.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push('/messages/create-folder')}
            style={styles.pillAdd}
            accessibilityLabel={t('messages.createFolder')}
            accessibilityHint={t('messages.createFolderHint')}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </Pressable>
        </ScrollView>
      </View>
    ),
    [selectedFolderId, folders, searchQuery, handleOpenFriends, router]
  );

  if (!userId) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          {renderHeader()}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </>
      ) : filteredChats.length === 0 ? (
        <>
          {renderHeader()}
          <View style={styles.emptyWrap}>
            <EmptyState
              iconName="chatbubbles-outline"
              title={t('messages.noChats')}
              subtitle={t('messages.noChatsSubtitle')}
            />
          </View>
        </>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index }) => (
            <ChatRow
              chat={item}
              currentUserId={userId}
              onPress={() => router.push(`/messages/chat/${item.id}`)}
              isFirst={index === 0}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — New message */}
      <Pressable
        onPress={handleCreateChat}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 80 },
          pressed && styles.fabPressed,
        ]}
        accessibilityLabel={t('messages.newChat')}
        accessibilityHint={t('messages.newChatHint')}
        accessibilityRole="button"
      >
        <Ionicons name="create-outline" size={24} color={colors.onSecondaryContainer} />
      </Pressable>

      <FriendPickerSheet
        visible={friendPickerVisible}
        onRequestClose={() => setFriendPickerVisible(false)}
        onSelectFriend={handleSelectFriend}
        userId={userId}
      />

      <FadeActionSheet
        visible={!!folderOptionsFolder}
        onRequestClose={() => setFolderOptionsFolder(null)}
        options={
          folderOptionsFolder
            ? [
                {
                  icon: 'create-outline' as const,
                  label: t('messages.editFolder'),
                  accessibilityHint: t('messages.editFolderHint'),
                  onPress: () => {
                    const fid = folderOptionsFolder.id;
                    setFolderOptionsFolder(null);
                    router.push(`/messages/edit-folder/${fid}`);
                  },
                },
                {
                  icon: 'trash-outline' as const,
                  label: t('messages.deleteFolder'),
                  destructive: true,
                  accessibilityHint: t('messages.deleteFolderHint'),
                  onPress: () => {
                    const fid = folderOptionsFolder.id;
                    setFolderOptionsFolder(null);
                    Alert.alert(t('messages.deleteFolder'), t('messages.deleteFolderConfirm'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.delete'),
                        style: 'destructive',
                        onPress: () => {
                          if (!userId) return;
                          deleteFolderMutation.mutate(
                            { folderId: fid, userId },
                            {
                              onSuccess: () => {
                                if (selectedFolderId === fid) {
                                  setSelectedFolderId(undefined);
                                }
                              },
                              onError: (err) =>
                                Alert.alert(t('common.error'), getUserFacingError(err)),
                            }
                          );
                        },
                      },
                    ]);
                  },
                },
              ]
            : []
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── List header (heading + search + pills) ──
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fontFamily.serifBold,
    fontSize: 30,
    color: colors.primary,
    letterSpacing: -0.3,
  },
  friendsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search ──
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

  // ── Filter pills ──
  pillsScroll: {
    marginBottom: spacing.lg,
  },
  pillsContent: {
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
    backgroundColor: colors.surfaceContainerHigh,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  pillTextSelected: {
    color: colors.onPrimary,
  },
  pillAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Chat rows ──
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.cardPadding,
    gap: spacing.md,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xs,
  },
  chatRowFirst: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    ...shadow.cardSoft,
    shadowColor: colors.shadow,
  },
  chatRowPressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  chatRowContent: {
    flex: 1,
    minWidth: 0,
  },
  chatRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  chatName: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatNameSecondary: {
    opacity: 0.8,
  },
  chatTime: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  chatPreview: {
    ...typography.bodyMd,
    color: `${colors.onSurfaceVariant}B3`,
  },
  chatPreviewFirst: {
    fontFamily: fontFamily.sansMedium,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },

  // ── Empty / loading ──
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

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
    shadowColor: colors.shadow,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.9 }],
  },
});
