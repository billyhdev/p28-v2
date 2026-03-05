import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/primitives';
import { OrgStructureRow } from '@/components/patterns/OrgStructureRow';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';
import type { Group, Ministry } from '@/lib/api';

export default function AdminMinistryDetailScreen() {
  const { orgId, ministryId } = useLocalSearchParams<{ orgId: string; ministryId: string }>();
  const router = useRouter();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

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
          setEditName(m.name);
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

  const handleSaveMinistry = useCallback(async () => {
    if (!ministryId || !editName.trim()) return;
    setSaving(true);
    setError(null);
    const result = await api.data.updateMinistry(ministryId, { name: editName.trim() });
    setSaving(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setMinistry(result);
    }
  }, [ministryId, editName]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Input
          label={t('admin.ministryName')}
          placeholder={t('admin.ministryNamePlaceholder')}
          value={editName}
          onChangeText={setEditName}
          editable={!saving}
          accessibilityLabel={t('admin.ministryName')}
        />
        <Button
          title={t('common.save')}
          onPress={handleSaveMinistry}
          disabled={!editName.trim() || saving || editName.trim() === ministry?.name}
          style={styles.saveButton}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('admin.groups')}</Text>
      <Button
        title={t('admin.addGroup')}
        onPress={() => router.push(`/admin/${orgId}/ministry/${ministryId}/group/new`)}
        variant="secondary"
        style={styles.addGroupButton}
        accessibilityLabel={t('admin.addGroup')}
        accessibilityHint={t('admin.groupNamePlaceholder')}
      />
      {groups.length === 0 ? (
        <Text style={styles.emptyText}>{t('admin.noGroupsSubtitle')}</Text>
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
  );
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.cardPadding,
  marginBottom: spacing.cardGap,
  shadowColor: colors.shadow,
  shadowOffset: shadow.cardSoft.shadowOffset,
  shadowOpacity: shadow.cardSoft.shadowOpacity,
  shadowRadius: shadow.cardSoft.shadowRadius,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  card: { ...cardStyle },
  saveButton: { marginTop: spacing.sm },
  sectionTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  addGroupButton: { marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
