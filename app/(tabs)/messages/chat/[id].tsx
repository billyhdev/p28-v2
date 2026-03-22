import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/primitives';
import {
  FriendPickerSheet,
  MessageRow,
  REACTION_EMOJI,
  REACTION_OPTIONS,
} from '@/components/messages';
import { FadeActionSheet } from '@/components/patterns/FadeActionSheet';
import { useAuth } from '@/hooks/useAuth';
import { useFadeSheetAnimation } from '@/hooks/useFadeSheetAnimation';
import {
  useAddChatMembersMutation,
  useChatMessageReactionsQuery,
  useChatMessagesQuery,
  useChatQuery,
  useCreateChatMessageMutation,
  useReactToChatMessageMutation,
  useRemoveChatMessageReactionMutation,
  useUpdateChatMessageMutation,
  useUploadChatImageMutation,
} from '@/hooks/useApiQueries';
import { api, getUserFacingError } from '@/lib/api';
import { queryKeys } from '@/lib/api/queryKeys';
import type { ChatMessage, PostReactionType } from '@/lib/api';
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
  const reactionSheetVisible = !!reactionMessage;
  const { sheetSlideAnim, sheetFadeAnim } = useFadeSheetAnimation(reactionSheetVisible);

  const { data: chat, isLoading, isError, error, refetch } = useChatQuery(id);
  const { data: messages = [], refetch: refetchMessages } = useChatMessagesQuery(id, {
    userId,
  });
  const { data: reactionDetails = [] } = useChatMessageReactionsQuery(reactionMessage?.id, {
    enabled: !!reactionMessage,
  });

  const createMessageMutation = useCreateChatMessageMutation();
  const updateMessageMutation = useUpdateChatMessageMutation();
  const addMembersMutation = useAddChatMembersMutation();
  const uploadImageMutation = useUploadChatImageMutation();
  const reactMutation = useReactToChatMessageMutation();
  const removeReactionMutation = useRemoveChatMessageReactionMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchMessages();
    }, [refetch, refetchMessages])
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
    (friendId: string) => {
      if (!userId || !id) return;
      addMembersMutation.mutate(
        { chatId: id, addedByUserId: userId, memberUserIds: [friendId] },
        {
          onSuccess: () => {
            setAddFriendsVisible(false);
            refetch();
          },
          onError: (err) => {
            const msg = getUserFacingError(err);
            Alert.alert(t('common.error'), msg);
          },
        }
      );
    },
    [userId, id, addMembersMutation, refetch]
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
      createMessageMutation.mutate(
        {
          chatId: id,
          userId,
          input: {
            body,
            imageUrls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
            parentMessageId: replyingTo?.id,
          },
        },
        {
          onSuccess: () => {
            setComposeText('');
            setAttachedImageUrls([]);
            setReplyingTo(null);
          },
        }
      );
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
          onPress={() => router.push(`/messages/chat/${id}/edit`)}
          accessibilityLabel={headerTitle}
          accessibilityRole="button"
        >
          <Avatar
            source={
              firstOtherMember?.avatarUrl
                ? { uri: firstOtherMember.avatarUrl }
                : null
            }
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
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: false })
        }
      >
        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
          const showDateSeparator =
            !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

          const isFirstInGroup =
            !prevMsg || prevMsg.userId !== msg.userId || showDateSeparator;
          const nextIsDifferentDay =
            nextMsg != null && !isSameDay(msg.createdAt, nextMsg.createdAt);
          const isLastInGroup =
            !nextMsg || nextMsg.userId !== msg.userId || nextIsDifferentDay;

          return (
            <View key={msg.id}>
              {showDateSeparator ? (
                <View style={styles.dateSeparator}>
                  <View style={styles.dateSeparatorLine} />
                  <Text style={styles.dateSeparatorText}>
                    {formatDateHeader(msg.createdAt)}
                  </Text>
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
                onSwipeRight={() => (setEditingMessage(null), setReplyingTo(msg))}
                onSwipeLeft={
                  userId && msg.userId === userId ? () => handleStartEdit(msg) : undefined
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
                canReact={!!userId}
                currentUserId={userId}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Compose area */}
      <View style={[styles.composeArea, { paddingBottom: spacing.xxs + insets.bottom }]}>
        {/* Editing / replying banner */}
        {editingMessage ? (
          <View style={styles.contextBanner}>
            <View style={styles.contextBannerContent}>
              <Text style={styles.contextBannerLabel}>{t('discussions.editingReply')}</Text>
              <Text style={styles.contextBannerPreview} numberOfLines={2}>
                {editingMessage.body ?? ''}
              </Text>
            </View>
            <Pressable
              onPress={handleCancelEdit}
              style={styles.contextBannerClose}
              accessibilityLabel={t('discussions.cancelEdit')}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        ) : replyingTo ? (
          <View style={styles.contextBanner}>
            <View style={styles.contextBannerContent}>
              <Text style={styles.contextBannerLabel}>
                {t('discussions.replyingTo')}{' '}
                <Text style={styles.contextBannerAuthor}>
                  {replyingTo.authorDisplayName ?? t('common.loading')}
                </Text>
              </Text>
              <Text style={styles.contextBannerPreview} numberOfLines={2}>
                {replyingTo.body ?? ''}
              </Text>
            </View>
            <Pressable
              onPress={() => setReplyingTo(null)}
              style={styles.contextBannerClose}
              accessibilityLabel={t('discussions.cancelReply')}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        ) : null}

        {/* Attached images preview */}
        {attachedImageUrls.length > 0 ? (
          <View style={styles.attachedImagesRow}>
            {attachedImageUrls.map((url) => (
              <View key={url} style={styles.attachedImageWrap}>
                <Image
                  source={{ uri: url }}
                  style={styles.attachedImage}
                  contentFit="cover"
                  accessibilityLabel={t('discussions.attachImage')}
                />
                <Pressable
                  style={styles.removeAttachedButton}
                  onPress={() => removeAttachedImage(url)}
                  accessibilityLabel={t('discussions.removeImage')}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={22} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Input row */}
        <View style={styles.inputRow}>
          <Pressable
            onPress={pickImage}
            style={styles.addButton}
            disabled={
              createMessageMutation.isPending ||
              uploadImageMutation.isPending ||
              attachedImageUrls.length >= 5
            }
            accessibilityLabel={t('discussions.attachImage')}
            accessibilityRole="button"
          >
            {uploadImageMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="image-outline"
                size={24}
                color={
                  attachedImageUrls.length >= 5 ? colors.outlineVariant : colors.onSurfaceVariant
                }
              />
            )}
          </Pressable>

          <TextInput
            style={styles.composeInput}
            placeholder={t('discussions.replyPlaceholder')}
            placeholderTextColor={colors.outlineVariant}
            value={composeText}
            onChangeText={setComposeText}
            multiline
            maxLength={2000}
            editable={!createMessageMutation.isPending}
            accessibilityLabel={t('discussions.replyPlaceholder')}
          />

          <Pressable
            style={[
              styles.sendButton,
              canPost &&
                !createMessageMutation.isPending &&
                !updateMessageMutation.isPending &&
                styles.sendButtonActive,
            ]}
            onPress={handlePost}
            disabled={
              !canPost ||
              createMessageMutation.isPending ||
              updateMessageMutation.isPending ||
              uploadImageMutation.isPending
            }
            accessibilityLabel={
              editingMessage ? t('discussions.updateReply') : t('discussions.postReply')
            }
          >
            <Ionicons
              name="send"
              size={18}
              color={
                canPost && !createMessageMutation.isPending && !updateMessageMutation.isPending
                  ? colors.onPrimary
                  : colors.outlineVariant
              }
            />
          </Pressable>
        </View>

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

      {/* Reaction sheet modal */}
      <Modal
        visible={reactionSheetVisible}
        transparent
        animationType="none"
        onRequestClose={() => setReactionMessage(null)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.reactionSheetOverlay}
          onPress={() => setReactionMessage(null)}
          accessibilityLabel={t('common.cancel')}
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.reactionSheetBackdrop,
              { opacity: sheetFadeAnim },
            ]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.reactionSheetAnimated, { transform: [{ translateY: sheetSlideAnim }] }]}
          >
            <Pressable
              style={[styles.reactionSheet, { paddingBottom: spacing.lg + insets.bottom }]}
              onPress={(e) => e.stopPropagation()}
              accessibilityRole="none"
            >
              <View style={styles.reactionSheetHeader}>
                <Text style={styles.reactionSheetTitle}>{t('discussions.reactions')}</Text>
                <Pressable
                  onPress={() => setReactionMessage(null)}
                  style={styles.reactionSheetClose}
                  accessibilityLabel={t('common.back')}
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color={colors.onSurface} />
                </Pressable>
              </View>
              <View style={styles.reactionSheetListWrapper}>
                {reactionDetails.length === 0 ? (
                  <View style={styles.reactionSheetEmpty}>
                    <Text style={styles.reactionSheetEmptyText}>No reactions yet</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.reactionSheetList}
                    contentContainerStyle={styles.reactionSheetListContent}
                  >
                    {reactionDetails.map((r, idx) => {
                      const isCurrentUser = r.userId === userId;
                      return (
                        <Pressable
                          key={`${r.userId}-${r.reactionType}-${idx}`}
                          onPress={
                            isCurrentUser ? () => handleRemoveReaction(r.reactionType) : undefined
                          }
                          style={({ pressed }) => [
                            styles.reactionSheetRow,
                            pressed && isCurrentUser && styles.reactionSheetRowPressed,
                          ]}
                          accessibilityLabel={`${r.displayName ?? 'User'}, ${REACTION_EMOJI[r.reactionType]}`}
                        >
                          <Avatar
                            source={r.avatarUrl ? { uri: r.avatarUrl } : null}
                            fallbackText={r.displayName}
                            size="sm"
                          />
                          <View style={styles.reactionSheetRowContent}>
                            <Text style={styles.reactionSheetRowName}>
                              {r.displayName ?? t('common.loading')}
                            </Text>
                          </View>
                          <Text style={styles.reactionSheetRowEmoji}>
                            {REACTION_EMOJI[r.reactionType]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
              {reactionMessage ? (
                <View style={styles.reactionSheetFooter}>
                  <View style={styles.reactionSheetAddRow}>
                    {REACTION_OPTIONS.map(({ type, emoji }) => {
                      const isSelected = (reactionMessage.userReactionTypes ?? []).includes(type);
                      const onPress = () =>
                        isSelected ? handleRemoveReaction(type) : handleReact(type);
                      return (
                        <Pressable
                          key={type}
                          onPress={onPress}
                          style={({ pressed }) => [
                            styles.reactionSheetAddOption,
                            isSelected && styles.reactionSheetAddOptionSelected,
                            pressed && styles.reactionSheetAddOptionPressed,
                          ]}
                          accessibilityLabel={isSelected ? `Remove ${type}` : `Add ${type}`}
                        >
                          <Text style={styles.reactionSheetAddEmoji}>{emoji}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

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

  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  contextBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  contextBannerLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  contextBannerAuthor: {
    fontFamily: fontFamily.sansSemiBold,
    fontWeight: '600',
    color: colors.primary,
  },
  contextBannerPreview: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  contextBannerClose: {
    padding: spacing.xxs,
    marginLeft: spacing.sm,
  },

  attachedImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  attachedImageWrap: {
    position: 'relative',
  },
  attachedImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },
  removeAttachedButton: {
    position: 'absolute',
    top: -5,
    right: -5,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeInput: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    paddingTop: 10,
    minHeight: 40,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },

  /* ── Reaction sheet ─────────────────────────────────── */
  reactionSheetOverlay: { flex: 1 },
  reactionSheetBackdrop: { backgroundColor: 'rgba(21, 28, 39, 0.3)' },
  reactionSheetAnimated: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  reactionSheet: {
    flexDirection: 'column',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    height: Math.min(400, Dimensions.get('window').height * 0.7),
  },
  reactionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  reactionSheetTitle: {
    ...typography.title,
    color: colors.onSurface,
  },
  reactionSheetClose: { padding: spacing.xs },
  reactionSheetListWrapper: { flex: 1, minHeight: 120 },
  reactionSheetList: { flex: 1, maxHeight: 280 },
  reactionSheetListContent: { paddingVertical: spacing.sm },
  reactionSheetEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  reactionSheetEmptyText: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  reactionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  reactionSheetRowPressed: {
    backgroundColor: colors.surfaceContainerLow,
  },
  reactionSheetRowContent: { flex: 1 },
  reactionSheetRowName: {
    ...typography.body,
    color: colors.onSurface,
  },
  reactionSheetRowEmoji: { fontSize: 24 },
  reactionSheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
  },
  reactionSheetAddRow: { flexDirection: 'row', gap: spacing.md },
  reactionSheetAddOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionSheetAddOptionSelected: {
    backgroundColor: colors.primary,
  },
  reactionSheetAddOptionPressed: { opacity: 0.8 },
  reactionSheetAddEmoji: { fontSize: 24 },

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
