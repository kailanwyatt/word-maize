import { useRouter } from 'expo-router';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

export function HowToPlayScreen() {
  const router = useRouter();
  const t = useMessages();
  const store = useGameStore();
  const close = () => { store.markTutorialSeen(); router.back(); };
  const steps = [...t.howToPlay.maize, ...t.howToPlay.cob];
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{t.howToPlay.title}</Text>
          {steps.map(step => (
            <View key={step.title} style={styles.card}>
              <Text style={styles.heading}>{step.title}</Text>
              {'pest' in step && step.pest ? (
                <View style={styles.pestRow}>
                  <Image source={wordMaizeAssets.obstacles.caterpillar} style={styles.pest} />
                  <Image source={wordMaizeAssets.obstacles.crow} style={styles.pest} />
                  <Image source={wordMaizeAssets.obstacles.squirrel} style={styles.pest} />
                  <Image source={wordMaizeAssets.obstacles.weed} style={styles.pest} />
                </View>
              ) : null}
              <Text style={styles.body}>{step.body}</Text>
            </View>
          ))}
          <FarmButton label={t.common.gotIt} onPress={close} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1a3a18' },
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 10, paddingBottom: 32 },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8, textShadowColor: '#1d1408', textShadowRadius: 6 },
  card: { backgroundColor: 'rgba(255,242,189,0.94)', borderRadius: 14, borderWidth: 2, borderColor: '#73441f', padding: 12 },
  heading: { fontWeight: '900', color: '#406f20', fontSize: 16 },
  body: { color: '#51351f', fontWeight: '700', marginTop: 4 },
  pestRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
  pest: { width: 36, height: 36, resizeMode: 'contain' },
});
