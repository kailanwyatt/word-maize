import { StyleSheet, Text, View } from 'react-native';

type Slot = { ch: string; filled: boolean; space?: boolean; given?: boolean };

export function WordProgressPanel({
  title, slots, target, complete, compact,
}: {
  title: string; slots: Slot[]; target: string; complete?: boolean; compact?: boolean;
}) {
  return (
    <View style={[styles.board, compact && styles.boardCompact]}>
      <Text style={styles.title} numberOfLines={1}>{title.replace(/ /g, ' ').toUpperCase()}</Text>
      <View style={styles.slots}>
        {slots.map((slot, index) => (
          slot.space
            ? <View key={`space-${index}`} style={styles.gap} />
            : (
              <View key={`${slot.ch}-${index}`} style={[styles.tile, slot.filled && styles.tileFilled, slot.given && styles.tileGiven]}>
                <Text style={[styles.letter, slot.filled && styles.letterFilled]}>{slot.filled || slot.given ? slot.ch : ''}</Text>
              </View>
            )
        ))}
      </View>
      <Text style={styles.find} numberOfLines={1}>
        {complete ? 'WORD COMPLETE' : target ? `FIND:  ${target}` : ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: 'rgba(58, 36, 18, 0.88)',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#d7ad4b',
    paddingTop: 5,
    paddingBottom: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 72,
  },
  boardCompact: { paddingTop: 4, paddingBottom: 4, minHeight: 64 },
  title: { color: '#f3d27a', fontWeight: '900', fontSize: 11, letterSpacing: 1.6 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5, justifyContent: 'center' },
  tile: {
    minWidth: 22,
    height: 26,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: '#f4e2b0',
    borderWidth: 2,
    borderColor: '#c48a32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFilled: { backgroundColor: '#ffe7a0', borderColor: '#e0a43a' },
  tileGiven: { backgroundColor: '#d7f59a' },
  letter: { color: '#5d7f2c', fontWeight: '900', fontSize: 14 },
  letterFilled: { color: '#3f6a16' },
  gap: { width: 8, height: 26 },
  find: { color: '#fff6c6', fontWeight: '900', fontSize: 12, marginTop: 4, letterSpacing: 0.8 },
});
