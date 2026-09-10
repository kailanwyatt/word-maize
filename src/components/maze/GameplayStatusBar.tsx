import { StyleSheet, Text, View } from 'react-native';

export function GameplayStatusBar({
  harvested, total, timeValue, timed,
}: {
  harvested: number;
  total: number;
  timeValue?: string;
  timed?: boolean;
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.value}>{harvested}/{total}</Text>
      <Text style={styles.label}>HARVESTED</Text>
      {timed && timeValue ? <Text style={styles.time}>{timeValue}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginTop: 6,
    alignItems: 'center',
    minWidth: 58,
    backgroundColor: 'rgba(40, 24, 10, 0.94)',
    borderWidth: 2,
    borderColor: '#d7ad4b',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  value: {
    color: '#fff6c6',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.4,
    textShadowColor: '#1d1408',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    color: '#fff6c6',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.6,
    marginTop: 1,
    textShadowColor: '#1d1408',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  time: { color: '#fff6c6', fontWeight: '900', fontSize: 11, marginTop: 2 },
});
