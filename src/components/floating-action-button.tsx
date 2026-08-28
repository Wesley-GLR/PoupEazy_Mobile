import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, type ViewStyle } from 'react-native';

import { colors, radius, shadows } from '@/theme';

export function FloatingActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] }]}>
      <MaterialCommunityIcons color={colors.textOnPrimary} name="plus" size={28} />
    </Pressable>
  );
}

const styles = {
  button: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.raised,
  } satisfies ViewStyle,
};
