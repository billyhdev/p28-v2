import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/primitives';
import { api, getUserFacingError, isApiError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { colors, spacing, typography, radius, shadow } from '@/theme/tokens';

export default function AdminGroupDetailScreen() {
  const { ministryId, groupId } = useLocalSearchParams<{
    ministryId: string;
    groupId: string;
  }>();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = groupId === 'new';

  useEffect(() => {
    if (groupId === 'new' || !groupId) {
      setLoading(false);
      return;
    }
    api.data.getGroup(groupId).then((r) => {
      setLoading(false);
      if (isApiError(r)) {
        setError(getUserFacingError(r));
      } else {
        setName(r.name);
      }
    });
  }, [groupId]);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    if (isNew) {
      if (!ministryId) {
        setError('Ministry is required');
        setSaving(false);
        return;
      }
      const result = await api.data.createGroup(ministryId, { name: trimmed });
      setSaving(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        router.back();
      }
    } else {
      const result = await api.data.updateGroup(groupId, { name: trimmed });
      setSaving(false);
      if (isApiError(result)) {
        setError(getUserFacingError(result));
      } else {
        router.back();
      }
    }
  }, [name, isNew, ministryId, groupId, router]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
    >
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.card}>
        <Input
          label={t('admin.groupName')}
          placeholder={t('admin.groupNamePlaceholder')}
          value={name}
          onChangeText={setName}
          editable={!saving}
          accessibilityLabel={t('admin.groupName')}
        />
        <Button
          title={t('common.save')}
          onPress={handleSave}
          disabled={!name.trim() || saving}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  padding: spacing.cardPadding,
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
  errorBanner: {
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.button,
  },
  errorText: { ...typography.body, color: colors.error },
});
