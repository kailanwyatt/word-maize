import { Image, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

export function TabIcon({
  label,
  focused,
  kind,
}: {
  label: string;
  focused: boolean;
  kind: 'play' | 'shop' | 'fair' | 'profile';
}) {
  const source = kind === 'play'
    ? wordMaizeAssets.ui.tabPlay
    : kind === 'fair'
      ? wordMaizeAssets.ui.iconFairTent
      : kind === 'shop'
        ? wordMaizeAssets.ui.tabShop
        : wordMaizeAssets.ui.tabProfile;
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBadge, focused && styles.iconBadgeOn]}>
        <Image source={source} style={[styles.iconArt, !focused && styles.iconArtDim]} />
      </View>
      <Text style={[styles.caption, focused && styles.captionOn]}>{label}</Text>
      <View style={[styles.underline, focused && styles.underlineOn]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end', minWidth: 64, height: 66 },
  caption: { color: '#d7c4a0', fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginTop: 2 },
  captionOn: { color: '#ffffff' },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  iconBadgeOn: {
    backgroundColor: '#58c22e',
    shadowColor: '#1d5a12',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 6,
  },
  iconArt: { width: 34, height: 34, resizeMode: 'contain' },
  iconArtDim: { opacity: 0.72 },
  underline: { width: 18, height: 3, borderRadius: 2, marginTop: 3, backgroundColor: 'transparent' },
  underlineOn: { backgroundColor: '#58c22e' },
});
