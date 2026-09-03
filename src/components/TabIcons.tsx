import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

function HouseIcon({ color }: { color: string }) {
  return (
    <View style={icon.box}>
      <View style={[icon.roof, { borderBottomColor: color }]} />
      <View style={[icon.wall, { backgroundColor: color }]}>
        <View style={icon.door} />
      </View>
    </View>
  );
}

function ShopIcon({ color }: { color: string }) {
  return (
    <View style={icon.box}>
      <View style={[icon.awning, { backgroundColor: color }]} />
      <View style={icon.posts}>
        <View style={[icon.post, { backgroundColor: color }]} />
        <View style={[icon.post, { backgroundColor: color }]} />
      </View>
      <View style={[icon.counter, { backgroundColor: color }]} />
    </View>
  );
}

export function TabIcon({
  label,
  focused,
  kind,
}: {
  label: string;
  focused: boolean;
  kind: 'farm' | 'play' | 'shop';
}) {
  const color = focused ? '#ffffff' : '#d7c4a0';
  return (
    <View style={styles.wrap}>
      {kind === 'play' ? (
        <View style={[styles.playBadge, focused && styles.playBadgeOn]}>
          <Image source={wordMaizeAssets.corn.fullV2} style={styles.cob} />
        </View>
      ) : kind === 'farm' ? (
        <HouseIcon color={color} />
      ) : (
        <ShopIcon color={color} />
      )}
      <Text style={[styles.caption, focused && styles.captionOn]}>{label}</Text>
    </View>
  );
}

const icon = StyleSheet.create({
  box: { width: 26, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 13,
    borderRightWidth: 13,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  wall: {
    width: 18,
    height: 12,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: { width: 6, height: 7, backgroundColor: '#3b2410', borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  awning: { width: 22, height: 7, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 },
  posts: { width: 18, flexDirection: 'row', justifyContent: 'space-between', height: 8 },
  post: { width: 3, height: 8, borderRadius: 1 },
  counter: { width: 20, height: 5, borderRadius: 1, marginTop: 1 },
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end', minWidth: 64, height: 58 },
  caption: { color: '#d7c4a0', fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginTop: 3 },
  captionOn: { color: '#ffffff' },
  playBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
  },
  playBadgeOn: {
    backgroundColor: '#58c22e',
    shadowColor: '#1d5a12',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 6,
  },
  cob: { width: 34, height: 34, resizeMode: 'contain' },
});
