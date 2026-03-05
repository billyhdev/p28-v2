import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '@/components/primitives';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

export default function AdminGroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{
    ministryId: string;
    groupId: string;
  }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    api.data.getGroup(groupId).then((r) => {
      setLoading(false);
      if (isApiError(r)) {
        setError(getUserFacingError(r));
      } else {
        setName(r.name);
        setOriginalName(r.name);
      }
    });
  }, [groupId]);

  const hasChanges = name.trim() !== originalName;

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || !groupId) return;
    setSaving(true);
    setError(null);
    const result = await api.data.updateGroup(groupId, { name: trimmed });
    setSaving(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setOriginalName(result.name);
      router.back();
    }
  }, [name, groupId, router]);

  if (loading) {
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
      <Stack.Screen options={{ title: t('admin.editGroup') }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>{t('admin.editGroup')}</Text>

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form card */}
        <Card style={styles.formCard}>
          <Input
            label={t('admin.groupName')}
            placeholder={t('admin.groupNamePlaceholder')}
            value={name}
            onChangeText={setName}
            editable={!saving}
            accessibilityLabel={t('admin.groupName')}
          />

          <Button
            title={saving ? t('profile.saving') : t('common.save')}
            onPress={handleSave}
            disabled={!name.trim() || saving || !hasChanges}
            fullWidth
            style={styles.saveBtn}
            accessibilityLabel={t('common.save')}
            accessibilityHint="Saves the group name"
          />
        </Card>

        {/* Hint text */}
        <Text style={styles.hintText}>
          Changes to the group name will be visible to all members.
        </Text>
      </ScrollView>
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
  formCard: {
    gap: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 10,
  },
  errorText: { ...typography.caption, color: colors.error },
});
