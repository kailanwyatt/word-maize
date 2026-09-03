import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { DAILY_REWARDS } from '../data/shop';
import { useGameStore } from '../store/GameStore';
import { nextDailyDay } from '../store/types';

export function DailyHarvestScreen() {
  const router = useRouter();
  const store = useGameStore();
  const status = nextDailyDay(store.save.daily);
  const claim = () => {
    const result = store.claimDaily();
    if (result.ok) Alert.alert('Daily Harvest', `Day ${result.day} gathered.`);
    else Alert.alert('Daily Harvest', 'Come back tomorrow, farmer.');
  };
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Daily Harvest</Text>
      <View style={styles.grid}>
        {DAILY_REWARDS.map(reward => {
          const claimed = store.save.daily.claimedDay >= reward.day && status.alreadyClaimed
            || store.save.daily.claimedDay >= reward.day && reward.day < status.day;
          const today = status.day === reward.day;
          return (
            <View key={reward.day} style={[styles.cell, today && styles.today, claimed && styles.claimed]}>
              <Text style={styles.day}>Day {reward.day}</Text>
              {reward.chest ? <Image source={wordMaizeAssets.props.chest} style={styles.icon} /> : <Image source={wordMaizeAssets.ui.coin} style={styles.icon} />}
              <Text style={styles.prize}>{reward.coins ? `+${reward.coins}` : 'Tool'}</Text>
            </View>
          );
        })}
      </View>
      <FarmButton label={status.alreadyClaimed ? 'ALREADY CLAIMED' : `CLAIM DAY ${status.day}`} onPress={claim} dim={status.alreadyClaimed} />
      <View style={{ height: 12 }} />
      <Pressable onPress={() => router.back()}><Text style={styles.back}>Back to farm</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a3a18', padding: 20 },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  cell: { width: '30%', minWidth: 96, backgroundColor: 'rgba(255,242,189,0.9)', borderRadius: 12, borderWidth: 2, borderColor: '#73441f', padding: 8, alignItems: 'center' },
  today: { borderColor: '#66ad36', backgroundColor: '#e7ffc4' },
  claimed: { opacity: 0.5 },
  day: { fontWeight: '900', color: '#51351f' },
  icon: { width: 36, height: 36, resizeMode: 'contain', marginVertical: 4 },
  prize: { fontWeight: '800', color: '#406f20' },
  back: { color: '#dfffad', textAlign: 'center', fontWeight: '800' },
});
