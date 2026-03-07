import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { IconButton } from '@/components/primitives';
import {
  useAddFriendMutation,
  useAreFriendsQuery,
  useRemoveFriendMutation,
} from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { getUserFacingError } from '@/lib/api';
import { colors, radius, typography, spacing } from '@/theme/tokens';

export interface AddFriendButtonProps {
  /** Current logged-in user ID */
  currentUserId: string;
  /** User to add/remove as friend */
  targetUserId: string;
  /** Display name for accessibility (optional) */
  displayName?: string;
  /** Compact style for list rows (e.g. group members) */
  compact?: boolean;
  /** Callback when add/remove fails */
  onError?: (message: string) => void;
}

export function AddFriendButton({
  currentUserId,
  targetUserId,
  displayName,
  compact = false,
  onError,
}: AddFriendButtonProps) {
  const { data: areFriends, isLoading } = useAreFriendsQuery(currentUserId, targetUserId);
  const addMutation = useAddFriendMutation();
  const removeMutation = useRemoveFriendMutation();

  const handleAdd = () => {
    addMutation.mutate(
      { userId: currentUserId, friendId: targetUserId },
      {
        onError: (err) => {
          const msg = getUserFacingError(err);
          onError?.(msg);
        },
      }
    );
  };

  const handleRemove = () => {
    removeMutation.mutate(
      { userId: currentUserId, friendId: targetUserId },
      {
        onError: (err) => {
          const msg = getUserFacingError(err);
          onError?.(msg);
        },
      }
    );
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (currentUserId === targetUserId) return null;

  if (isLoading) {
    return (
      <View style={[styles.wrapper, compact && styles.compactWrapper]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const wrapperStyle = [
    styles.wrapper,
    compact ? styles.compactWrapper : styles.fillWrapper,
    isPending && styles.disabled,
  ];

  if (areFriends) {
    return (
      <View style={wrapperStyle} pointerEvents={isPending ? 'none' : 'auto'}>
        <IconButton
          name="person-remove-outline"
          onPress={handleRemove}
          size={compact ? 20 : 24}
          color={colors.primary}
          accessibilityLabel={
            displayName ? `${t('friends.removeFriend')}: ${displayName}` : t('friends.removeFriend')
          }
          accessibilityHint={t('friends.removeFriendHint')}
        />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={wrapperStyle} pointerEvents={isPending ? 'none' : 'auto'}>
        <IconButton
          name="person-add-outline"
          onPress={handleAdd}
          size={20}
          color={colors.primary}
          accessibilityLabel={
            displayName ? `${t('friends.addFriend')}: ${displayName}` : t('friends.addFriend')
          }
          accessibilityHint={t('friends.addFriendHint')}
        />
      </View>
    );
  }

  return (
    <View style={wrapperStyle} pointerEvents={isPending ? 'none' : 'auto'}>
      <Pressable
        onPress={handleAdd}
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        disabled={isPending}
        accessibilityLabel={
          displayName ? `${t('friends.addFriend')}: ${displayName}` : t('friends.addFriend')
        }
        accessibilityHint={t('friends.addFriendHint')}
        accessibilityRole="button"
      >
        <Ionicons name="person-add-outline" size={18} color={colors.primary} />
        <Text style={styles.addButtonText}>{t('friends.addFriend')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  fillWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  compactWrapper: {
    alignSelf: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface100,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
  },
});
