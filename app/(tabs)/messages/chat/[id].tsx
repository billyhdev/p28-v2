import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/primitives';
import { FriendPickerSheet, MessageRow } from '@/components/messages';
import { ComposeBar } from '@/components/patterns/ComposeBar';
import { FadeActionSheet } from '@/components/patterns/FadeActionSheet';
import { ReactionSheet } from '@/components/patterns/ReactionSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useChatMessageReactionsQuery,
  useChatMessagesQuery,
  useChatQuery,
  useCreateChatMessageMutation,
  useCreateChatMutation,
  useMarkChatReadMutation,
  useReactToChatMessageMutation,
  useRemoveChatMessageReactionMutation,
  useUpdateChatMessageMutation,
  useUploadChatImageMutation,
} from '@/hooks/useApiQueries';
import { api, getUserFacingError } from '@/lib/api';
import { queryKeys } from '@/lib/api/queryKeys';
import type { ChatMessage, CreateChatMessageInput, PostReactionType } from '@/lib/api';
import { formatDateHeader, isSameDay } from '@/lib/dates';
import { t } from '@/lib/i18n';

import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const userId = session?.user?.id;
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [composeText, setComposeText] = useState('');
  const [attachedImageUrls, setAttachedImageUrls] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reactionMessage, setReactionMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [addFriendsVisible, setAddFriendsVisible] = useState(false);
  const [chatMenuVisible, setChatMenuVisible] = useState(false);

  const { data: chat, isLoading, isError, error, refetch } = useChatQuery(id);
  const { data: messages = [], refetch: refetchMessages } = useChatMessagesQuery(id, {
    userId,
  });
  const { data: reactionDetails = [], isLoading: reactionsLoading } = useChatMessageReactionsQuery(
    reactionMessage?.id,
    {
      enabled: !!reactionMessage,
    }
  );

  const createMessageMutation = useCreateChatMessageMutation();
  const updateMessageMutation = useUpdateChatMessageMutation();
  const createChatMutation = useCreateChatMutation();
  const uploadImageMutation = useUploadChatImageMutation();
  const reactMutation = useReactToChatMessageMutation();
  const removeReactionMutation = useRemoveChatMessageReactionMutation();
  const markReadMutation = useMarkChatReadMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchMessages();
      if (id && userId) {
        markReadMutation.mutate({ chatId: id, userId });
      }
    }, [refetch, refetchMessages, id, userId])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const channelId = `messages:chat:${id}`;
      api.realtime.subscribe(channelId, {
        onMessage: () => {
          qc.invalidateQueries({ queryKey: queryKeys.chatMessages(id, userId ?? undefined) });
        },
      });
      return () => api.realtime.unsubscribe(channelId);
    }, [id, userId, qc])
  );

  const memberUserIds = useMemo(
    () => (chat?.members ?? []).map((m) => m.userId).filter(Boolean),
    [chat?.members]
  );

  const headerTitle = useMemo(
    () =>
      chat?.name?.trim() ||
      chat?.participantDisplayNames ||
      chat?.members
        ?.filter((m) => m.userId !== userId)
        .map((m) => m.displayName ?? t('common.loading'))
        .join(', ') ||
      t('messages.lastMessage'),
    [chat?.name, chat?.participantDisplayNames, chat?.members, userId]
  );

  const memberCount = chat?.members?.length ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const chatMenuOptions = useMemo(
    () => [
      {
        icon: 'people-outline' as const,
        label: t('messages.manageMembers'),
        onPress: () => {
          setChatMenuVisible(false);
          router.push(`/messages/chat/${id}/manage-members`);
        },
      },
      {
        icon: 'create-outline' as const,
        label: t('messages.editChat'),
        onPress: () => {
          setChatMenuVisible(false);
          router.push(`/messages/chat/${id}/edit`);
        },
      },
      {
        icon: 'folder-open-outline' as const,
        label: t('messages.addToFolder'),
        onPress: () => {
          setChatMenuVisible(false);
          router.push(`/messages/add-chat-to-folder/${id}`);
        },
      },
    ],
    [id, router]
  );

  const handleAddFriend = useCallback(
    async (friendId: string) => {
      if (!userId || !id) return;
      const otherMemberIds = memberUserIds.filter((uid) => uid !== userId);
      const newMemberIds = [...otherMemberIds, friendId];

      try {
        const existing = await api.data.findExistingChatByMembers(userId, newMemberIds);
        if (existing && !('message' in existing)) {
          setAddFriendsVisible(false);
          router.push(`/messages/chat/${existing.id}`);
          return;
        }
      } catch {
        // proceed to create if lookup fails
      }

      createChatMutation.mutate(
        { userId, input: { memberUserIds: newMemberIds } },
        {
          onSuccess: (newChat) => {
            setAddFriendsVisible(false);
            router.push(`/messages/chat/${newChat.id}`);
          },
          onError: (err) => {
            Alert.alert(t('common.error'), getUserFacingError(err));
          },
        }
      );
    },
    [userId, id, memberUserIds, createChatMutation, router]
  );

  const canPost = composeText.trim().length > 0 || attachedImageUrls.length > 0;

  const handlePost = useCallback(() => {
    if (!userId || !id || !canPost) return;
    const body = composeText.trim();
    if (editingMessage) {
      updateMessageMutation.mutate(
        {
          messageId: editingMessage.id,
          chatId: id,
          userId,
          input: {
            body,
            imageUrls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
          },
        },
        {
          onSuccess: () => {
            setComposeText('');
            setAttachedImageUrls([]);
            setEditingMessage(null);
          },
        }
      );
    } else {
      const input = {
        body,
        imageUrls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
        parentMessageId: replyingTo?.id,
      };
      setComposeText('');
      setAttachedImageUrls([]);
      setReplyingTo(null);
      createMessageMutation.mutate({
        chatId: id,
        userId,
        input,
      });
    }
  }, [
    userId,
    id,
    canPost,
    composeText,
    attachedImageUrls,
    replyingTo,
    editingMessage,
    createMessageMutation,
    updateMessageMutation,
  ]);

  const handleRetryOutboundMessage = useCallback(
    (msg: ChatMessage) => {
      if (!userId || !id) return;
      const payload = (msg as ChatMessage & { outboundRetryPayload?: CreateChatMessageInput })
        .outboundRetryPayload;
      if (!payload) return;
      createMessageMutation.mutate({
        chatId: id,
        userId,
        input: {
          body: payload.body,
          imageUrls: payload.imageUrls,
          parentMessageId: payload.parentMessageId,
        },
        optimisticId: msg.id,
      });
    },
    [userId, id, createMessageMutation]
  );

  const pickImage = useCallback(async () => {
    if (!userId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets.length) return;
    const maxImages = 5;
    const toUpload = result.assets.slice(0, maxImages - attachedImageUrls.length);
    for (const asset of toUpload) {
      if (!asset.uri) continue;
      try {
        const url = await uploadImageMutation.mutateAsync({
          userId,
          imageUri: asset.uri,
          base64Data: asset.base64 ?? undefined,
        });
        setAttachedImageUrls((prev) => (prev.length < maxImages ? [...prev, url] : prev));
      } catch {
        // skip failed
      }
    }
  }, [userId, attachedImageUrls.length, uploadImageMutation]);

  const removeAttachedImage = useCallback((url: string) => {
    setAttachedImageUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!previewImageUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('discussions.downloadPermissionDenied'));
        return;
      }
      const ext = previewImageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] ?? 'jpg';
      const filename = `chat-image-${Date.now()}.${ext}`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.downloadAsync(previewImageUrl, localUri);
      await MediaLibrary.createAssetAsync(localUri);
      setPreviewImageUrl(null);
      Alert.alert(t('discussions.downloadSuccess'), t('discussions.downloadSuccessMessage'));
    } catch (err) {
      const msg =
        err && typeof err === 'object' && typeof (err as Error).message === 'string'
          ? (err as Error).message
          : t('discussions.downloadError');
      Alert.alert(t('common.error'), msg);
    } finally {
      setIsDownloading(false);
    }
  }, [previewImageUrl, isDownloading]);

  const handleReact = useCallback(
    (type: PostReactionType) => {
      if (!userId || !id || !reactionMessage) return;
      reactMutation.mutate(
        { messageId: reactionMessage.id, chatId: id, userId, reactionType: type },
        { onSuccess: () => setReactionMessage(null) }
      );
    },
    [userId, id, reactionMessage, reactMutation]
  );

  const handleRemoveReaction = useCallback(
    (type: PostReactionType) => {
      if (!reactionMessage || !userId || !id) return;
      removeReactionMutation.mutate(
        {
          messageId: reactionMessage.id,
          chatId: id,
          userId,
          reactionType: type,
        },
        { onSuccess: () => setReactionMessage(null) }
      );
    },
    [reactionMessage, userId, id, removeReactionMutation]
  );

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    setReplyingTo(null);
    setEditingMessage(msg);
    setComposeText(msg.body ?? '');
    setAttachedImageUrls(msg.imageUrls ?? []);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setComposeText('');
    setAttachedImageUrls([]);
  }, []);

  if (!id) {
    router.back();
    return null;
  }

  if (isLoading && !chat) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !chat) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error && 'message' in error ? getUserFacingError(error) : t('common.error')}
        </Text>
      </View>
    );
  }

  const otherMembers = (chat.members ?? []).filter((m) => m.userId && m.userId !== userId);
  const firstOtherMember = otherMembers[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Custom chat header */}
      <View style={[styles.chatHeader, { paddingTop: spacing.xs }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>

        <Pressable
          style={styles.chatHeaderInfo}
          onPress={() => {
            if (otherMembers.length === 1 && firstOtherMember?.userId) {
              router.push(`/profile/${firstOtherMember.userId}`);
            } else {
              router.push(`/messages/chat/${id}/edit`);
            }
          }}
          accessibilityLabel={headerTitle}
          accessibilityRole="button"
        >
          <Avatar
            source={firstOtherMember?.avatarUrl ? { uri: firstOtherMember.avatarUrl } : null}
            fallbackText={headerTitle}
            size="lg"
          />
          <View style={styles.chatHeaderTextColumn}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <Text style={styles.chatHeaderSubtitle}>
              {memberCount} {t('groups.members').toUpperCase()}
            </Text>
          </View>
        </Pressable>

        <View style={styles.chatHeaderActions}>
          <Pressable
            onPress={() => setChatMenuVisible(true)}
            style={styles.headerActionButton}
            accessibilityLabel={t('common.options')}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.headerDivider} />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
          const showDateSeparator = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          const isFirstInGroup = !prevMsg || prevMsg.userId !== msg.userId || showDateSeparator;
          const nextIsDifferentDay =
            nextMsg != null && !isSameDay(msg.createdAt, nextMsg.createdAt);
          const isLastInGroup = !nextMsg || nextMsg.userId !== msg.userId || nextIsDifferentDay;
          const outboundStatus = (msg as ChatMessage & { outboundStatus?: 'sending' | 'failed' })
            .outboundStatus;
          const canReactToMessage = !!userId && !outboundStatus;

          return (
            <View key={msg.id}>
              {showDateSeparator ? (
                <View style={styles.dateSeparator}>
                  <View style={styles.dateSeparatorLine} />
                  <Text style={styles.dateSeparatorText}>{formatDateHeader(msg.createdAt)}</Text>
                  <View style={styles.dateSeparatorLine} />
                </View>
              ) : null}
              <MessageRow
                post={msg}
                parentPost={
                  msg.parentMessageId
                    ? (messages.find((m) => m.id === msg.parentMessageId) ?? null)
                    : null
                }
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                onImagePress={(url) => setPreviewImageUrl(url)}
                onLongPress={() => setReactionMessage(msg)}
                onSwipeRight={
                  canReactToMessage
                    ? () => (setEditingMessage(null), setReplyingTo(msg))
                    : undefined
                }
                onSwipeLeft={
                  userId && msg.userId === userId && !outboundStatus
                    ? () => handleStartEdit(msg)
                    : undefined
                }
                onAddReaction={(reactionType) =>
                  reactMutation.mutate({
                    messageId: msg.id,
                    chatId: id,
                    userId: userId!,
                    reactionType,
                  })
                }
                onRemoveReaction={(reactionType) =>
                  removeReactionMutation.mutate({
                    messageId: msg.id,
                    chatId: id,
                    userId: userId!,
                    reactionType,
                  })
                }
                onAuthorPress={() => router.push(`/profile/${msg.userId}`)}
                canReact={canReactToMessage}
                currentUserId={userId}
                onRetrySend={
                  outboundStatus === 'failed' ? () => handleRetryOutboundMessage(msg) : undefined
                }
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Compose area */}
      <View style={[styles.composeArea, { paddingBottom: spacing.xxs + insets.bottom }]}>
        <ComposeBar
          text={composeText}
          onChangeText={setComposeText}
          onSend={handlePost}
          canSend={canPost}
          isSending={!!editingMessage && updateMessageMutation.isPending}
          sendLabel={editingMessage ? t('discussions.updateReply') : t('discussions.postReply')}
          attachedImageUrls={attachedImageUrls}
          onRemoveImage={removeAttachedImage}
          onPickImage={pickImage}
          isUploadingImage={uploadImageMutation.isPending}
          editingContext={
            editingMessage
              ? { preview: editingMessage.body ?? '', onCancel: handleCancelEdit }
              : null
          }
          replyingToContext={
            replyingTo
              ? {
                  authorName: replyingTo.authorDisplayName ?? t('common.loading'),
                  preview: replyingTo.body ?? '',
                  onCancel: () => setReplyingTo(null),
                }
              : null
          }
          variant="chat"
        />
      </View>

      {/* Sheets and modals */}
      <FriendPickerSheet
        visible={addFriendsVisible}
        onRequestClose={() => setAddFriendsVisible(false)}
        onSelectFriend={handleAddFriend}
        excludeUserIds={memberUserIds}
        userId={userId ?? ''}
      />

      <FadeActionSheet
        visible={chatMenuVisible}
        onRequestClose={() => setChatMenuVisible(false)}
        options={chatMenuOptions}
      />

      <ReactionSheet
        visible={!!reactionMessage}
        onClose={() => setReactionMessage(null)}
        reactionsLoading={reactionsLoading}
        reactionDetails={reactionDetails}
        selectedReactionTypes={reactionMessage?.userReactionTypes ?? []}
        currentUserId={userId}
        isMutating={reactMutation.isPending || removeReactionMutation.isPending}
        onAddReaction={handleReact}
        onRemoveReaction={handleRemoveReaction}
      />

      {/* Image preview modal */}
      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <Pressable
          style={styles.imagePreviewOverlay}
          onPress={() => setPreviewImageUrl(null)}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          {previewImageUrl ? (
            <>
              <Image
                source={{ uri: previewImageUrl }}
                style={[
                  styles.imagePreviewImage,
                  {
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                  },
                ]}
                contentFit="contain"
              />
              <Pressable
                style={styles.imagePreviewDownloadButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDownloadImage();
                }}
                disabled={isDownloading}
                accessibilityLabel={t('discussions.downloadImage')}
                accessibilityRole="button"
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Ionicons name="download-outline" size={24} color={colors.surface} />
                )}
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.onSurface,
  },

  /* ── Custom chat header ─────────────────────────────── */
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  chatHeaderTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  chatHeaderTitle: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  chatHeaderSubtitle: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '400',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.ghostBorder,
    marginHorizontal: spacing.screenHorizontal,
  },

  /* ── Messages scroll ────────────────────────────────── */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  /* ── Date separator ─────────────────────────────────── */
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.4,
  },
  dateSeparatorText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },

  /* ── Compose area ───────────────────────────────────── */
  composeArea: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
  },

  /* ── Image preview ──────────────────────────────────── */
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewDownloadButton: {
    position: 'absolute',
    top: spacing.lg + 50,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewImage: {
    backgroundColor: 'transparent',
  },
});
