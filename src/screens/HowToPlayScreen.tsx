import { useRouter } from 'expo-router';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { useGameStore } from '../store/GameStore';

const STEPS = [
  { title: '1. Tap letters', body: 'Tap any visible kernels in spelling order to build a word, then press the word to harvest it. Letters do not need to sit next to each other.' },
  { title: '2. Rotate the cob', body: 'Drag left or right, or tap the rotate buttons, to spin the ear and hunt the next letter. Your current word stays selected.' },
  { title: '3. Use tools', body: 'Scarecrow shows a start letter, Butter Brush highlights the letters of a hidden word around the cob, Corn Picker plucks one kernel.' },
  { title: '4. Hit the harvest goal', body: 'Clear enough kernels to fill the basket and bring in a bumper crop.' },
  { title: '5. Watch the pests', body: 'Caterpillars eat letters on a seconds timer; save them in a word or regrow them for free. Crows hide a letter after two words and return it two words later. A 5+ letter word releases one squirrel target. Harvest beside weeds to stop their spread.', pest: true },
  { title: '6. Break webs and frost', body: 'Harvest marked anchor kernels to break webs. Use frozen letters in successful words to crack ice, then use them again to harvest. Butter Brush clears weeds, caterpillars, webs, or frost. Timers pause in menus and in the background.' },
  { title: '7. Read the weather', body: 'Rain pays bonus coins, drought rewards words with 5 or more letters, and wind or storms can rotate the cob after accepted words.' },
];

export function HowToPlayScreen() {
  const router = useRouter();
  const store = useGameStore();
  const close = () => { store.markTutorialSeen(); router.back(); };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>How to Play</Text>
          {STEPS.map(step => (
            <View key={step.title} style={styles.card}>
              <Text style={styles.heading}>{step.title}</Text>
              {'pest' in step ? (
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
          <FarmButton label="GOT IT" onPress={close} />
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
