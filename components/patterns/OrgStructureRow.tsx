import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Badge } from '@/components/primitives/Badge';
import { ListItem } from '@/components/primitives/ListItem';
import { colors, radius, shadow, spacing } from '@/theme/tokens';

export type OrgStructureType = 'org' | 'ministry' | 'group';

export interface OrgStructureRowProps {
  /** Display name (org, ministry, or group name) */
  name: string;
  /** Type badge shown in the row */
  type: OrgStructureType;
  /** Called when row is pressed (navigate to edit) */
  onPress?: () => void;
  /** Optional delete handler; if omitted, no delete control is shown */
  onDelete?: () => void;
  /** Override for accessibility label */
  accessibilityLabel?: string;
  /** Override for accessibility hint */
  accessibilityHint?: string;
}

const TYPE_LABELS: Record<OrgStructureType, string> = {
  org: 'Org',
  ministry: 'Ministry',
  group: 'Group',
};

const TYPE_VARIANTS: Record<OrgStructureType, 'primary' | 'accent' | 'neutral'> = {
  org: 'primary',
  ministry: 'accent',
  group: 'neutral',
};

export function OrgStructureRow({
  name,
  type,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: OrgStructureRowProps) {
  const typeLabel = TYPE_LABELS[type];
  const badgeVariant = TYPE_VARIANTS[type];
  return (
    <View style={styles.wrapper}>
      <ListItem
        title={name}
        right={<Badge label={typeLabel} variant={badgeVariant} />}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? name}
        accessibilityHint={accessibilityHint ?? `Opens ${typeLabel.toLowerCase()} details`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: shadow.cardSoft.shadowOffset,
    shadowOpacity: shadow.cardSoft.shadowOpacity,
    shadowRadius: shadow.cardSoft.shadowRadius,
    elevation: 1,
  },
});
