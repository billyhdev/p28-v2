import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/primitives/Button';
import { useAuth } from '@/hooks/useAuth';
import { api, isApiError } from '@/lib/api';
import { getUserFacingError } from '@/lib/errors';
import { t } from '@/lib/i18n';
import type { Group } from '@/lib/api';
import { colors, spacing, typography } from '@/theme/tokens';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  km: 'Khmer',
  ko: 'Korean',
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    api.data.getGroup(id).then((r) => {
      if (isApiError(r)) {
        setError(getUserFacingError(r));
        setGroup(null);
      } else {
        setGroup(r);
      }
      setIsLoading(false);
    });
  }, [id]);

  const loadMembership = useCallback(() => {
    const userId = session?.user?.id;
    if (!userId || !id) return;
    api.data.getGroupsForUser(userId).then((r) => {
      if (!isApiError(r)) {
        setIsMember(r.some((g) => g.id === id));
      }
    });
  }, [session?.user?.id, id]);

  useFocusEffect(
    useCallback(() => {
      loadGroup();
      loadMembership();
    }, [loadGroup, loadMembership])
  );

  const handleJoin = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId || !id) return;
    setIsJoining(true);
    setError(null);
    const result = await api.data.joinGroup(id, userId);
    setIsJoining(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setIsMember(true);
    }
  }, [session?.user?.id, id]);

  const handleLeave = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId || !id) return;
    setIsJoining(true);
    setError(null);
    const result = await api.data.leaveGroup(id, userId);
    setIsJoining(false);
    if (isApiError(result)) {
      setError(getUserFacingError(result));
    } else {
      setIsMember(false);
    }
  }, [session?.user?.id, id]);

  if (!id) {
    router.back();
    return null;
  }

  if (isLoading || !group) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const typeLabel = group.type === 'forum' ? t('groups.forum') : t('groups.ministry');
  const languageName = LANGUAGE_NAMES[group.preferredLanguage] ?? group.preferredLanguage;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {group.bannerImageUrl ? (
        <Image
          source={{ uri: group.bannerImageUrl }}
          style={styles.banner}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="people-outline" size={48} color={colors.ink300} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{typeLabel}</Text>
          {group.country && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.location}>{group.country}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{group.name}</Text>

        {group.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('groups.description')}</Text>
            <Text style={styles.description}>{group.description}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('groups.language')}</Text>
            <Text style={styles.metaValue}>{languageName}</Text>
          </View>
          {group.country && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('groups.location')}</Text>
              <Text style={styles.metaValue}>{group.country}</Text>
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {isMember ? (
            <Button
              title={t('groups.leave')}
              variant="secondary"
              onPress={handleLeave}
              disabled={isJoining}
              accessibilityLabel={t('groups.leave')}
              accessibilityHint="Leaves this group"
            />
          ) : (
            <Button
              title={isJoining ? t('common.loading') : t('groups.join')}
              onPress={handleJoin}
              disabled={isJoining}
              accessibilityLabel={t('groups.join')}
              accessibilityHint="Joins this group"
            />
          )}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Announcements, events, and discussions will appear here.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  banner: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface100,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingTop: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  badge: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  errorBanner: {
    backgroundColor: colors.amberSoft,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  placeholder: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
