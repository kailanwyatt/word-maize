import type { ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

/** Transparent HUD overlay. Decorative corn lives in the scrolling maze world. */
export function MazeChrome({
  style, children, onLayout,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  tone?: 'header' | 'footer';
  fog?: boolean;
}) {
  return (
    <View pointerEvents="box-none" onLayout={onLayout} style={style}>
      {children}
    </View>
  );
}
