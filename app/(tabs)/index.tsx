import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ReflectionPlate } from '@/components/patterns/ReflectionPlate';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { EmptyState } from '@/components/patterns/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery, useGroupsForUserQuery } from '@/hooks/useApiQueries';
import { t } from '@/lib/i18n';
import type { Group } from '@/lib/api';
import { colors, fontFamily, radius, spacing, typography, shadow } from '@/theme/tokens';

const GROUP_CARD_WIDTH = 200;
const GROUP_CARD_IMAGE_HEIGHT = 120;

function GroupCarouselCard({ group }: { group: Group }) {
  const { push } = useRouter();

  return (
    <Pressable
      onPress={() => push(`/group/${group.id}`)}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      accessibilityLabel={`${group.name}`}
      accessibilityHint={t('home.opensGroup')}
    >
      <View style={carouselStyles.card}>
        {group.bannerImageUrl ? (
          <Image
            source={{ uri: group.bannerImageUrl }}
            style={carouselStyles.image}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[carouselStyles.image, carouselStyles.imagePlaceholder]}>
            <Ionicons name="people-outline" size={28} color={colors.outlineVariant} />
          </View>
        )}

        <View style={carouselStyles.info}>
          <Text style={carouselStyles.name} numberOfLines={2}>
            {group.name}
          </Text>
          <View style={carouselStyles.meta}>
            <Text style={carouselStyles.type}>
              {group.type === 'forum' ? t('groups.forum') : t('groups.ministry')}
            </Text>
            {group.memberCount != null ? (
              <View style={carouselStyles.memberRow}>
                <Ionicons name="people" size={12} color={colors.onSurfaceVariant} />
                <Text style={carouselStyles.memberCount}>{group.memberCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data: profile } = useProfileQuery(userId);
  const { data: myGroups = [], isLoading: groupsLoading } = useGroupsForUserQuery(userId);

  const displayName =
    profile && 'firstName' in profile && profile.firstName
      ? profile.firstName
      : profile && 'displayName' in profile && profile.displayName
        ? profile.displayName
        : undefined;

  const renderGroupItem = ({ item }: { item: Group }) => <GroupCarouselCard group={item} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {displayName ? `${t('home.welcomeBack')}` : t('home.welcomeDefault')}
          </Text>
          {displayName ? <Text style={styles.nameText}>{displayName}.</Text> : null}
        </View>

        {/* My Groups — horizontal scroll */}
        <View style={styles.sectionPadded}>
          <SectionHeader
            title={t('home.yourGroups')}
            actionLabel={myGroups.length > 0 ? t('home.seeAll') : undefined}
            onAction={
              myGroups.length > 0
                ? () => router.navigate('/(tabs)/groups?filter=joined')
                : undefined
            }
          />
        </View>

        {groupsLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : myGroups.length === 0 ? (
          <View style={styles.sectionPadded}>
            <EmptyState
              iconName="people-outline"
              title={t('home.noGroupsYet')}
              subtitle={t('home.noGroupsSubtitle')}
              actionLabel={t('home.browseGroups')}
              onAction={() => router.navigate('/(tabs)/groups')}
            />
          </View>
        ) : (
          <FlatList
            data={myGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            ItemSeparatorComponent={() => <View style={styles.carouselSeparator} />}
            scrollEnabled
          />
        )}

        {/* Reflection Plate */}
        <View style={styles.reflectionSection}>
          <ReflectionPlate
            quote={t('home.reflectionQuote')}
            attribution={t('home.reflectionAttribution')}
            variant="dark"
          />
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
    paddingBottom: spacing.xxl + spacing.xl,
  },

  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  welcomeText: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    letterSpacing: -0.2,
    color: colors.onSurface,
  },
  nameText: {
    fontFamily: fontFamily.serifItalic,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    letterSpacing: -0.2,
    color: colors.primary,
  },

  sectionPadded: {
    paddingHorizontal: spacing.screenHorizontal,
  },

  reflectionSection: {
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: spacing.sectionGap,
  },

  loadingRow: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },

  carouselContent: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  carouselSeparator: {
    width: spacing.md,
  },
});

const carouselStyles = StyleSheet.create({
  card: {
    width: GROUP_CARD_WIDTH,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.ambient,
  },
  image: {
    width: '100%',
    height: GROUP_CARD_IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  type: {
    ...typography.labelSm,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  memberCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
