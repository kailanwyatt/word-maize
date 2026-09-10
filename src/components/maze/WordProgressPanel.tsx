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
      {complete ? (
        <View style={styles.done}><Text style={styles.doneText}>WORD COMPLETE</Text></View>
      ) : target ? (
        <View style={styles.find}>
          <Text style={styles.findLabel}>FIND</Text>
          <Text style={styles.findLetter}>{target}</Text>
        </View>
      ) : (
        <View style={styles.findIdle} />
      )}
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
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 78,
  },
  boardCompact: { paddingTop: 3, paddingBottom: 4, minHeight: 70 },
  title: { color: '#f3d27a', fontWeight: '900', fontSize: 11, letterSpacing: 1.6 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: 'center' },
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
  find: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0c43a',
    borderRadius: 10,
    paddingVertical: 2,
    paddingLeft: 8,
    paddingRight: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: '#fff4b0',
  },
  findLabel: { color: '#5a3210', fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  findLetter: { color: '#3b1a08', fontWeight: '900', fontSize: 22, lineHeight: 24 },
  findIdle: { height: 28, marginTop: 5 },
  done: { marginTop: 5, backgroundColor: '#5cae31', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10 },
  doneText: { color: '#fff6c6', fontWeight: '900', fontSize: 11, letterSpacing: 0.8 },
});
