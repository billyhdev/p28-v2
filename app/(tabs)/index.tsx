import { StyleSheet, Text } from 'react-native';
import { Button, Card } from '@/components/primitives';
import EditScreenInfo from '@/components/EditScreenInfo';
import { TabPlaceholderScreen } from '@/components/TabPlaceholderScreen';
import { colors, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <TabPlaceholderScreen title="Home">
      <Card style={styles.card}>
        <Text style={styles.cardText}>Pastel Productivity design system</Text>
        <Button title="Example button" onPress={() => {}} accessibilityLabel="Example button" />
      </Card>
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </TabPlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.cardGap,
  },
  cardText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
