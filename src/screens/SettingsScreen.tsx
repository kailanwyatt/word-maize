import { useRouter } from 'expo-router';
import { Alert, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../monetization/config';
import { restorePurchases } from '../monetization/purchases';
import { useGameStore } from '../store/GameStore';

export function SettingsScreen() {
  const router = useRouter();
  const { save, setSetting, setAdFree } = useGameStore();
  const restore = async () => {
    const result = await restorePurchases();
    if (result.adFree) setAdFree(true);
    Alert.alert('Restore', result.message);
  };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarm} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.board}>
            <Text style={styles.title}>Settings</Text>
            {([
              ['sfx', 'Sound Effects'],
              ['haptics', 'Haptics'],
              ['notifications', 'Notifications'],
              ['reducedMotion', 'Reduced Motion'],
            ] as const).map(([key, label]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Switch value={save.settings[key]} onValueChange={value => setSetting(key, value)} />
              </View>
            ))}
            <View style={styles.row}><Text style={styles.label}>Language</Text><Text style={styles.value}>English</Text></View>
            <View style={{ height: 16 }} />
            <FarmButton label="HOW TO PLAY" onPress={() => router.push('/how-to-play')} />
            <View style={{ height: 10 }} />
            <FarmButton label="RESTORE PURCHASES" onPress={restore} />
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.linkHit}>
              <Text style={styles.link}>Privacy Policy</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkHit}>
              <Text style={styles.link}>Terms of Use</Text>
            </Pressable>
            <View style={{ height: 12 }} />
            <FarmButton label="BACK" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1a3a18' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 28 },
  board: {
    backgroundColor: 'rgba(26,58,24,0.92)',
    borderWidth: 3,
    borderColor: '#c78a32',
    borderRadius: 20,
    padding: 16,
  },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,246,198,0.2)' },
  label: { color: '#fff6c6', fontWeight: '800', fontSize: 16, flex: 1, paddingRight: 12 },
  value: { color: '#f7dfa0', fontWeight: '800' },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  link: { color: '#dfffad', textAlign: 'center', fontWeight: '800' },
});
