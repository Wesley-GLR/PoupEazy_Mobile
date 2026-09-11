import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

const size = 58;

/** Bottom padding a scrollable needs so its last row clears the button. */
export const fabClearance = size + spacing.xl * 2;

export function FloatingActionButton({
  label,
  onPress,
  bottomOffset = 0,
}: {
  label: string;
  onPress: () => void;
  bottomOffset?: number;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { bottom: bottomOffset + spacing.xl },
        pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
      ]}>
      <MaterialCommunityIcons color={colors.textOnPrimary} name="plus" size={28} />
    </Pressable>
  );
}

const styles = {
  button: {
    position: 'absolute',
    right: spacing.xl,
    width: size,
    height: size,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.raised,
  } satisfies ViewStyle,
};
