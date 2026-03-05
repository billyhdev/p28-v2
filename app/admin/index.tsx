import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/primitives';
import { AddSheet, EmptyState, OrgStructureRow } from '@/components/patterns';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Organization } from '@/lib/api';

export default function AdminIndexScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const userId = session?.user?.id;

  const fetchOrgs = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.data.getOrganizationsWhereUserIsAdmin(userId).then((r) => {
      setLoading(false);
      if (isApiError(r)) {
        setError(getUserFacingError(r));
        setOrgs([]);
      } else {
        setOrgs(r);
        setError(null);
      }
    });
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrgs();
    }, [fetchOrgs])
  );

  const handleCreateOrg = useCallback(
    async (name: string) => {
      if (!userId) return;
      setCreating(true);
      setError(null);
      const result = await api.data.createOrganization({ name }, userId);
      setCreating(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setSheetVisible(false);
        fetchOrgs();
      }
    },
    [userId, fetchOrgs]
  );

  if (loading && orgs.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel={t('common.loading')}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>{t('admin.myOrganizations')}</Text>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Org list or empty state */}
        {orgs.length === 0 ? (
          <EmptyState
            iconName="business-outline"
            title={t('admin.noOrgs')}
            subtitle={t('admin.noOrgsSubtitle')}
            actionLabel={t('admin.createOrg')}
            onAction={() => setSheetVisible(true)}
          />
        ) : (
          <>
            {orgs.map((org) => (
              <OrgStructureRow
                key={org.id}
                name={org.name}
                type="org"
                onPress={() => router.push(`/admin/${org.id}`)}
              />
            ))}

            {/* Add new org button at the bottom of the list */}
            <Button
              title={`+ ${t('admin.createOrg')}`}
              onPress={() => setSheetVisible(true)}
              variant="secondary"
              fullWidth
              style={styles.addButton}
              accessibilityLabel={t('admin.createOrg')}
              accessibilityHint={t('admin.createOrgHint')}
            />
          </>
        )}
      </ScrollView>

      <AddSheet
        visible={sheetVisible}
        title={t('admin.addNewOrg')}
        inputLabel={t('admin.orgName')}
        placeholder={t('admin.orgNamePlaceholder')}
        saving={creating}
        onSave={handleCreateOrg}
        onDismiss={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  addButton: {
    marginTop: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 10,
  },
  errorText: { ...typography.caption, color: colors.error },
});
