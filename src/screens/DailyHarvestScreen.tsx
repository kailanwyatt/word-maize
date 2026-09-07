import { useRouter } from 'expo-router';
import { Alert, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from '../components/FarmButton';
import { DAILY_REWARDS } from '../data/shop';
import { useGameStore } from '../store/GameStore';
import { nextDailyDay } from '../store/types';
import { playGameSound } from '../audio/sounds';

function rewardIcon(reward: (typeof DAILY_REWARDS)[number]) {
  if (reward.chest) return wordMaizeAssets.props.chest;
  if (reward.tools?.scarecrow) return wordMaizeAssets.powerups.scarecrow;
  if (reward.tools?.butterBrush) return wordMaizeAssets.powerups.butterBrush;
  if (reward.tools?.cornPicker) return wordMaizeAssets.powerups.cornPicker;
  return wordMaizeAssets.ui.coin;
}

function prizeLabel(reward: (typeof DAILY_REWARDS)[number]) {
  if (reward.chest) return `+${reward.coins ?? 0}`;
  if (reward.tools?.scarecrow) return 'Scarecrow';
  if (reward.tools?.butterBrush) return 'Brush';
  if (reward.tools?.cornPicker) return 'Picker';
  return `+${reward.coins ?? 0}`;
}

export function DailyHarvestScreen() {
  const router = useRouter();
  const store = useGameStore();
  const status = nextDailyDay(store.save.daily);
  const claim = () => {
    const result = store.claimDaily();
    if (result.ok) {
      playGameSound('reward', 0.72);
      Alert.alert('Daily Harvest', `Day ${result.day} gathered.`);
    }
    else Alert.alert('Daily Harvest', 'Come back tomorrow, farmer.');
  };
  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.shopBarn} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Daily Harvest</Text>
          <View style={styles.grid}>
            {DAILY_REWARDS.map(reward => {
              const claimed = store.save.daily.claimedDay >= reward.day && status.alreadyClaimed
                || store.save.daily.claimedDay >= reward.day && reward.day < status.day;
              const today = status.day === reward.day;
              return (
                <View key={reward.day} style={[styles.cell, today && styles.today, claimed && styles.claimed]}>
                  <Text style={styles.day}>Day {reward.day}</Text>
                  <Image source={rewardIcon(reward)} style={styles.icon} />
                  <Text style={styles.prize}>{prizeLabel(reward)}</Text>
                </View>
              );
            })}
          </View>
          <FarmButton label={status.alreadyClaimed ? 'ALREADY CLAIMED' : `CLAIM DAY ${status.day}`} onPress={claim} dim={status.alreadyClaimed} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back to farm" onPress={() => router.back()} style={styles.backHit}>
            <Text style={styles.back}>Back to farm</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1a3a18' },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 32 },
  title: { color: '#fff6c6', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16, textShadowColor: '#1d1408', textShadowRadius: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  cell: { width: '30%', minWidth: 96, maxWidth: 140, backgroundColor: 'rgba(255,242,189,0.9)', borderRadius: 12, borderWidth: 2, borderColor: '#73441f', padding: 8, alignItems: 'center' },
  today: { borderColor: '#66ad36', backgroundColor: '#e7ffc4' },
  claimed: { opacity: 0.5 },
  day: { fontWeight: '900', color: '#51351f' },
  icon: { width: 36, height: 36, resizeMode: 'contain', marginVertical: 4 },
  prize: { fontWeight: '800', color: '#406f20', textAlign: 'center' },
  backHit: { minHeight: 44, justifyContent: 'center', marginTop: 8 },
  back: { color: '#fff6c6', textAlign: 'center', fontWeight: '800' },
});
