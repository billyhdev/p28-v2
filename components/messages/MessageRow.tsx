import { Image } from 'expo-image';
import { useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Avatar } from '@/components/primitives';
import { formatMessageTime } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography, fontFamily } from '@/theme/tokens';

import { REACTION_EMOJI, SWIPE_MAX, SWIPE_THRESHOLD } from './constants';
import type { MessageLike, ParentMessageLike, PostReactionType } from './types';

export interface MessageRowProps {
  post: MessageLike;
  parentPost?: ParentMessageLike | null;
  /** True when this is the first message in a consecutive run from the same user. */
  isFirstInGroup?: boolean;
  /** True when this is the last message in a consecutive run from the same user. */
  isLastInGroup?: boolean;
  onImagePress?: (url: string) => void;
  onLongPress?: () => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onAddReaction?: (reactionType: PostReactionType) => void;
  onRemoveReaction?: (reactionType: PostReactionType) => void;
  onAuthorPress?: () => void;
  canReact?: boolean;
  currentUserId?: string;
}

export function MessageRow({
  post,
  parentPost,
  isFirstInGroup = true,
  isLastInGroup = true,
  onImagePress,
  onLongPress,
  onSwipeRight,
  onSwipeLeft,
  onAddReaction,
  onRemoveReaction,
  onAuthorPress,
  canReact = false,
  currentUserId,
}: MessageRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const counts = post.reactionCounts ?? { prayer: 0, laugh: 0, thumbsUp: 0 };
  const userReactions = post.userReactionTypes ?? [];
  const hasReactions = counts.prayer > 0 || counts.laugh > 0 || counts.thumbsUp > 0;
  const isOwnMessage = !!currentUserId && post.userId === currentUserId;

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

  const handleLongPress = () => {
    if (canReact && onLongPress) onLongPress();
  };

  const isUserReaction = (type: PostReactionType) =>
    !!currentUserId && userReactions.includes(type);

  const swipeEnabled = !!(canReact && (onSwipeRight || (isOwnMessage && onSwipeLeft)));

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

  const timeString = formatMessageTime(post.createdAt);
  const isEdited = post.updatedAt && post.updatedAt !== post.createdAt;

  return (
    <View style={styles.messageWrapper}>
      <Animated.View
        style={[
          styles.swipeIconContainer,
          styles.swipeIconLeft,
          { opacity: replyIconOpacity },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="arrow-undo-outline" size={20} color={colors.primary} />
      </Animated.View>
      {onSwipeLeft ? (
        <Animated.View
          style={[
            styles.swipeIconContainer,
            styles.swipeIconRight,
            { opacity: editIconOpacity },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="pencil-outline" size={20} color={colors.primary} />
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.messageSliding, { transform: [{ translateX }] }]}
        {...(swipeEnabled ? panResponder.panHandlers : {})}
      >
        <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
          {/* Avatar (others) — only on last message in a consecutive group */}
          {isOwnMessage ? null : isLastInGroup ? (
            <Pressable
              onPress={onAuthorPress}
              style={styles.avatarContainer}
              accessibilityLabel={
                post.authorDisplayName
                  ? `View ${post.authorDisplayName}'s profile`
                  : 'View profile'
              }
              accessibilityRole="button"
            >
              <Avatar
                source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : null}
                fallbackText={post.authorDisplayName}
                size="md"
              />
            </Pressable>
          ) : (
            <View style={styles.avatarSpacer} />
          )}

          {/* Content column */}
          <View
            style={[
              styles.contentColumn,
              isOwnMessage && styles.contentColumnOwn,
            ]}
          >
            {/* Name + timestamp row — only on the first message in a group */}
            {isFirstInGroup ? (
              <View
                style={[
                  styles.metaRow,
                  isOwnMessage && styles.metaRowOwn,
                ]}
              >
                {isOwnMessage ? (
                  <Text style={styles.timestamp}>{timeString}</Text>
                ) : (
                  <>
                    <Pressable onPress={onAuthorPress} accessibilityRole="link">
                      <Text style={styles.authorName}>
                        {post.authorDisplayName ?? t('common.loading')}
                      </Text>
                    </Pressable>
                    <Text style={styles.timestamp}>{timeString}</Text>
                  </>
                )}
              </View>
            ) : null}

            <View>
            {/* Message bubble */}
            <Pressable
              onLongPress={canReact ? handleLongPress : undefined}
              delayLongPress={400}
              style={({ pressed }) => [
                styles.bubble,
                isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
                pressed && canReact && styles.bubblePressed,
              ]}
              accessibilityLabel={t('discussions.reactToReply')}
              accessibilityHint={
                canReact
                  ? isOwnMessage
                    ? `${t('discussions.reactToReplyHint')} ${t('discussions.swipeToReplyHint')} ${t('discussions.swipeToEditHint')}`
                    : `${t('discussions.reactToReplyHint')} ${t('discussions.swipeToReplyHint')}`
                  : undefined
              }
              accessibilityRole="button"
            >
              {parentPost ? (
                <View style={[styles.replyPreview, isOwnMessage && styles.replyPreviewOwn]}>
                  <Text style={[styles.replyPreviewAuthor, isOwnMessage && styles.replyPreviewAuthorOwn]}>
                    {t('discussions.replyingTo')}{' '}
                    {parentPost.authorDisplayName ?? t('common.loading')}
                  </Text>
                  <Text
                    style={[styles.replyPreviewBody, isOwnMessage && styles.replyPreviewBodyOwn]}
                    numberOfLines={2}
                  >
                    {parentPost.body ?? ''}
                  </Text>
                </View>
              ) : null}

              {post.body ? (
                <Text style={[styles.messageBody, isOwnMessage && styles.messageBodyOwn]}>
                  {post.body}
                </Text>
              ) : null}

              {isEdited ? (
                <Text style={[styles.editedLabel, isOwnMessage && styles.editedLabelOwn]}>
                  {t('discussions.edited')}
                </Text>
              ) : null}

              {post.imageUrls && post.imageUrls.length > 0 ? (
                <View style={styles.imagesRow}>
                  {post.imageUrls.map((url, idx) => (
                    <Pressable
                      key={url}
                      onPress={() => onImagePress?.(url)}
                      style={styles.imagePressable}
                      accessibilityLabel={`View attached image ${idx + 1} full size`}
                      accessibilityRole="button"
                    >
                      <Image source={{ uri: url }} style={styles.messageImage} contentFit="cover" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Pressable>

            {hasReactions ? (
              <View style={styles.reactionBadges}>
                {(['prayer', 'laugh', 'thumbs_up'] as PostReactionType[]).map((type) => {
                  const countKey = type === 'thumbs_up' ? 'thumbsUp' : type;
                  if ((counts as unknown as Record<string, number>)[countKey] <= 0) return null;
                  const count = (counts as unknown as Record<string, number>)[countKey];
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
                        isOwnMessage
                          ? styles.reactionBadgeOwnBubble
                          : styles.reactionBadgeOtherBubble,
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
                      <Text style={styles.reactionEmoji}>{REACTION_EMOJI[type]}</Text>
                      {count > 1 ? (
                        <Text
                          style={[styles.reactionCount, isMine && styles.reactionCountMine]}
                        >
                          {count}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            </View>

          </View>

          {/* Own message avatar on the right — only on last in group */}
          {isOwnMessage ? (
            isLastInGroup ? (
              <View style={styles.avatarContainer}>
                <Avatar
                  source={post.authorAvatarUrl ? { uri: post.authorAvatarUrl } : null}
                  fallbackText={post.authorDisplayName}
                  size="md"
                />
              </View>
            ) : (
              <View style={styles.avatarSpacer} />
            )
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const BUBBLE_RADIUS = 18;

const styles = StyleSheet.create({
  messageWrapper: {
    position: 'relative',
    marginBottom: 3,
    overflow: 'hidden',
    paddingBottom: 3,
  },
  swipeIconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_MAX,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIconLeft: { left: 0 },
  swipeIconRight: { right: 0 },
  messageSliding: { position: 'relative' },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    maxWidth: '100%',
  },
  messageRowOwn: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  avatarContainer: {
    alignSelf: 'flex-end',
    marginBottom: 3,
  },
  avatarSpacer: {
    width: 36,
  },

  contentColumn: {
    flex: 1,
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  contentColumnOwn: {
    alignItems: 'flex-end',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  metaRowOwn: {
    flexDirection: 'row',
  },

  authorName: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  timestamp: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },

  bubble: {
    borderRadius: BUBBLE_RADIUS,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  bubbleOther: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: colors.primaryContainer,
    borderTopRightRadius: 4,
  },
  bubblePressed: {
    opacity: 0.85,
  },

  replyPreview: {
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    opacity: 0.85,
  },
  replyPreviewOwn: {
    borderLeftColor: colors.primaryFixed,
  },
  replyPreviewAuthor: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 2,
  },
  replyPreviewAuthorOwn: {
    color: colors.primaryFixed,
  },
  replyPreviewBody: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  replyPreviewBodyOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  messageBody: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  messageBodyOwn: {
    color: colors.onPrimary,
  },

  editedLabel: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 2,
  },
  editedLabelOwn: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  imagePressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  messageImage: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
  },

  reactionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginTop: -8,
    alignSelf: 'flex-end',
    paddingRight: spacing.xs,
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
  },
  reactionBadgeOtherBubble: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  reactionBadgeOwnBubble: {
    backgroundColor: colors.primaryContainer,
  },
  reactionBadgeMine: {
    backgroundColor: colors.primary,
  },
  reactionBadgePressed: {
    opacity: 0.8,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  reactionCountMine: {
    color: colors.onPrimary,
  },
});
