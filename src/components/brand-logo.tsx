import { Image, type ImageStyle, type StyleProp } from 'react-native';

type BrandLogoProps = {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ImageStyle>;
};

const sources = {
  horizontal: require('../../assets/brand/logo-horizontal.png'),
  vertical: require('../../assets/brand/logo-vertical.png'),
};

export function BrandLogo({ orientation = 'horizontal', style }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="PoupEazy"
      resizeMode="contain"
      source={sources[orientation]}
      style={[orientation === 'horizontal' ? { width: 190, height: 58 } : { width: 180, height: 150 }, style]}
    />
  );
}
