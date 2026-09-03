import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export function FarmButton({ label, onPress, dim }: { label: string; onPress: () => void; dim?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, dim && styles.dim]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export function PlayButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Play">
      {({ pressed }) => (
        <View style={styles.playWrap}>
          <View style={styles.playBase} />
          <View style={[styles.playFace, pressed && styles.playPressed]}>
            <View style={styles.playShine} />
            <Text style={styles.playLabel}>PLAY</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: palette.green,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: palette.greenDeep,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dim: { opacity: 0.55 },
  label: { color: 'white', fontWeight: '900', fontSize: 18 },
  panel: {
    backgroundColor: '#fff2bd',
    borderWidth: 4,
    borderColor: '#73441f',
    borderRadius: 22,
    padding: 22,
    paddingBottom: 18,
    width: '88%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  playWrap: {
    width: 280,
    height: 78,
  },
  playBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2a6a14',
  },
  playFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#58c22e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#7ee04a',
  },
  playPressed: { top: 10 },
  playShine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  playLabel: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 34,
    letterSpacing: 3,
    textShadowColor: 'rgba(30,80,16,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
