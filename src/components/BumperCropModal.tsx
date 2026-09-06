import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { FarmButton } from './FarmButton';

type Goal = { id: string; label: string; complete: boolean };

type Props = {
  visible: boolean;
  levelId: number;
  stars: number;
  payout: number;
  harvestedCount: number;
  wordsFound: number;
  longest: string;
  rewardDetail: string;
  goals: Goal[];
  showDouble: boolean;
  reducedMotion: boolean;
  onDouble: () => void;
  onContinue: () => void;
};

const STAR_STAGGER_MS = 420;
const COUNT_MS = 900;

export function BumperCropModal({
  visible,
  levelId,
  stars,
  payout,
  harvestedCount,
  wordsFound,
  longest,
  rewardDetail,
  goals,
  showDouble,
  reducedMotion,
  onDouble,
  onContinue,
}: Props) {
  const [skipped, setSkipped] = useState(false);
  const [revealedStars, setRevealedStars] = useState(0);
  const [shownCoins, setShownCoins] = useState(0);
  const instant = reducedMotion || skipped;

  useEffect(() => {
    if (!visible) {
      setSkipped(false);
      setRevealedStars(0);
      setShownCoins(0);
      return;
    }
    if (instant) {
      setRevealedStars(stars);
      setShownCoins(payout);
      return;
    }
    setRevealedStars(0);
    setShownCoins(0);
    const timers = [1, 2, 3].map(count => setTimeout(() => setRevealedStars(count), count * STAR_STAGGER_MS));
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / COUNT_MS);
      setShownCoins(Math.round(payout * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [visible, stars, payout, instant]);

  const celebrationDone = revealedStars >= 3 && shownCoins >= payout;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.shade}>
        <ScrollView bounces={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.panel}>
          <View style={styles.banner}>
            <Text style={styles.title}>BUMPER CROP!</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={celebrationDone ? 'Bumper crop rewards' : 'Skip celebration'}
            onPress={() => { if (!celebrationDone) setSkipped(true); }}
            style={styles.celebration}
          >
            <Image source={wordMaizeAssets.effects.sparkleBurst} style={styles.sparkles} />
            <Text style={styles.level}>Level {levelId} complete</Text>
            <View style={styles.cast}>
              <Image source={wordMaizeAssets.props.tractorCelebration} style={styles.tractor} />
              <Image source={wordMaizeAssets.characters.patchCelebrating} style={styles.patch} />
              <Image source={wordMaizeAssets.props.harvestBasketFull} style={styles.basket} />
            </View>
            <View accessibilityLabel={`${stars} of 3 stars`} style={styles.starRow}>
              {[0, 1, 2].map(index => {
                const earned = index < stars;
                const shown = index < revealedStars;
                return (
                  <View key={index} style={styles.starSlot}>
                    <Image
                      source={shown && earned ? wordMaizeAssets.ui.mapStarFilled : wordMaizeAssets.ui.mapStarEmpty}
                      style={[styles.starKernel, shown && earned && styles.starKernelOn]}
                    />
                    {shown && earned ? <Image source={wordMaizeAssets.effects.sparkleBurst} style={styles.starSparkle} /> : null}
                  </View>
                );
              })}
            </View>
            <View style={styles.rewardBox}>
              <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
              <Text style={styles.reward}>+{shownCoins.toLocaleString('en-US')}</Text>
            </View>
            <Text style={styles.detail}>{rewardDetail}</Text>
            <View style={styles.stats}>
              <Text style={styles.stat}>{harvestedCount} kernels · {wordsFound} words · {longest}</Text>
              {goals.map(goal => (
                <Text key={goal.id} style={[styles.goal, goal.complete && styles.goalOn]}>
                  {goal.complete ? 'Harvested' : 'Missed'} · {goal.label}
                </Text>
              ))}
            </View>
            {!celebrationDone ? <Text style={styles.skip}>Tap to skip</Text> : null}
          </Pressable>
          {showDouble ? (
            <>
              <View style={{ height: 10 }} />
              <FarmButton label="DOUBLE REWARD" onPress={onDouble} />
            </>
          ) : null}
          <View style={{ height: 12 }} />
          <FarmButton label="CONTINUE" onPress={onContinue} />
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: 'rgba(10,25,18,0.85)' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingTop: 48, paddingBottom: 24 },
  panel: {
    backgroundColor: '#fdf1cd',
    borderWidth: 4,
    borderColor: '#73441f',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    overflow: 'visible',
  },
  celebration: { width: '100%', alignItems: 'center', overflow: 'visible' },
  sparkles: { position: 'absolute', width: '100%', height: 180, resizeMode: 'contain', opacity: 0.35, top: 0 },
  banner: { backgroundColor: '#58c22e', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 22, borderWidth: 3, borderColor: '#7ee04a', marginTop: -42 },
  title: { fontSize: 22, fontWeight: '900', color: '#ffffff', letterSpacing: 1 },
  level: { marginTop: 10, color: '#5d3a18', fontWeight: '800', fontSize: 15 },
  cast: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginTop: 8, minHeight: 92 },
  tractor: { width: 86, height: 66, resizeMode: 'contain' },
  patch: { width: 78, height: 96, resizeMode: 'contain' },
  basket: { width: 78, height: 62, resizeMode: 'contain' },
  starRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 6 },
  starSlot: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  starKernel: { width: 44, height: 44, resizeMode: 'contain', opacity: 0.72 },
  starKernelOn: { opacity: 1, transform: [{ scale: 1.08 }] },
  starSparkle: { position: 'absolute', width: 58, height: 58, resizeMode: 'contain', opacity: 0.7 },
  rewardBox: { flexDirection: 'row', backgroundColor: '#6e431f', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  coin: { width: 28, height: 28, resizeMode: 'contain', marginRight: 8 },
  reward: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  detail: { color: '#684525', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  stats: { width: '100%', marginTop: 10, gap: 4, alignItems: 'center' },
  stat: { color: '#51351f', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  goal: { color: '#8a6a45', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  goalOn: { color: '#3f7c19' },
  skip: { color: '#98702c', fontWeight: '800', fontSize: 11, marginTop: 8 },
});
