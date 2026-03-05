import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/primitives';
import { AddSheet, EmptyState, OrgStructureRow, SectionHeader } from '@/components/patterns';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';
import type { Group, Ministry } from '@/lib/api';

export default function AdminMinistryDetailScreen() {
  const { orgId, ministryId } = useLocalSearchParams<{ orgId: string; ministryId: string }>();
  const router = useRouter();

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add group sheet
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);

  // Rename ministry sheet
  const [renameSheetVisible, setRenameSheetVisible] = useState(false);
  const [renamingSaving, setRenamingSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!orgId || !ministryId) return;
      api.data.getMinistriesForOrg(orgId).then((r) => {
        if (isApiError(r)) {
          setLoading(false);
          setError(getUserFacingError(r));
          setMinistry(null);
          return;
        }
        const m = (r ?? []).find((x) => x.id === ministryId);
        if (m) {
          setMinistry(m);
        } else {
          setMinistry(null);
          setError('Ministry not found');
        }
        setLoading(false);
      });
      api.data.getGroupsForMinistry(ministryId).then((r) => {
        if (isApiError(r)) {
          setError(getUserFacingError(r));
          setGroups([]);
        } else {
          setGroups(r ?? []);
        }
      });
    }, [orgId, ministryId])
  );

  const handleRenameMinistry = useCallback(
    async (name: string) => {
      if (!ministryId) return;
      setRenamingSaving(true);
      setError(null);
      const result = await api.data.updateMinistry(ministryId, { name });
      setRenamingSaving(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setMinistry(result);
        setRenameSheetVisible(false);
      }
    },
    [ministryId]
  );

  const handleAddGroup = useCallback(
    async (name: string) => {
      if (!ministryId) return;
      setAddingGroup(true);
      setError(null);
      const result = await api.data.createGroup(ministryId, { name });
      setAddingGroup(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        setAddSheetVisible(false);
        setGroups((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      }
    },
    [ministryId]
  );

  if (loading && !ministry) {
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

  if (!ministry && !loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error ?? 'Ministry not found'}</Text>
      </View>
    );
  }

  return (
    <>
      {/* Dynamic header: ministry name as title + edit icon */}
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              name="pencil-outline"
              onPress={() => setRenameSheetVisible(true)}
              accessibilityLabel={t('admin.renameMinistry')}
              accessibilityHint="Rename this ministry"
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
          {ministry?.name ?? ''}
        </Text>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Groups section */}
        <SectionHeader
          title={t('admin.smallGroups')}
          actionLabel={`+ ${t('admin.addGroup')}`}
          onAction={() => setAddSheetVisible(true)}
        />

        {groups.length === 0 ? (
          <EmptyState
            iconName="people-outline"
            title={t('admin.noGroupsSubtitle')}
            subtitle="Create a small group to connect people within this ministry."
            actionLabel={t('admin.addGroup')}
            onAction={() => setAddSheetVisible(true)}
          />
        ) : (
          groups.map((g) => (
            <OrgStructureRow
              key={g.id}
              name={g.name}
              type="group"
              onPress={() => router.push(`/admin/${orgId}/ministry/${ministryId}/group/${g.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* Add Group Sheet */}
      <AddSheet
        visible={addSheetVisible}
        title={t('admin.addNewGroup')}
        inputLabel={t('admin.groupName')}
        placeholder={t('admin.groupNamePlaceholder')}
        saving={addingGroup}
        onSave={handleAddGroup}
        onDismiss={() => setAddSheetVisible(false)}
      />

      {/* Rename Ministry Sheet */}
      <AddSheet
        visible={renameSheetVisible}
        title={t('admin.renameMinistry')}
        inputLabel={t('admin.ministryName')}
        placeholder={ministry?.name ?? t('admin.ministryNamePlaceholder')}
        saving={renamingSaving}
        onSave={handleRenameMinistry}
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
