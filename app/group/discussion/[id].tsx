import { useFocusEffect, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
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
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

import { Avatar } from '@/components/primitives';
import { ComposeBar } from '@/components/patterns/ComposeBar';
import { ReactionSheet } from '@/components/patterns/ReactionSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateDiscussionPostMutation,
  useDiscussionPostReactionsQuery,
  useDiscussionPostsQuery,
  useDiscussionQuery,
  useGroupAdminsQuery,
  useGroupsForUserQuery,
  useIsAdminQuery,
  useJoinGroupMutation,
  useReactToPostMutation,
  useRemovePostReactionMutation,
  useUpdateDiscussionPostMutation,
  useUploadDiscussionPostImageMutation,
} from '@/hooks/useApiQueries';
import { api, getUserFacingError } from '@/lib/api';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Discussion, DiscussionPost, PostReactionType } from '@/lib/api';
import { formatRelativeTime } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

function OriginalPostRow({
  discussion,
  onAuthorPress,
}: {
  discussion: Discussion;
  onAuthorPress?: () => void;
}) {
  return (
    <View style={styles.originalPost}>
      <Pressable
        onPress={onAuthorPress}
        accessibilityLabel={
          discussion.authorDisplayName
            ? `View ${discussion.authorDisplayName}'s profile`
            : 'View profile'
        }
        accessibilityRole="button"
      >
        <Avatar
          source={discussion.authorAvatarUrl ? { uri: discussion.authorAvatarUrl } : null}
          fallbackText={discussion.authorDisplayName}
          size="sm"
        />
      </Pressable>
      <View style={styles.originalPostContent}>
        <Text style={styles.topicTitle}>{discussion.title}</Text>
        {discussion.body ? <Text style={styles.postBody}>{discussion.body}</Text> : null}
        <View style={styles.postHeader}>
          <Pressable onPress={onAuthorPress} accessibilityRole="link">
            <Text style={styles.authorName}>
              by {discussion.authorDisplayName ?? t('common.loading')}
            </Text>
          </Pressable>
          <View style={styles.postHeaderMeta}>
            <Text style={styles.date}>{formatRelativeTime(discussion.createdAt)}</Text>
            {discussion.updatedAt && discussion.updatedAt !== discussion.createdAt ? (
              <Text style={styles.editedLabel}> [{t('discussions.edited')}]</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const REACTION_OPTIONS: { type: PostReactionType; emoji: string; label: string }[] = [
  { type: 'prayer', emoji: '🙏', label: 'Prayer' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'thumbs_up', emoji: '👍', label: 'Thumbs up' },
];

const REACTION_EMOJI: Record<PostReactionType, string> = {
  prayer: '🙏',
  laugh: '😂',
  thumbs_up: '👍',
};

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 72;

function ReplyRow({
  post,
  parentPost,
  onImagePress,
  onLongPress,
  onSwipeRight,
  onSwipeLeft,
  onAddReaction,
  onRemoveReaction,
  onAuthorPress,
  canReact,
  currentUserId,
}: {
  post: DiscussionPost;
  parentPost?: DiscussionPost | null;
  onImagePress?: (url: string) => void;
  onLongPress?: () => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onAddReaction?: (reactionType: PostReactionType) => void;
  onRemoveReaction?: (reactionType: PostReactionType) => void;
  onAuthorPress?: () => void;
  canReact?: boolean;
  currentUserId?: string;
}) {
  const cardRef = useRef<View>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const counts = post.reactionCounts ?? { prayer: 0, laugh: 0, thumbsUp: 0 };
  const userReactions = post.userReactionTypes ?? [];
  const hasReactions = counts.prayer > 0 || counts.laugh > 0 || counts.thumbsUp > 0;
  const isOwnPost = !!currentUserId && post.userId === currentUserId;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15;
        },
        onPanResponderMove: (_, gestureState) => {
          const dx = gestureState.dx;
          const minX = onSwipeLeft ? -SWIPE_MAX : 0;
          const clamped = Math.min(SWIPE_MAX, Math.max(minX, dx));
          translateX.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;
          if (dx > SWIPE_THRESHOLD && onSwipeRight) {
            onSwipeRight();
          } else if (dx < -SWIPE_THRESHOLD && onSwipeLeft) {
            onSwipeLeft();
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        },
      }),
    [onSwipeRight, onSwipeLeft, translateX]
  );

  const handleLongPress = useCallback(() => {
    if (!canReact || !onLongPress) return;
    onLongPress();
  }, [canReact, onLongPress]);

  const isUserReaction = (type: PostReactionType) =>
    !!currentUserId && userReactions.includes(type);

  const swipeEnabled = !!(canReact && (onSwipeRight || (isOwnPost && onSwipeLeft)));

  const replyIconOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [0, 15],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [translateX]
  );

  const editIconOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-15, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [translateX]
  );

  return (
    <View style={styles.replyCardWrapper}>
      <Animated.View
        style={[
          styles.replySwipeIconContainer,
          styles.replySwipeIconLeft,
          { opacity: replyIconOpacity },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="arrow-undo-outline" size={24} color={colors.primary} />
      </Animated.View>
      {onSwipeLeft ? (
        <Animated.View
          style={[
            styles.replySwipeIconContainer,
            styles.replySwipeIconRight,
            { opacity: editIconOpacity },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="pencil-outline" size={24} color={colors.primary} />
        </Animated.View>
      ) : null}
      <Animated.View
        style={[styles.replyCardSliding, { transform: [{ translateX }] }]}
        {...(swipeEnabled ? panResponder.panHandlers : {})}
      >
        <Pressable
          ref={cardRef}
          onLongPress={canReact ? handleLongPress : undefined}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.replyCard,
            pressed && canReact && styles.replyCardPressed,
          ]}
          accessibilityLabel={t('discussions.reactToReply')}
          accessibilityHint={
            canReact
              ? isOwnPost
                ? `${t('discussions.reactToReplyHint')} ${t('discussions.swipeToReplyHint')} ${t('discussions.swipeToEditHint')}`
                : `${t('discussions.reactToReplyHint')} ${t('discussions.swipeToReplyHint')}`
              : undefined
          }
          accessibilityRole="button"
        >
          <View style={styles.replyCardHeader}>
            <Pressable
              onPress={onAuthorPress}
              accessibilityLabel={
                post.authorDisplayName ? `View ${post.authorDisplayName}'s profile` : 'View profile'
              }
              accessibilityRole="button"
            >
              <Avatar
                source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : null}
                fallbackText={post.authorDisplayName}
                size="sm"
              />
            </Pressable>
            <View style={styles.replyCardMeta}>
              <Pressable onPress={onAuthorPress} accessibilityRole="link">
                <Text style={styles.replyAuthorName}>
                  {post.authorDisplayName ?? t('common.loading')}
                </Text>
              </Pressable>
              <View style={styles.replyCardMetaRight}>
                <Text style={styles.replyDate}>{formatRelativeTime(post.createdAt)}</Text>
                {post.updatedAt && post.updatedAt !== post.createdAt ? (
                  <Text style={styles.editedLabel}> [{t('discussions.edited')}]</Text>
                ) : null}
              </View>
            </View>
          </View>
          {parentPost ? (
            <View style={styles.replyToPreview}>
              <Text style={styles.replyToAuthor}>
                {t('discussions.replyingTo')} {parentPost.authorDisplayName ?? t('common.loading')}
              </Text>
              <Text style={styles.replyToBody} numberOfLines={2}>
                {parentPost.body ?? ''}
              </Text>
            </View>
          ) : null}
          {post.body ? <Text style={styles.replyBody}>{post.body}</Text> : null}
          {post.imageUrls && post.imageUrls.length > 0 ? (
            <View style={styles.replyImages}>
              {post.imageUrls.map((url, idx) => (
                <Pressable
                  key={url}
                  onPress={() => onImagePress?.(url)}
                  style={styles.replyImagePressable}
                  accessibilityLabel={`View attached image ${idx + 1} full size`}
                  accessibilityRole="button"
                >
                  <Image source={{ uri: url }} style={styles.replyImage} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>
        {hasReactions ? (
          <View style={styles.reactionBadges} pointerEvents="box-none">
            {(['prayer', 'laugh', 'thumbs_up'] as PostReactionType[]).map((type) => {
              if ((counts as Record<string, number>)[type === 'thumbs_up' ? 'thumbsUp' : type] <= 0)
                return null;
              const count = (counts as Record<string, number>)[
                type === 'thumbs_up' ? 'thumbsUp' : type
              ];
              const isMine = isUserReaction(type);
              const onPress =
                canReact && (isMine ? onRemoveReaction : onAddReaction)
                  ? () => (isMine ? onRemoveReaction?.(type) : onAddReaction?.(type))
                  : undefined;
              return (
                <Pressable
                  key={type}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.reactionBadge,
                    isMine && styles.reactionBadgeMine,
                    pressed && canReact && styles.reactionBadgePressed,
                  ]}
                  disabled={!onPress}
                  accessibilityLabel={
                    isMine
                      ? `Remove ${type} reaction (${count})`
                      : onPress
                        ? `Add ${type} reaction (${count})`
                        : `${REACTION_EMOJI[type]} ${count}`
                  }
                  accessibilityRole={onPress ? 'button' : 'text'}
                >
                  <Text style={styles.reactionBadgeEmoji}>{REACTION_EMOJI[type]}</Text>
                  {count > 1 ? (
                    <Text
                      style={[styles.reactionBadgeCount, isMine && styles.reactionBadgeCountMine]}
                    >
                      {count}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

export default function DiscussionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  const [composeText, setComposeText] = useState('');
  const [attachedImageUrls, setAttachedImageUrls] = useState<string[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reactionPost, setReactionPost] = useState<DiscussionPost | null>(null);
  const [replyingToPost, setReplyingToPost] = useState<DiscussionPost | null>(null);
  const [editingPost, setEditingPost] = useState<DiscussionPost | null>(null);
  const navigation = useNavigation();
  const {
    data: discussion,
    isLoading,
    isError,
    error,
    refetch: refetchDiscussion,
  } = useDiscussionQuery(id);
  const { data: posts = [], refetch: refetchPosts } = useDiscussionPostsQuery(id, { userId });
  const { data: memberGroups = [] } = useGroupsForUserQuery(userId);
  const { data: groupAdmins = [] } = useGroupAdminsQuery(discussion?.groupId);
  const { data: isAppAdmin } = useIsAdminQuery(userId);
  const isMember =
    !!discussion && !!userId && memberGroups.some((g) => g.id === discussion.groupId);
  const canReact = !!isMember && !!userId;
  const isCreator = !!discussion && !!userId && discussion.userId === userId;
  const isGroupAdmin = !!discussion && !!userId && groupAdmins.some((a) => a.userId === userId);
  const canEdit = !!discussion && !!userId && (isCreator || isGroupAdmin || isAppAdmin === true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <Pressable
              onPress={() => id && router.push(`/group/discussion/edit?discussionId=${id}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8 })}
              accessibilityLabel={t('discussions.editDiscussion')}
              accessibilityHint={t('discussions.editDiscussionHint')}
              accessibilityRole="button"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
            </Pressable>
          )
        : undefined,
    });
  }, [canEdit, id, navigation, router]);

  const createPostMutation = useCreateDiscussionPostMutation();
  const updatePostMutation = useUpdateDiscussionPostMutation();
  const uploadImageMutation = useUploadDiscussionPostImageMutation();
  const joinMutation = useJoinGroupMutation();
  const reactMutation = useReactToPostMutation();
  const removeReactionMutation = useRemovePostReactionMutation();
  const { data: reactionDetails = [], isLoading: reactionsLoading } =
    useDiscussionPostReactionsQuery(reactionPost?.id, { enabled: !!reactionPost });

  useFocusEffect(
    useCallback(() => {
      refetchDiscussion();
      refetchPosts();
    }, [refetchDiscussion, refetchPosts])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const channelId = `messages:discussion:${id}`;
      api.realtime.subscribe(channelId, {
        onMessage: () => {
          qc.invalidateQueries({
            predicate: (q) => q.queryKey[0] === 'discussionPosts' && q.queryKey[1] === id,
          });
        },
      });
      return () => api.realtime.unsubscribe(channelId);
    }, [id, qc])
  );

  const canPost = composeText.trim().length > 0 || attachedImageUrls.length > 0;
  const isEditing = !!editingPost;

  const handlePostReply = useCallback(() => {
    const body = composeText.trim();
    if (!userId || !id || !canPost) return;
    if (editingPost) {
      updatePostMutation.mutate(
        {
          postId: editingPost.id,
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
            setEditingPost(null);
          },
          onError: () => {},
        }
      );
    } else {
      createPostMutation.mutate(
        {
          discussionId: id,
          userId,
          input: {
            body,
            imageUrls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
            parentPostId: replyingToPost?.id,
          },
        },
        {
          onSuccess: () => {
            setComposeText('');
            setAttachedImageUrls([]);
            setReplyingToPost(null);
          },
          onError: () => {},
        }
      );
    }
  }, [
    userId,
    id,
    canPost,
    composeText,
    attachedImageUrls,
    replyingToPost?.id,
    editingPost,
    createPostMutation,
    updatePostMutation,
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
        // Surface error via mutation state if needed; skip failed image
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
      const filename = `discussion-image-${Date.now()}.${ext}`;
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

  const handleJoinToReply = useCallback(() => {
    if (!userId || !discussion) return;
    joinMutation.mutate(
      { groupId: discussion.groupId, userId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(userId) });
        },
      }
    );
  }, [userId, discussion, joinMutation, qc]);

  const handleReact = useCallback(
    (reactionType: PostReactionType) => {
      if (!userId || !id || !reactionPost) return;
      reactMutation.mutate(
        { postId: reactionPost.id, discussionId: id, userId, reactionType },
        { onSuccess: () => setReactionPost(null) }
      );
    },
    [userId, id, reactionPost, reactMutation]
  );

  const handleRemoveReactionFromSheet = useCallback(
    (reactionType: PostReactionType) => {
      if (!reactionPost || !userId || !id) return;
      removeReactionMutation.mutate(
        {
          postId: reactionPost.id,
          discussionId: id,
          userId,
          reactionType,
        },
        { onSuccess: () => setReactionPost(null) }
      );
    },
    [reactionPost, userId, id, removeReactionMutation]
  );

  const handleAddReaction = useCallback(
    (post: DiscussionPost, reactionType: PostReactionType) => {
      if (!userId || !id) return;
      reactMutation.mutate({
        postId: post.id,
        discussionId: id,
        userId,
        reactionType,
      });
    },
    [userId, id, reactMutation]
  );

  const handleStartEditReply = useCallback((post: DiscussionPost) => {
    setReplyingToPost(null);
    setEditingPost(post);
    setComposeText(post.body ?? '');
    setAttachedImageUrls(post.imageUrls ?? []);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPost(null);
    setComposeText('');
    setAttachedImageUrls([]);
  }, []);

  const handleRemoveReaction = useCallback(
    (post: DiscussionPost, reactionType: PostReactionType) => {
      if (!userId || !id) return;
      removeReactionMutation.mutate({
        postId: post.id,
        discussionId: id,
        userId,
        reactionType,
      });
    },
    [userId, id, removeReactionMutation]
  );

  if (!id) {
    router.back();
    return null;
  }

  if (isLoading && !discussion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !discussion) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error && 'message' in error ? getUserFacingError(error) : t('common.error')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OriginalPostRow
          discussion={discussion}
          onAuthorPress={() => router.push(`/profile/${discussion.userId}`)}
        />

        <View style={styles.repliesSection}>
          <Text style={styles.repliesHeading}>
            {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
          </Text>
          {posts.map((p) => (
            <ReplyRow
              key={p.id}
              post={p}
              parentPost={
                p.parentPostId ? (posts.find((x) => x.id === p.parentPostId) ?? null) : null
              }
              onImagePress={(url) => setPreviewImageUrl(url)}
              onLongPress={() => setReactionPost(p)}
              onSwipeRight={
                isMember ? () => (setEditingPost(null), setReplyingToPost(p)) : undefined
              }
              onSwipeLeft={
                isMember && userId && p.userId === userId
                  ? () => handleStartEditReply(p)
                  : undefined
              }
              onAddReaction={(type) => handleAddReaction(p, type)}
              onRemoveReaction={(type) => handleRemoveReaction(p, type)}
              onAuthorPress={() => router.push(`/profile/${p.userId}`)}
              canReact={canReact}
              currentUserId={userId}
            />
          ))}
        </View>
      </ScrollView>

      {!isMember ? (
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleJoinToReply}
            style={({ pressed }) => [
              styles.joinPrompt,
              pressed && styles.joinPromptPressed,
              joinMutation.isPending && styles.joinPromptDisabled,
            ]}
            disabled={joinMutation.isPending}
            accessibilityLabel={t('discussions.joinToReply')}
            accessibilityHint="Join the group to participate"
            accessibilityRole="button"
          >
            {joinMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.ink300} />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color={colors.ink300} />
                <Text style={styles.joinPromptText}>{t('discussions.joinToReply')}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <ComposeBar
            text={composeText}
            onChangeText={setComposeText}
            onSend={handlePostReply}
            canSend={canPost}
            isSending={createPostMutation.isPending || updatePostMutation.isPending}
            sendLabel={isEditing ? t('discussions.updateReply') : t('discussions.postReply')}
            attachedImageUrls={attachedImageUrls}
            onRemoveImage={removeAttachedImage}
            onPickImage={pickImage}
            isUploadingImage={uploadImageMutation.isPending}
            editingContext={
              editingPost
                ? { preview: editingPost.body ?? '', onCancel: handleCancelEdit }
                : null
            }
            replyingToContext={
              replyingToPost
                ? {
                    authorName: replyingToPost.authorDisplayName ?? t('common.loading'),
                    preview: replyingToPost.body ?? '',
                    onCancel: () => setReplyingToPost(null),
                  }
                : null
            }
            variant="discussion"
          />
        </View>
      )}
      <ReactionSheet
        visible={!!reactionPost}
        onClose={() => setReactionPost(null)}
        reactionsLoading={reactionsLoading}
        reactionDetails={reactionDetails}
        selectedReactionTypes={reactionPost?.userReactionTypes ?? []}
        currentUserId={userId}
        canReact={canReact}
        isMutating={reactMutation.isPending || removeReactionMutation.isPending}
        onAddReaction={handleReact}
        onRemoveReaction={handleRemoveReactionFromSheet}
      />
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
                accessibilityHint={t('discussions.downloadImageHint')}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  originalPost: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  originalPostContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  postHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  authorName: {
    ...typography.caption,
    color: colors.primary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  topicTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  postBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  repliesSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  repliesHeading: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  replyCardWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
    overflow: 'hidden',
    paddingBottom: 14,
  },
  replySwipeIconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_MAX,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replySwipeIconLeft: {
    left: 0,
  },
  replySwipeIconRight: {
    right: 0,
  },
  replyCardSliding: {
    position: 'relative',
  },
  replyCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  replyCardPressed: {
    opacity: 0.9,
  },
  reactionBadges: {
    position: 'absolute',
    bottom: -6,
    right: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.surfaceContainerLow,
  },
  reactionBadgeMine: {
    backgroundColor: colors.primary,
  },
  reactionBadgePressed: {
    opacity: 0.8,
  },
  reactionBadgeEmoji: {
    fontSize: 14,
  },
  reactionBadgeCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reactionBadgeCountMine: {
    color: colors.surface,
  },
  replyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  replyCardMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyCardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAuthorName: {
    ...typography.label,
    color: colors.primary,
  },
  replyDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  replyToPreview: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    opacity: 0.85,
  },
  replyToAuthor: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 2,
  },
  replyToBody: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  replyBody: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  replyImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  replyImagePressable: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  replyImage: {
    width: 120,
    height: 120,
    borderRadius: radius.card,
    backgroundColor: colors.surface100,
  },
  bottomBar: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg + (Platform.OS === 'ios' ? 24 : spacing.md),
    backgroundColor: colors.surfaceContainerLow,
  },
  joinPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface100,
    borderRadius: radius.sm,
  },
  joinPromptPressed: {
    opacity: 0.8,
  },
  joinPromptDisabled: {
    opacity: 0.6,
  },
  joinPromptText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewDownloadButton: {
    position: 'absolute',
    top: spacing.lg + (Platform.OS === 'ios' ? 50 : 24),
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewImage: {
    backgroundColor: 'transparent',
  },
});
