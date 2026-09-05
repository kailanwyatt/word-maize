import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

const IDLE = 'TAP KERNELS TO BUILD A WORD';

export function WordSubmitButton({
  word,
  status,
  canSubmit,
  pickerMode,
  onSubmit,
  onClear,
  reducedMotion = false,
}: {
  word: string;
  status: 'idle' | 'valid' | 'invalid';
  canSubmit: boolean;
  pickerMode?: boolean;
  onSubmit: () => void;
  onClear?: () => void;
  reducedMotion?: boolean;
}) {
  const shake = useRef(new Animated.Value(0)).current;
  const label = pickerMode ? 'PICK ONE KERNEL' : word || IDLE;
  const showClear = !pickerMode && word.length > 0 && status !== 'valid';

  useEffect(() => {
    if (status !== 'invalid') {
      shake.setValue(0);
      return;
    }
    shake.setValue(0);
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [status, shake, reducedMotion]);

  return (
    <View style={styles.row}>
      <Pressable
        disabled={!canSubmit || pickerMode}
        onPress={onSubmit}
        accessibilityRole="button"
        accessibilityLabel={canSubmit ? `Submit ${word}` : label}
        accessibilityState={{ disabled: !canSubmit || pickerMode }}
      >
        <Animated.View
          style={[
            styles.wrap,
            !word && !pickerMode && styles.idle,
            canSubmit && styles.ready,
            status === 'valid' && styles.valid,
            status === 'invalid' && styles.invalid,
            { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }) }] },
          ]}
        >
          <Text style={[styles.word, !word && !pickerMode && styles.idleText]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
      {showClear ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear word" onPress={onClear} style={styles.clear}>
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: {
    minWidth: 168,
    maxWidth: 320,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#3f7c19',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b2d973',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  idle: { backgroundColor: '#355c1c', borderColor: '#8fb45a', opacity: 0.92 },
  ready: { backgroundColor: '#4d9a22', borderColor: '#e8ff9a' },
  word: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  idleText: { fontSize: 12, letterSpacing: 0.6 },
  valid: { backgroundColor: '#4d8a28', borderColor: '#dfffad' },
  invalid: { backgroundColor: '#c45a32', borderColor: '#ffd2bd' },
  clear: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#38220f', borderWidth: 2, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#fff6c6', fontSize: 22, fontWeight: '900', marginTop: -2 },
});
