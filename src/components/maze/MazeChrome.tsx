import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import type { MazeSight } from '../../game/mazeVisibility';

export function mazeChromeArt(mode: MazeSight['mode'], stormy: boolean) {
  if (stormy || mode === 'storm') return mazeAssets.chrome.storm;
  if (mode === 'mist') return mazeAssets.chrome.mist;
  if (mode === 'evening') return mazeAssets.chrome.evening;
  return mazeAssets.chrome.sunny;
}

export function mazeFooterArt(mode: MazeSight['mode'], stormy: boolean) {
  if (stormy || mode === 'storm') return mazeAssets.footer.storm;
  if (mode === 'mist') return mazeAssets.footer.mist;
  if (mode === 'evening') return mazeAssets.footer.evening;
  return mazeAssets.footer.sunny;
}

export function MazeChrome({
  source, style, children, tone = 'header',
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  tone?: 'header' | 'footer';
}) {
  return (
    <ImageBackground source={source} style={[styles.frame, style]} resizeMode="cover">
      <View pointerEvents="none" style={[styles.wash, tone === 'footer' && styles.footerWash]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  wash: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(18, 10, 4, 0.16)' },
  footerWash: { backgroundColor: 'rgba(8, 14, 24, 0.56)' },
});
