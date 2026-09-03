import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Settings</Text>
      {([
        ['music', 'Music'],
        ['sfx', 'Sound Effects'],
        ['haptics', 'Haptics'],
      ] as const).map(([key, label]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Switch value={save.settings[key]} onValueChange={value => setSetting(key, value)} />
        </View>
      ))}

      <View style={styles.row}><Text style={styles.label}>Language</Text><Text style={styles.value}>English</Text></View>
      <View style={{ height: 16 }} />
      <FarmButton label="RESTORE PURCHASES" onPress={restore} />
      <View style={{ height: 10 }} />
      <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}><Text style={styles.link}>Privacy Policy</Text></Pressable>
      <Pressable onPress={() => Linking.openURL(TERMS_URL)}><Text style={styles.link}>Terms of Use</Text></Pressable>
      <View style={{ height: 16 }} />
      <FarmButton label="BACK" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3a18', padding: 20 },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,246,198,0.2)' },
  label: { color: '#fff6c6', fontWeight: '800', fontSize: 16 },
  value: { color: '#f7dfa0', fontWeight: '800' },
  link: { color: '#dfffad', textAlign: 'center', fontWeight: '800', marginTop: 10 },
});
