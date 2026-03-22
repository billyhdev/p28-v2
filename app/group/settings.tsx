import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGroupQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function GroupSettingsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { data: group } = useGroupQuery(groupId);

  const handleOpenNotificationSettings = () => {
    router.push('/profile/notifications');
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
  },
  groupName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    overflow: 'hidden',
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
