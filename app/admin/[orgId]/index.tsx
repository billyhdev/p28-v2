import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/primitives';
import { AddSheet, EmptyState, OrgStructureRow, SectionHeader } from '@/components/patterns';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Ministry, Organization } from '@/lib/api';

export default function AdminOrgDetailScreen() {
  const { session } = useAuth();
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const router = useRouter();
  const userId = session?.user?.id;

  const [org, setOrg] = useState<Organization | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add ministry sheet
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [addingMinistry, setAddingMinistry] = useState(false);

  // Rename org sheet
  const [renameSheetVisible, setRenameSheetVisible] = useState(false);
  const [renamingSaving, setRenamingSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!orgId || !userId) return;
      api.data.getOrganizationsWhereUserIsAdmin(userId).then((r) => {
        if (isApiError(r)) {
          setLoading(false);
          setError(getUserFacingError(r));
          return;
        }
        const o = r.find((x) => x.id === orgId);
        if (!o) {
          setLoading(false);
          setError('Organization not found');
          return;
        }
        setOrg(o);
        setError(null);
      });
      api.data.getMinistriesForOrg(orgId).then((r) => {
        setLoading(false);
        if (isApiError(r)) {
          setError(getUserFacingError(r));
          setMinistries([]);
        } else {
          setMinistries(r ?? []);
        }
      });
    }, [orgId, userId])
  );

  const handleRenameOrg = useCallback(
    async (name: string) => {
      if (!orgId) return;
      setRenamingSaving(true);
      setError(null);
      const result = await api.data.updateOrganization(orgId, { name });
      setRenamingSaving(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setOrg(result);
        setRenameSheetVisible(false);
      }
    },
    [orgId]
  );

  const handleAddMinistry = useCallback(
    async (name: string) => {
      if (!orgId) return;
      setAddingMinistry(true);
      setError(null);
      const result = await api.data.createMinistry(orgId, { name });
      setAddingMinistry(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setAddSheetVisible(false);
        setMinistries((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      }
    },
    [orgId]
  );

  if (loading && !org) {
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

  if (!org && !loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error ?? 'Organization not found'}</Text>
      </View>
    );
  }

  return (
    <>
      {/* Dynamic header: org name as title + edit icon */}
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              name="pencil-outline"
              onPress={() => setRenameSheetVisible(true)}
              accessibilityLabel={t('admin.renameOrg')}
              accessibilityHint="Rename this organization"
              style={styles.headerBtn}
            />
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle} numberOfLines={2}>
          {org?.name ?? ''}
        </Text>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Ministries section */}
        <SectionHeader
          title={t('admin.ministries')}
          actionLabel={`+ ${t('admin.addMinistry')}`}
          onAction={() => setAddSheetVisible(true)}
        />

        {ministries.length === 0 ? (
          <EmptyState
            iconName="compass-outline"
            title={t('admin.noMinistries')}
            subtitle={t('admin.noMinistriesSubtitle')}
            actionLabel={t('admin.addMinistry')}
            onAction={() => setAddSheetVisible(true)}
          />
        ) : (
          ministries.map((m) => (
            <OrgStructureRow
              key={m.id}
              name={m.name}
              type="ministry"
              onPress={() => router.push(`/admin/${orgId}/ministry/${m.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Ministry Sheet */}
      <AddSheet
        visible={addSheetVisible}
        title={t('admin.addNewMinistry')}
        inputLabel={t('admin.ministryName')}
        placeholder={t('admin.ministryNamePlaceholder')}
        saving={addingMinistry}
        onSave={handleAddMinistry}
        onDismiss={() => setAddSheetVisible(false)}
      />

      {/* Rename Org Sheet */}
      <AddSheet
        visible={renameSheetVisible}
        title={t('admin.renameOrg')}
        inputLabel={t('admin.orgName')}
        placeholder={org?.name ?? t('admin.orgNamePlaceholder')}
        saving={renamingSaving}
        onSave={handleRenameOrg}
        onDismiss={() => setRenameSheetVisible(false)}
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
    marginBottom: spacing.xs,
  },
  headerBtn: {
    marginRight: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 10,
  },
  errorText: { ...typography.caption, color: colors.error },
});
