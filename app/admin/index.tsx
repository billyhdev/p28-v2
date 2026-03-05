import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/primitives';
import { OrgStructureRow } from '@/components/patterns/OrgStructureRow';
import { useAuth } from '@/hooks/useAuth';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';
import type { Organization } from '@/lib/api';

export default function AdminIndexScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleCreateOrg = useCallback(async () => {
    const name = createName.trim();
    if (!name || !userId) return;
    setCreating(true);
    setError(null);
    const result = await api.data.createOrganization({ name }, userId);
    setCreating(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setCreateName('');
      setShowCreate(false);
      fetchOrgs();
    }
  }, [createName, userId, fetchOrgs]);

  const handleCreatePress = useCallback(() => {
    if (!createName.trim()) return;
    handleCreateOrg();
  }, [createName, handleCreateOrg]);

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

      {!showCreate ? (
        <Button
          title={t('admin.createOrg')}
          onPress={() => setShowCreate(true)}
          variant="primary"
          style={styles.createButton}
          accessibilityLabel={t('admin.createOrg')}
          accessibilityHint={t('admin.createOrgHint')}
        />
      ) : (
        <View style={styles.createCard}>
          <Input
            label={t('admin.orgName')}
            placeholder={t('admin.orgNamePlaceholder')}
            value={createName}
            onChangeText={setCreateName}
            editable={!creating}
            accessibilityLabel={t('admin.orgName')}
            accessibilityHint={t('admin.orgNamePlaceholder')}
          />
          <View style={styles.createActions}>
            <Button
              title={t('common.cancel')}
              onPress={() => {
                setShowCreate(false);
                setCreateName('');
              }}
              variant="secondary"
              disabled={creating}
              style={styles.createActionButton}
            />
            <Button
              title={t('common.save')}
              onPress={handleCreatePress}
              variant="primary"
              disabled={!createName.trim() || creating}
              style={styles.createActionButton}
            />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('admin.orgList')}</Text>
      {orgs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('admin.noOrgs')}</Text>
          <Text style={styles.emptySubtitle}>{t('admin.noOrgsSubtitle')}</Text>
        </View>
      ) : (
        orgs.map((org) => (
          <OrgStructureRow
            key={org.id}
            name={org.name}
            type="org"
            onPress={() => router.push(`/admin/${org.id}`)}
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
  createButton: { marginBottom: spacing.md },
  createCard: { ...cardStyle },
  createActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  createActionButton: { flex: 1 },
  sectionTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyState: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyTitle: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.caption, color: colors.textSecondary },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
