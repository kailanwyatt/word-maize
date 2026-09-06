import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { palette } from '../theme';
import { WoodPanel } from './WoodPanel';

export function FarmButton({ label, onPress, dim }: { label: string; onPress: () => void; dim?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={dim} onPress={onPress} style={[styles.btn, dim && styles.dim]}>
      {({ pressed }) => (
        <WoodPanel style={styles.btnFrame}>
          <View style={[styles.btnFace, pressed && styles.btnPressed]}>
            <View style={styles.btnShine} />
            <Text style={styles.label}>{label}</Text>
          </View>
        </WoodPanel>
      )}
    </Pressable>
  );
}

export function PlayButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Play" style={styles.playPress}>
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
  const { height } = useWindowDimensions();
  return (
    <WoodPanel style={[styles.panel, { maxHeight: Math.min(height * 0.86, 640) }]}>
      <ScrollView style={styles.panelPaper} bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelBody}>
        {children}
      </ScrollView>
    </WoodPanel>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#160b03',
    shadowOpacity: .38,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  btnFrame: { borderRadius: 16, padding: 4, borderWidth: 1, borderColor: '#d6a64a' },
  btnFace: { minHeight: 46, borderRadius: 12, backgroundColor: palette.green, borderWidth: 2, borderColor: '#83d64e', paddingHorizontal: 24, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  btnPressed: { transform: [{ translateY: 2 }], backgroundColor: '#4cae28' },
  btnShine: { position: 'absolute', left: 10, right: 10, top: 0, height: 11, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, backgroundColor: 'rgba(255,255,255,.15)' },
  dim: { opacity: 0.55 },
  label: { color: 'white', fontWeight: '900', fontSize: 18 },
  panel: {
    borderWidth: 2,
    borderColor: '#d1a04a',
    borderRadius: 22,
    width: '88%',
    maxWidth: 420,
    overflow: 'hidden',
    padding: 5,
    shadowColor: '#160b03',
    shadowOpacity: .55,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 8,
    elevation: 9,
  },
  panelPaper: { backgroundColor: '#fff2bd', borderRadius: 16 },
  panelBody: { padding: 22, paddingBottom: 18 },
  playPress: { width: '86%', maxWidth: 280, alignSelf: 'center' },
  playWrap: {
    width: '100%',
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
