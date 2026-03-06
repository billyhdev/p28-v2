import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Badge } from '@/components/primitives/Badge';
import { Card } from '@/components/primitives/Card';
import { COUNTRIES } from '@/constants/countries';
import type { Group } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

function getCountryDisplayName(code: string): string {
  const found = COUNTRIES.find((c) => c.code === code);
  return found?.name ?? code;
}

export interface GroupCardProps {
  group: Group;
  isMember?: boolean;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export function GroupCard({ group, isMember, onJoin, onLeave }: GroupCardProps) {
  const router = useRouter();
  const typeLabel = group.type === 'forum' ? t('groups.forum') : t('groups.ministry');

  const handlePress = () => {
    router.push(`/group/${group.id}`);
  };

  const handleJoinPress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onJoin?.(group.id);
  };

  const handleLeavePress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onLeave?.(group.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${group.name}, ${typeLabel}`}
      accessibilityHint="Opens group details"
    >
      <Card style={styles.card}>
        {group.bannerImageUrl ? (
          <Image
            source={{ uri: group.bannerImageUrl }}
            style={styles.banner}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="people-outline" size={32} color={colors.ink300} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Badge label={typeLabel} variant={group.type === 'forum' ? 'neutral' : 'primary'} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          {group.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {isMember ? (
                <View style={styles.joinedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.joinedText}>{t('groups.joined')}</Text>
                </View>
              ) : null}
              {onJoin && !isMember && (
                <Pressable
                  onPress={handleJoinPress}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                  accessibilityLabel={t('groups.join')}
                  accessibilityHint="Joins this group"
                >
                  <Text style={styles.actionText}>{t('groups.join')}</Text>
                </Pressable>
              )}
              {onLeave && isMember && (
                <Pressable
                  onPress={handleLeavePress}
                  style={({ pressed }) => [styles.leaveButton, pressed && styles.actionPressed]}
                  accessibilityLabel={t('groups.leave')}
                  accessibilityHint="Leaves this group"
                >
                  <Text style={styles.leaveText}>{t('groups.leave')}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.footerRight}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.meta} numberOfLines={1}>
                  {getCountryDisplayName(group.country)}
                </Text>
              </View>
              {group.memberCount != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.meta}>
                    {group.memberCount}{' '}
                    {group.memberCount === 1 ? t('groups.member') : t('groups.members')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surface100,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  joinedText: {
    ...typography.caption,
    color: colors.success,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  leaveButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink300,
    borderRadius: 8,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    ...typography.label,
    color: colors.surface,
  },
  leaveText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
