import { StyleSheet, View } from 'react-native';

export function Chevron({ color = '#8a6a3a', size = 14 }: { color?: string; size?: number }) {
  const h = size * 0.42;
  const w = size * 0.55;
  return (
    <View style={{ width: w + 2, height: h * 2 + 2, justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 0,
          height: 0,
          borderTopWidth: h,
          borderBottomWidth: h,
          borderLeftWidth: w,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'rgba(0,0,0,0.22)',
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: h,
          borderBottomWidth: h,
          borderLeftWidth: w,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

export function GamepadGlyph() {
  return (
    <View style={styles.gamepad}>
      <View style={styles.padBody}>
        <View style={styles.dpad}>
          <View style={styles.dpadArmH} />
          <View style={styles.dpadArmV} />
        </View>
        <View style={styles.buttons}>
          <View style={[styles.dot, styles.dotA]} />
          <View style={[styles.dot, styles.dotB]} />
        </View>
      </View>
    </View>
  );
}

export function TentGlyph() {
  return (
    <View style={styles.tent}>
      <View style={styles.tentRoof}>
        <View style={styles.stripeL} />
        <View style={styles.stripeR} />
      </View>
      <View style={styles.tentBase} />
      <View style={styles.pole} />
    </View>
  );
}

const styles = StyleSheet.create({
  gamepad: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#3d7fe8', alignItems: 'center', justifyContent: 'center' },
  padBody: { width: 30, height: 18, borderRadius: 8, backgroundColor: '#245ec0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  dpad: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dpadArmH: { position: 'absolute', width: 10, height: 3, borderRadius: 1, backgroundColor: '#d7e8ff' },
  dpadArmV: { position: 'absolute', width: 3, height: 10, borderRadius: 1, backgroundColor: '#d7e8ff' },
  buttons: { width: 12, height: 10 },
  dot: { position: 'absolute', width: 5, height: 5, borderRadius: 3 },
  dotA: { right: 0, top: 0, backgroundColor: '#ffd36a' },
  dotB: { left: 0, bottom: 0, backgroundColor: '#ff8a6a' },
  tent: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#f3efe6', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  tentRoof: { width: 0, height: 0, borderLeftWidth: 16, borderRightWidth: 16, borderBottomWidth: 22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#e23b3b', marginBottom: -1 },
  stripeL: { position: 'absolute', left: -5, top: 6, width: 5, height: 16, backgroundColor: '#fff6ea', transform: [{ rotate: '-18deg' }] },
  stripeR: { position: 'absolute', right: -5, top: 6, width: 5, height: 16, backgroundColor: '#fff6ea', transform: [{ rotate: '18deg' }] },
  tentBase: { width: 28, height: 8, backgroundColor: '#c42d2d', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  pole: { position: 'absolute', top: 6, width: 2, height: 28, backgroundColor: '#f7d37a' },
});
