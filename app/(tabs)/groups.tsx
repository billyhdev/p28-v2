import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { api, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { Button } from '@/components/primitives';
import { colors, spacing, typography } from '@/theme/tokens';

export default function GroupsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [adminOrgCount, setAdminOrgCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const userId = session?.user?.id;
      if (!userId) {
        setAdminOrgCount(0);
        return;
      }
      api.data.getOrganizationsWhereUserIsAdmin(userId).then((r) => {
        setAdminOrgCount(isApiError(r) ? 0 : r.length);
      });
    }, [session?.user?.id])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(250)} style={styles.content}>
        {adminOrgCount > 0 ? (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>{t('admin.title')}</Text>
            <Button
              title={t('admin.orgSettings')}
              onPress={() => router.push('/admin')}
              variant="primary"
              style={styles.adminButton}
              accessibilityLabel={t('admin.orgSettings')}
              accessibilityHint={t('admin.orgSettingsHint')}
            />
          </View>
        ) : null}
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderTitle}>Groups</Text>
          <Text style={styles.placeholderSubtitle}>Browse and join ministries and groups.</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
  },
  content: { flex: 1 },
  adminSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  adminButton: { width: '100%', maxWidth: 400 },
  placeholderSection: {
    paddingTop: spacing.xl,
  },
  placeholderTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  placeholderSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
