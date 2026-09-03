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
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,248,218,0.96)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b562c',
  },
  word: { color: '#4b2d18', fontSize: 20, fontWeight: '900', letterSpacing: 1.6 },
  valid: { backgroundColor: '#dfffad', borderColor: '#4d8a28' },
  invalid: { backgroundColor: '#ffd2bd', borderColor: '#c45a32' },
});
