import React from 'react';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { t } from '@/lib/i18n';
import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';

interface ContextBanner {
  preview: string;
  onCancel: () => void;
}

interface ReplyContextBanner extends ContextBanner {
  authorName: string;
}

export interface ComposeBarProps {
  text: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
  isSending: boolean;
  placeholder?: string;
  sendLabel?: string;

  attachedImageUrls: string[];
  onRemoveImage: (url: string) => void;
  onPickImage: () => void;
  isUploadingImage: boolean;
  maxImages?: number;

  editingContext?: ContextBanner | null;
  replyingToContext?: ReplyContextBanner | null;

  variant?: 'discussion' | 'chat';
}

export function ComposeBar({
  text,
  onChangeText,
  onSend,
  canSend,
  isSending,
  placeholder,
  sendLabel,
  attachedImageUrls,
  onRemoveImage,
  onPickImage,
  isUploadingImage,
  maxImages = 5,
  editingContext,
  replyingToContext,
  variant = 'discussion',
}: ComposeBarProps) {
  const isChat = variant === 'chat';
  const atLimit = attachedImageUrls.length >= maxImages;

  return (
    <View>
      {editingContext ? (
        <View style={isChat ? chatStyles.contextBanner : styles.contextBanner}>
          <View style={isChat ? chatStyles.contextBannerContent : styles.contextBannerContent}>
            <Text style={isChat ? chatStyles.contextBannerLabel : styles.contextBannerLabel}>
              {t('discussions.editingReply')}
            </Text>
            <Text
              style={isChat ? chatStyles.contextBannerPreview : styles.contextBannerPreview}
              numberOfLines={2}
            >
              {editingContext.preview}
            </Text>
          </View>
          <Pressable
            onPress={editingContext.onCancel}
            style={isChat ? chatStyles.contextBannerClose : styles.contextBannerClose}
            accessibilityLabel={t('discussions.cancelEdit')}
            accessibilityHint={t('discussions.cancelEdit')}
            accessibilityRole="button"
          >
            <Ionicons
              name="close"
              size={isChat ? 18 : 20}
              color={isChat ? colors.onSurfaceVariant : colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : replyingToContext ? (
        <View style={isChat ? chatStyles.contextBanner : styles.contextBanner}>
          <View style={isChat ? chatStyles.contextBannerContent : styles.contextBannerContent}>
            <Text style={isChat ? chatStyles.contextBannerLabel : styles.contextBannerLabel}>
              {t('discussions.replyingTo')}{' '}
              <Text style={isChat ? chatStyles.contextBannerAuthor : styles.contextBannerAuthor}>
                {replyingToContext.authorName}
              </Text>
            </Text>
            <Text
              style={isChat ? chatStyles.contextBannerPreview : styles.contextBannerPreview}
              numberOfLines={2}
            >
              {replyingToContext.preview}
            </Text>
          </View>
          <Pressable
            onPress={replyingToContext.onCancel}
            style={isChat ? chatStyles.contextBannerClose : styles.contextBannerClose}
            accessibilityLabel={t('discussions.cancelReply')}
            accessibilityHint={t('discussions.cancelReply')}
            accessibilityRole="button"
          >
            <Ionicons
              name="close"
              size={isChat ? 18 : 20}
              color={isChat ? colors.onSurfaceVariant : colors.textSecondary}
            />
          </Pressable>
        </View>
      ) : null}

      {attachedImageUrls.length > 0 ? (
        <View style={isChat ? chatStyles.attachedImagesRow : styles.attachedImagesRow}>
          {attachedImageUrls.map((url) => (
            <View key={url} style={styles.attachedImageWrap}>
              <Image
                source={{ uri: url }}
                style={isChat ? chatStyles.attachedImage : styles.attachedImage}
                contentFit="cover"
                accessibilityLabel={t('discussions.attachImage')}
              />
              <Pressable
                style={styles.removeAttachedButton}
                onPress={() => onRemoveImage(url)}
                accessibilityLabel={t('discussions.removeImage')}
                accessibilityRole="button"
              >
                <Ionicons
                  name="close-circle"
                  size={isChat ? 22 : 24}
                  color={isChat ? colors.onSurfaceVariant : colors.textSecondary}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={isChat ? chatStyles.inputRow : styles.inputRow}>
        <Pressable
          style={isChat ? chatStyles.attachButton : styles.attachButton}
          onPress={onPickImage}
          disabled={isSending || isUploadingImage || atLimit}
          accessibilityLabel={t('discussions.attachImage')}
          accessibilityHint={
            isUploadingImage ? t('discussions.uploadingImages') : t('discussions.attachImageHint')
          }
          accessibilityRole="button"
        >
          {isUploadingImage ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="image-outline"
              size={isChat ? 24 : 22}
              color={atLimit ? (isChat ? colors.outlineVariant : colors.ink300) : (isChat ? colors.onSurfaceVariant : colors.primary)}
            />
          )}
        </Pressable>

        <TextInput
          style={isChat ? chatStyles.composeInput : styles.composeInput}
          placeholder={placeholder ?? t('discussions.replyPlaceholder')}
          placeholderTextColor={isChat ? colors.outlineVariant : colors.ink300}
          value={text}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
          editable={!isSending}
          accessibilityLabel={placeholder ?? t('discussions.replyPlaceholder')}
          accessibilityHint={sendLabel ?? t('discussions.postReply')}
        />

        {isChat ? (
          <Pressable
            style={[chatStyles.sendButton, canSend && !isSending && chatStyles.sendButtonActive]}
            onPress={onSend}
            disabled={!canSend || isSending || isUploadingImage}
            accessibilityLabel={sendLabel ?? t('discussions.postReply')}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend && !isSending ? colors.onPrimary : colors.outlineVariant}
            />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.sendButton, (!canSend || isSending) && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!canSend || isSending || isUploadingImage}
            accessibilityLabel={sendLabel ?? t('discussions.postReply')}
            accessibilityHint={sendLabel ? `Posts your message` : 'Posts your reply'}
          >
            <Ionicons
              name="send"
              size={20}
              color={!canSend || isSending ? colors.ink300 : colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  contextBannerContent: {
    flex: 1,
    minWidth: 0,
  },
  contextBannerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contextBannerAuthor: {
    ...typography.label,
    color: colors.primary,
  },
  contextBannerPreview: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  contextBannerClose: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  attachedImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  attachedImageWrap: {
    position: 'relative',
  },
  attachedImage: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surface100,
  },
  removeAttachedButton: {
    position: 'absolute',
    top: -6,
    right: -6,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface100,
    borderRadius: radius.sm,
  },
  composeInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface100,
    borderRadius: radius.sm,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

const chatStyles = StyleSheet.create({
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
  attachedImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  attachButton: {
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
});
