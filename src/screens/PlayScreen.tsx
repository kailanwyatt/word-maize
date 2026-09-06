import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CurrencyBar } from '../components/CurrencyBar';
import { FarmButton, Panel, PlayButton } from '../components/FarmButton';
import { isLevelUnlocked, LEVELS, WORLD_NAME } from '../data/levels';
import { claimableRestorationMilestone, completedRestorationStage, nextRestorationMilestone, RESTORATION_MILESTONES } from '../game/restoration';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';
import { nextDailyDay } from '../store/types';

export function PlayScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [needEnergy, setNeedEnergy] = useState(false);
  const level = LEVELS.find(item => item.id === store.currentLevelId) ?? LEVELS[0];
  const daily = nextDailyDay(store.save.daily);
  const restorationStage = completedRestorationStage(store.completedIds);
  const fieldsRestored = restorationStage === RESTORATION_MILESTONES.length;
  const claimableRestoration = claimableRestorationMilestone(store.completedIds, store.save.claimedRestorations);
  const nextRestoration = claimableRestoration ?? nextRestorationMilestone(store.completedIds, store.save.claimedRestorations);
  const chapterClears = store.completedIds.filter(id => id <= 15).length;
  const levelProgress = store.save.levels[level.id];
  const longestStar = level.starGoals.find(goal => goal.kind === 'longestWord');
  const wordLengthGoal = level.objective.minLongestWord ?? (longestStar?.kind === 'longestWord' ? longestStar.value : 3);
  const quote = fieldsRestored
    ? 'Sweet Corn Fields is shining again. The wagon is ready whenever you are!'
    : level.id === 1
      ? 'Farmer May’s first crop has gone quiet. Let’s wake it up with a few good words!'
      : `Level ${level.id} is waiting on the cob. One more harvest and the farm keeps waking up.`;
  const play = () => {
    const continuing = store.save.activeLevelRun?.levelId === level.id;
    const { energy } = store.energyNow();
    if (!continuing && energy < 1) { setNeedEnergy(true); return; }
    if (!isLevelUnlocked(level.id, store.completedIds) && level.id !== 1) return;
    if (!continuing) store.spendEnergy();
    router.push(`/game/${level.id}`);
  };
  const refill = async () => {
    const result = await showRewardedAd('energy', store.save.adFree);
    if (result.rewarded) {
      store.addEnergy(1);
      setNeedEnergy(false);
    }
  };
  const claimRestoration = () => {
    if (!claimableRestoration || !store.claimRestoration(claimableRestoration.id)) return;
    Alert.alert('Farm restored!', `${claimableRestoration.title}\n+${claimableRestoration.coins} coins added to your harvest.`);
  };
  return (
    <View style={styles.root}>
      <ImageBackground
        source={fieldsRestored ? wordMaizeAssets.backgrounds.homeFarmRestored : wordMaizeAssets.backgrounds.homeFarmUnrestored}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <View style={styles.hero}>
          <Image source={wordMaizeAssets.ui.logo} style={styles.logo} />
          <View style={styles.chapterBadge}>
            <Text style={styles.chapterEyebrow}>CHAPTER ONE</Text>
            <Text style={styles.world}>{WORLD_NAME}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(4, (chapterClears / 15) * 100)}%` }]} />
            </View>
            <Text style={styles.chapterProgress}>{chapterClears}/15 HARVESTS</Text>
          </View>
        </View>
        <View style={styles.dashboard}>
          <View style={styles.storyCard}>
            <Image source={wordMaizeAssets.characters.patchIdle} style={styles.patch} />
            <View style={styles.speech}>
              <Text style={styles.speaker}>PATCH</Text>
              <Text style={styles.quote} numberOfLines={3}>{quote}</Text>
            </View>
          </View>

          {nextRestoration ? (
            <View style={[styles.restorationCard, claimableRestoration && styles.restorationReady]}>
              <Image source={claimableRestoration ? wordMaizeAssets.characters.farmerMayCelebration : wordMaizeAssets.characters.farmerMayWelcome} style={styles.farmerMay} />
              <View style={styles.restorationCopy}>
                <Text style={styles.restorationEyebrow}>FARM PROJECT {Math.min(restorationStage + 1, RESTORATION_MILESTONES.length)}/{RESTORATION_MILESTONES.length}</Text>
                <Text style={styles.restorationTitle}>{nextRestoration.title}</Text>
                <Text style={styles.restorationText} numberOfLines={1}>
                  {claimableRestoration ? `Ready · +${nextRestoration.coins} coins` : `Complete Level ${nextRestoration.requiredLevel} to restore`}
                </Text>
              </View>
              {claimableRestoration ? <Pressable accessibilityRole="button" accessibilityLabel={`Claim ${claimableRestoration.title}`} onPress={claimRestoration} style={styles.restoreButton}><Text style={styles.restoreButtonText}>RESTORE</Text></Pressable> : <Text style={styles.restoreLock}>🔒</Text>}
            </View>
          ) : null}

          <View style={styles.levelPanel}>
            <View style={styles.levelTopline}>
              <View>
                <Text style={styles.levelLabel}>LEVEL {level.id}</Text>
                <Text style={styles.levelName}>{level.name}</Text>
              </View>
              <View style={styles.starsBadge}>
                <Text style={styles.starsText}>{'★'.repeat(levelProgress?.stars ?? 0)}{'☆'.repeat(3 - (levelProgress?.stars ?? 0))}</Text>
              </View>
            </View>
            <View style={styles.objectives}>
              <View style={styles.objectiveChip}>
                <Text style={styles.objectiveValue}>{level.objective.harvestPercent}%</Text>
                <Text style={styles.objectiveLabel}>HARVEST</Text>
              </View>
              <View style={styles.objectiveChip}>
                <Text style={styles.objectiveValue}>{wordLengthGoal}+</Text>
                <Text style={styles.objectiveLabel}>LETTER WORD</Text>
              </View>
              <View style={styles.rewardChip}>
                <Image source={wordMaizeAssets.ui.coin} style={styles.rewardCoin} />
                <Text style={styles.rewardValue}>+{level.rewardCoins}</Text>
              </View>
            </View>
            <PlayButton onPress={play} />
          </View>

          <View style={styles.quickRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={daily.alreadyClaimed ? 'Daily harvest already claimed' : `Daily harvest, day ${daily.day} ready`} style={styles.quickCard} onPress={() => router.push('/daily-harvest')}>
              <Image source={wordMaizeAssets.props.chest} style={styles.chest} />
              <View>
                <Text style={styles.quickTitle}>DAILY HARVEST</Text>
                <Text style={styles.quickText}>{daily.alreadyClaimed ? 'Claimed today' : `Day ${daily.day} is ready`}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="View game map" style={styles.quickCard} onPress={() => router.push('/map')}>
              <Image source={wordMaizeAssets.ui.mapNodeCurrent} style={styles.mapIcon} />
              <View>
                <Text style={styles.quickTitle}>FARM MAP</Text>
                <Text style={styles.quickText}>Choose a level</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.landmarks} pointerEvents="none">
            <Image source={wordMaizeAssets.props.tractorIdle} style={styles.tractor} />
            <Image source={wordMaizeAssets.powerups.scarecrow} style={styles.scarecrow} />
            <Image source={fieldsRestored ? wordMaizeAssets.props.harvestBasketFull : wordMaizeAssets.props.harvestBasketPartial} style={styles.basket} />
          </View>
        </View>
      </SafeAreaView>
      <Modal visible={needEnergy} transparent animationType="fade">
        <View style={styles.shade}>
          <Panel>
            <Text style={styles.modalTitle}>Out of energy</Text>
            <Text style={styles.body}>Energy grows back every 20 minutes, or watch a harvest ad for one extra ear.</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={store.save.adFree ? 'GET 1 ENERGY' : 'WATCH AD FOR ENERGY'} onPress={refill} />
            <View style={{ height: 10 }} />
            <FarmButton label="BACK TO FARM" onPress={() => setNeedEnergy(false)} />
          </Panel>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,28,20,0.12)' },
  safe: { flex: 1, minHeight: 0 },
  hero: { height: 112, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  logo: { width: 142, height: 96, resizeMode: 'contain' },
  chapterBadge: { flex: 1, backgroundColor: 'rgba(51,31,12,0.92)', borderWidth: 2, borderColor: '#d7ad4b', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7 },
  chapterEyebrow: { color: '#e7c867', fontWeight: '900', fontSize: 9, letterSpacing: 1.2 },
  world: { color: '#fff6c6', fontWeight: '900', fontSize: 15, marginTop: 1 },
  progressTrack: { height: 7, backgroundColor: '#1d2914', borderRadius: 5, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', backgroundColor: '#69c83a', borderRadius: 5 },
  chapterProgress: { color: '#f5dda0', fontSize: 8, fontWeight: '900', marginTop: 3 },
  dashboard: { flex: 1, minHeight: 0, paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  storyCard: { minHeight: 92, flexDirection: 'row', alignItems: 'flex-end' },
  patch: { width: 78, height: 96, resizeMode: 'contain', zIndex: 2, marginRight: -7 },
  speech: { flex: 1, backgroundColor: 'rgba(255,242,189,0.96)', borderWidth: 2, borderColor: '#73441f', borderRadius: 16, paddingLeft: 14, paddingRight: 10, paddingVertical: 8 },
  speaker: { color: '#98702c', fontWeight: '900', fontSize: 11, letterSpacing: 1.4 },
  quote: { color: '#51351f', fontWeight: '800', fontSize: 12, lineHeight: 16, marginTop: 2 },
  restorationCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 2, borderColor: '#87652d', backgroundColor: 'rgba(49,74,30,.94)', paddingHorizontal: 8, gap: 7 },
  restorationReady: { borderColor: '#f4cf55', backgroundColor: 'rgba(58,105,28,.96)' },
  farmerMay: { width: 48, height: 58, resizeMode: 'contain', alignSelf: 'flex-end' },
  restorationCopy: { flex: 1, minWidth: 0 },
  restorationEyebrow: { color: '#d7bd73', fontWeight: '900', fontSize: 7, letterSpacing: 1 },
  restorationTitle: { color: '#fff4bb', fontWeight: '900', fontSize: 12, marginTop: 1 },
  restorationText: { color: '#dbe9b7', fontWeight: '700', fontSize: 8, marginTop: 2 },
  restoreButton: { minWidth: 68, paddingHorizontal: 8, paddingVertical: 9, borderRadius: 11, borderWidth: 2, borderColor: '#ffdd65', backgroundColor: '#65b934' },
  restoreButtonText: { color: 'white', fontWeight: '900', fontSize: 9, letterSpacing: .6 },
  restoreLock: { fontSize: 20, opacity: .75 },
  levelPanel: { backgroundColor: 'rgba(52,31,12,0.95)', borderWidth: 3, borderColor: '#d09b38', borderRadius: 20, padding: 11, gap: 9, alignItems: 'center' },
  levelTopline: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelLabel: { color: '#ffffff', fontWeight: '900', fontSize: 18, letterSpacing: 1.2 },
  levelName: { color: '#fadd74', fontWeight: '800', fontSize: 12, marginTop: 1 },
  starsBadge: { borderRadius: 12, backgroundColor: '#251707', paddingHorizontal: 8, paddingVertical: 5 },
  starsText: { color: '#ffd759', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  objectives: { width: '100%', flexDirection: 'row', gap: 6 },
  objectiveChip: { flex: 1, minHeight: 47, borderRadius: 12, backgroundColor: '#fff1bd', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d6aa54' },
  objectiveValue: { color: '#4f7f26', fontWeight: '900', fontSize: 17 },
  objectiveLabel: { color: '#60401f', fontWeight: '900', fontSize: 7, letterSpacing: .5 },
  rewardChip: { flex: 1, minHeight: 47, flexDirection: 'row', gap: 4, borderRadius: 12, backgroundColor: '#6b431a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d6aa54' },
  rewardCoin: { width: 24, height: 24, resizeMode: 'contain' },
  rewardValue: { color: '#fff1a0', fontWeight: '900', fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: { flex: 1, minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, paddingHorizontal: 8, backgroundColor: 'rgba(255,242,189,0.95)', borderWidth: 2, borderColor: '#73441f' },
  chest: { width: 39, height: 39, resizeMode: 'contain' },
  mapIcon: { width: 38, height: 38, resizeMode: 'contain' },
  quickTitle: { color: '#51351f', fontWeight: '900', fontSize: 9 },
  quickText: { color: '#7a582c', fontWeight: '800', fontSize: 9, marginTop: 2 },
  landmarks: { flex: 1, minHeight: 62, maxHeight: 98, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  tractor: { width: 124, height: 88, resizeMode: 'contain' },
  scarecrow: { width: 64, height: 78, resizeMode: 'contain' },
  basket: { width: 72, height: 58, resizeMode: 'contain' },
  shade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#51351f', fontWeight: '700' },
});
