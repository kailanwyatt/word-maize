import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WoodPanel } from './WoodPanel';

type BoardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  wrapStyle?: StyleProp<ViewStyle>;
  radius?: number;
  depth?: number;
  wood?: boolean;
  lip?: string;
  face?: string;
  rim?: string;
  shine?: boolean;
};

export function RaisedBoard({
  children,
  style,
  wrapStyle,
  radius = 18,
  depth = 5,
  wood = false,
  lip = '#2a1608',
  face = '#3a2410',
  shine = true,
}: BoardProps) {
  const innerRadius = Math.max(0, radius - depth);
  const round = { borderRadius: radius };
  return (
    <View style={[styles.shadow, round, wrapStyle]}>
      <View style={[styles.clip, round, { backgroundColor: lip }]}>
        <View
          style={[
            styles.face,
            {
              marginBottom: depth,
              backgroundColor: wood ? '#4a2813' : face,
              borderBottomLeftRadius: innerRadius,
              borderBottomRightRadius: innerRadius,
            },
          ]}
        >
          {wood ? (
            <WoodPanel
              style={[styles.fill, { borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: innerRadius, borderBottomRightRadius: innerRadius }, style]}
              imageStyle={{ borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: innerRadius, borderBottomRightRadius: innerRadius }}
            >
              {children}
            </WoodPanel>
          ) : (
            <View style={[styles.fill, style]}>{children}</View>
          )}
          {shine ? <View pointerEvents="none" style={styles.shine} /> : null}
        </View>
      </View>
    </View>
  );
}

export function RaisedChip({
  children,
  lip,
  face,
  style,
}: {
  children: ReactNode;
  lip: string;
  face: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[chipStyles.wrap, style]}>
      <View style={[chipStyles.body, { backgroundColor: lip }]}>
        <View style={[chipStyles.face, { backgroundColor: face }]}>{children}</View>
      </View>
    </View>
  );
}

export function RaisedAction({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} style={actionStyles.press}>
      {({ pressed }) => (
        <View style={actionStyles.shadow}>
          <View style={actionStyles.body}>
            <View style={[actionStyles.face, pressed && actionStyles.pressed]}>
              <View pointerEvents="none" style={actionStyles.shine} />
              <Text style={actionStyles.label}>{label}</Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#160b03',
    shadowOpacity: 0.42,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 6,
    boxShadow: '0 5px 8px rgba(16, 8, 2, 0.42)',
  },
  clip: {
    overflow: 'hidden',
  },
  face: { overflow: 'hidden' },
  fill: { overflow: 'hidden' },
  shine: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

const chipStyles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 47 },
  body: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  face: {
    flex: 1,
    minHeight: 44,
    marginBottom: 3,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

const actionStyles = StyleSheet.create({
  press: { minWidth: 76 },
  shadow: {
    minWidth: 76,
    borderRadius: 11,
    shadowColor: '#12380a',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 3,
    elevation: 3,
    boxShadow: '0 3px 5px rgba(12, 40, 8, 0.28)',
  },
  body: {
    height: 38,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#1d6a12',
  },
  face: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#58c22e',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  pressed: { height: 27, marginTop: 5 },
  shine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: { color: '#ffffff', fontWeight: '900', fontSize: 10, letterSpacing: 0.6 },
});
