import { StyleSheet, Text, View } from 'react-native';

export function CurrentWord({ word, status }: { word: string; status: 'idle' | 'valid' | 'invalid' }) {
  if (!word) return null;
  return (
    <View style={[styles.wrap, status === 'valid' && styles.valid, status === 'invalid' && styles.invalid]}>
      <Text style={styles.word}>{word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 168,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#3f7c19', // Default to the nice green from the design
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b2d973',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  word: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  valid: { backgroundColor: '#4d8a28', borderColor: '#dfffad' }, // Optional highlight when valid
  invalid: { backgroundColor: '#c45a32', borderColor: '#ffd2bd' },
});
