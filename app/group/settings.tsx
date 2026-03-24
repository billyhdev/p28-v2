import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  useGroupMemberSettingsQuery,
  useGroupQuery,
  useGroupsForUserQuery,
  useUpdateGroupMemberSettingsMutation,
} from '@/hooks/useApiQueries';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography, minTouchTarget } from '@/theme/tokens';

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { data: group } = useGroupQuery(groupId);
  const { data: memberGroups = [] } = useGroupsForUserQuery(userId);
  const isMember = !!groupId && memberGroups.some((g) => g.id === groupId);

  const { data: memberSettings } = useGroupMemberSettingsQuery(groupId, userId, {
    enabled: !!groupId && !!userId && isMember,
  });
  const updateMemberSettings = useUpdateGroupMemberSettingsMutation();

  const handleOpenNotificationSettings = () => {
    router.push('/profile/notifications');
  };

  const announcementsEnabled = memberSettings?.announcementsEnabled ?? true;

  const handleToggleGroupAnnouncements = (value: boolean) => {
    if (!userId || !groupId) return;
    updateMemberSettings.mutate({
      groupId,
      userId,
      updates: { announcementsEnabled: value },
    });
  };

  if (!groupId) {
    router.back();
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {group ? <Text style={styles.groupName}>{group.name}</Text> : null}

      {isMember ? (
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.optionTitle}>{t('groups.announcementsToggle')}</Text>
              <Text style={styles.optionSubtitle} numberOfLines={3}>
                {t('groups.announcementsToggleHint')}
              </Text>
            </View>
            <Switch
              value={announcementsEnabled}
              onValueChange={handleToggleGroupAnnouncements}
              disabled={updateMemberSettings.isPending}
              trackColor={{ false: colors.outlineVariant, true: colors.primaryFixed }}
              thumbColor={announcementsEnabled ? colors.primary : colors.surfaceContainerHighest}
              style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
              accessibilityLabel={t('groups.announcementsToggle')}
              accessibilityHint={t('groups.announcementsToggleHint')}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
          onPress={handleOpenNotificationSettings}
          accessibilityLabel={t('groups.manageNotifications')}
          accessibilityHint={t('groups.notificationsForGroupHint')}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{t('groups.notificationsForGroup')}</Text>
            <Text style={styles.optionSubtitle} numberOfLines={2}>
              {t('groups.notificationsForGroupHint')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink300} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  groupName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: minTouchTarget + spacing.md,
  },
  toggleTextCol: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  optionRowPressed: {
    backgroundColor: colors.surface100,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
