import { PropsWithChildren } from 'react';
import { ImageBackground, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  light?: boolean;
}>;

/** A repeatable material surface. Layout, text, and interaction remain native. */
export function WoodPanel({ children, style, imageStyle, light = false }: Props) {
  return (
    <ImageBackground
      source={wordMaizeAssets.ui.materials.woodPlanks}
      resizeMode="repeat"
      style={[styles.surface, style]}
      imageStyle={[styles.texture, imageStyle]}
    >
      <View pointerEvents="none" style={[styles.tone, light && styles.toneLight, imageStyle]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: 'hidden', backgroundColor: '#4a2813' },
  texture: { opacity: 0.9 },
  tone: { position: 'absolute', inset: 0, backgroundColor: 'rgba(30,13,4,.2)' },
  toneLight: { backgroundColor: 'rgba(111,61,17,.06)' },
});
