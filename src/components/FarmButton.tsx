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
});
