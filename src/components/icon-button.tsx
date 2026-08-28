import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: IconName;
  label: string;
  color?: string;
};

export function IconButton({ icon, label, color = colors.primary, style, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={(state) => [styles.base, state.pressed && styles.pressed, typeof style === 'function' ? style(state) : style]}
      {...props}>
      <MaterialCommunityIcons color={color} name={icon} size={22} />
    </Pressable>
  );
}

const styles = {
  base: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  } satisfies ViewStyle,
  pressed: { backgroundColor: colors.primarySoft } satisfies ViewStyle,
};
