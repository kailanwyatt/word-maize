import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

export function SplashView({ progress }: { progress: number }) {
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.wrap} resizeMode="cover">
      <Image source={wordMaizeAssets.corn.fullV2} style={styles.logo} />
      <Text style={styles.title}>WORD MAIZE</Text>
      <Text style={styles.sub}>Harvesting words...</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a3a18' },
  logo: { width: 160, height: 160, resizeMode: 'contain' },
  title: { color: '#fff6c6', fontSize: 36, fontWeight: '900', marginTop: 8, textShadowColor: '#1d1408', textShadowRadius: 6 },
  sub: { color: '#f7dfa0', fontWeight: '800', marginTop: 8, marginBottom: 18 },
  track: { width: '64%', height: 12, borderRadius: 8, backgroundColor: 'rgba(20,16,8,0.55)', overflow: 'hidden', borderWidth: 2, borderColor: '#e5b72f' },
  fill: { height: '100%', backgroundColor: '#66ad36' },
  pct: { color: '#fff6c6', fontWeight: '900', marginTop: 8 },
});
