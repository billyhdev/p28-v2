import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { colors, typography, avatarSizes } from '@/theme/tokens';

export interface AvatarProps {
  source?: ImageSourcePropType | null;
  fallbackText?: string;
  size?: keyof typeof avatarSizes;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Avatar({
  source,
  fallbackText,
  size = 'md',
  accessibilityLabel,
  accessibilityHint,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const uri = source && typeof source === 'object' && 'uri' in source ? source.uri : undefined;
  useEffect(() => {
    setImageError(false);
  }, [uri]);
  const dim = avatarSizes[size];
  const containerStyle = [styles.container, { width: dim, height: dim, borderRadius: dim / 2 }];
  const textStyle = [styles.fallbackText, { fontSize: dim * 0.4 }];

  const showImage = source && !imageError;

  if (showImage) {
    return (
      <Image
        source={source}
        style={containerStyle}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onError={() => setImageError(true)}
      />
    );
  }

  const initial = fallbackText ? fallbackText.trim().charAt(0).toUpperCase() : '?';
  return (
    <View
      style={[containerStyle, styles.fallback]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Text style={textStyle}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {},
  fallbackText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});
