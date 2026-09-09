import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';

export function GameplayStatusBar({
  timeValue, timeCaption, harvested, total, fogActive, chapterName, chapterNumber,
}: {
  timeValue: string;
  timeCaption: string;
  harvested: number;
  total: number;
  fogActive: boolean;
  chapterName: string;
  chapterNumber: number;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.cell}>
        <Image source={wordMaizeAssets.ui.iconHudTime} style={styles.icon} />
        <View>
          <Text style={styles.value}>{timeValue}</Text>
          <Text style={styles.label}>{timeCaption}</Text>
        </View>
      </View>
      <View style={styles.rule} />
      <View style={styles.cell}>
        <Image source={wordMaizeAssets.ui.iconHudHarvest} style={styles.icon} />
        <View>
          <Text style={styles.value}>{harvested}/{total}</Text>
          <Text style={styles.label}>HARVESTED</Text>
        </View>
      </View>
      <View style={styles.rule} />
      <View style={styles.cell}>
        <Image source={fogActive ? wordMaizeAssets.ui.iconHudFog : wordMaizeAssets.ui.iconHudChapter} style={styles.icon} />
        <View style={styles.grow}>
          <Text style={styles.value} numberOfLines={1}>{fogActive ? 'FOG ACTIVE' : chapterName.toUpperCase()}</Text>
          <Text style={styles.label} numberOfLines={1}>{fogActive ? 'EXPLORE TO REVEAL' : `CHAPTER ${chapterNumber}`}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 18, 10, 0.58)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#c78a32cc',
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 6,
  },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  grow: { flex: 1, minWidth: 0 },
  icon: { width: 22, height: 22, resizeMode: 'contain' },
  rule: { width: 1, height: 26, backgroundColor: '#d7ad4b66' },
  value: { color: '#fff6c6', fontWeight: '900', fontSize: 11, letterSpacing: 0.3 },
  label: { color: '#e7c867', fontWeight: '800', fontSize: 8, letterSpacing: 0.6, marginTop: 1 },
});
