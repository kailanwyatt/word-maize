import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import { MAZE_FARMERS, type MazeFarmerId } from '../../data/mazeFarmers';

export function MazeFarmerPicker({
  value, onChange, compact = false,
}: {
  value: MazeFarmerId;
  onChange: (id: MazeFarmerId) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.grid}>
      {MAZE_FARMERS.map(farmer => {
        const selected = farmer.id === value;
        return (
          <Pressable
            key={farmer.id}
            accessibilityRole="button"
            accessibilityLabel={`Farmer profile ${farmer.name}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(farmer.id)}
            style={[styles.cell, compact && styles.cellCompact, selected && styles.selected]}
          >
            <Image source={mazeAssets.farmerProfiles[farmer.id]} resizeMode="contain" style={styles.art} />
            {selected ? (
              <View style={styles.check}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '22%',
    aspectRatio: 0.9,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2c48a',
    backgroundColor: '#f6ead0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cellCompact: { borderRadius: 12 },
  selected: { borderColor: '#3d8c22', borderWidth: 3, backgroundColor: '#e7f5c5' },
  art: { width: '112%', height: '112%', marginBottom: -6 },
  check: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#58c22e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#ffffff', fontWeight: '900', fontSize: 11, lineHeight: 13, marginTop: -1 },
});
