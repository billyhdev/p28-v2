import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/primitives';
import { OrgStructureRow } from '@/components/patterns/OrgStructureRow';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';
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
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [addMinistryName, setAddMinistryName] = useState('');
  const [addingMinistry, setAddingMinistry] = useState(false);

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
        setEditName(o.name);
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

  const handleSaveOrg = useCallback(async () => {
    if (!orgId || !editName.trim()) return;
    setSaving(true);
    setError(null);
    const result = await api.data.updateOrganization(orgId, { name: editName.trim() });
    setSaving(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setOrg(result);
    }
  }, [orgId, editName]);

  const handleAddMinistry = useCallback(async () => {
    if (!orgId || !addMinistryName.trim()) return;
    setAddingMinistry(true);
    setError(null);
    const result = await api.data.createMinistry(orgId, { name: addMinistryName.trim() });
    setAddingMinistry(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setAddMinistryName('');
      setMinistries((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [orgId, addMinistryName]);

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
          label={t('admin.orgName')}
          placeholder={t('admin.orgNamePlaceholder')}
          value={editName}
          onChangeText={setEditName}
          editable={!saving}
          accessibilityLabel={t('admin.orgName')}
        />
        <Button
          title={t('common.save')}
          onPress={handleSaveOrg}
          disabled={!editName.trim() || saving || editName.trim() === org?.name}
          style={styles.saveButton}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('admin.ministries')}</Text>
      <View style={styles.addMinistryRow}>
        <Input
          label={t('admin.addMinistry')}
          placeholder={t('admin.ministryNamePlaceholder')}
          value={addMinistryName}
          onChangeText={setAddMinistryName}
          editable={!addingMinistry}
          containerStyle={styles.addMinistryInput}
        />
        <Button
          title={t('common.save')}
          onPress={handleAddMinistry}
          disabled={!addMinistryName.trim() || addingMinistry}
          style={styles.addMinistryButton}
        />
      </View>

      {ministries.length === 0 ? (
        <Text style={styles.emptyText}>{t('admin.noMinistriesSubtitle')}</Text>
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
  addMinistryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addMinistryInput: { flex: 1 },
  addMinistryButton: { marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
