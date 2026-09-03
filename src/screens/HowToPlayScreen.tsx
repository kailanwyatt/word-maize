import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FarmButton } from '../components/FarmButton';

const STEPS = [
  { title: '1. Drag letters', body: 'Press a kernel and drag through adjacent letters to spell a word.' },
  { title: '2. Rotate the cob', body: 'Swipe empty cob space left or right. New letters wrap around the ear.' },
  { title: '3. Use tools', body: 'Scarecrow shows a start, Butter Brush reveals a path, Corn Picker plucks one kernel.' },
  { title: '4. Hit the harvest goal', body: 'Clear enough kernels to fill the basket and bring in a bumper crop.' },
];

export function HowToPlayScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>How to Play</Text>
      {STEPS.map(step => (
        <View key={step.title} style={styles.card}>
          <Text style={styles.heading}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
        </View>
      ))}
      <FarmButton label="BACK" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3a18', padding: 20, gap: 10 },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: 'rgba(255,242,189,0.94)', borderRadius: 14, borderWidth: 2, borderColor: '#73441f', padding: 12 },
  heading: { fontWeight: '900', color: '#406f20', fontSize: 16 },
  body: { color: '#51351f', fontWeight: '700', marginTop: 4 },
});
