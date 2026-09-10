import { useEffect, useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import { MAZE_FARMERS, type MazeFarmerId } from '../../data/mazeFarmers';

const CARD = 148;
const GAP = 12;

export function MazeFarmerPicker({
  value, onChange,
}: {
  value: MazeFarmerId;
  onChange: (id: MazeFarmerId) => void;
}) {
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    const index = Math.max(0, MAZE_FARMERS.findIndex(farmer => farmer.id === value));
    scroll.current?.scrollTo({ x: index * (CARD + GAP), animated: false });
  }, [value]);
  return (
    <ScrollView
      ref={scroll}
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      style={styles.scroller}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD + GAP}
      decelerationRate="fast"
      contentContainerStyle={styles.row}
    >
      {MAZE_FARMERS.map(farmer => {
        const selected = farmer.id === value;
        return (
          <Pressable
            key={farmer.id}
            accessibilityRole="button"
            accessibilityLabel={`Farmer profile ${farmer.name}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(farmer.id)}
            style={[styles.card, selected && styles.selected]}
          >
            <View style={styles.portrait}>
              <Image source={mazeAssets.farmerProfiles[farmer.id]} resizeMode="contain" style={styles.art} />
            </View>
            <View style={[styles.markBar, selected && styles.markBarOn]}>
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected ? <Text style={styles.check}>✓</Text> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0 },
  row: { gap: GAP, paddingVertical: 4, paddingRight: 24 },
  card: {
    width: CARD,
    height: 214,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#c9a87a',
    backgroundColor: '#f3e4c4',
    overflow: 'hidden',
  },
  selected: { borderColor: '#3d8c22' },
  portrait: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#efe0bc',
  },
  art: {
    width: CARD,
    height: 188,
  },
  markBar: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8c09a',
  },
  markBarOn: { backgroundColor: '#3d8c22' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff8e8',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: '#58c22e',
    borderColor: '#fff8e8',
  },
  check: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 16,
    marginTop: -1,
  },
});
