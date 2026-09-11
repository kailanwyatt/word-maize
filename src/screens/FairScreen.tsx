import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { playGameSound } from '../audio/sounds';
import { CurrencyBar } from '../components/CurrencyBar';
import { PlayButton } from '../components/FarmButton';
import { DialogCopy, FarmDialog } from '../components/FarmDialog';
import { RaisedAction, RaisedBoard, RaisedChip } from '../components/RaisedBoard';
import { isLevelUnlocked, LEVELS } from '../data/levels';
import { secondaryObjective } from '../game/campaign';
import { claimableRestorationMilestone, completedRestorationStage, nextRestorationMilestone, RESTORATION_MILESTONES } from '../game/restoration';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';
import { nextDailyDay } from '../store/types';

export function FairScreen() {
  const router = useRouter();
  const store = useGameStore();
  const [needEnergy, setNeedEnergy] = useState(false);
  const level = LEVELS.find(item => item.id === store.currentLevelId) ?? LEVELS[0];
  const daily = nextDailyDay(store.save.daily);
  const levelProgress = store.save.levels[level.id];
  const extraGoal = secondaryObjective(level);
  const restorationStage = completedRestorationStage(store.completedIds);
  const claimableRestoration = claimableRestorationMilestone(store.completedIds, store.save.claimedRestorations);
  const nextRestoration = claimableRestoration ?? nextRestorationMilestone(store.completedIds, store.save.claimedRestorations);
  const endlessUnlocked = store.save.settings.devUnlock || !!store.save.levels[60]?.completed;
  const endlessRun = store.save.endlessHarvest.active;
  const play = () => {
    const continuing = store.save.activeLevelRun?.levelId === level.id;
    const { energy } = store.energyNow();
    if (!continuing && energy < 1) { setNeedEnergy(true); return; }
    if (!isLevelUnlocked(level.id, store.completedIds, store.save.settings.devUnlock) && level.id !== 1) return;
    if (!continuing) store.spendEnergy();
    router.push(`/game/${level.id}`);
  };
  const refill = async () => {
    const result = await showRewardedAd('energy', store.save.adFree);
    if (result.rewarded) {
      store.addEnergy(1);
      playGameSound('reward', 0.72);
      setNeedEnergy(false);
    }
  };
  const playEndless = () => {
    const run = store.startEndlessHarvest();
    if (!run) return;
    router.push({ pathname: '/game/[id]', params: { id: 'endless', seed: run.seed, stage: String(run.stage) } });
  };
  const abandonEndless = () => Alert.alert(
    'End this harvest?',
    `Your best remains ${store.save.endlessHarvest.bestStage} cob${store.save.endlessHarvest.bestStage === 1 ? '' : 's'}, but the current run will end.`,
    [{ text: 'Keep playing', style: 'cancel' }, { text: 'End run', style: 'destructive', onPress: store.abandonEndlessHarvest }],
  );
  const claimRestoration = () => {
    if (!claimableRestoration || !store.claimRestoration(claimableRestoration.id)) return;
    playGameSound('reward', 0.72);
    Alert.alert('Farm restored!', `${claimableRestoration.title}\n+${claimableRestoration.coins} coins added to your harvest.`);
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={wordMaizeAssets.backgrounds.homeFarmRestored} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CurrencyBar onSettings={() => router.push('/settings')} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <RaisedBoard wood style={styles.hero}>
            <View style={styles.fairHead}>
              <Image source={wordMaizeAssets.ui.iconFairTent} style={styles.fairTent} />
              <View style={styles.fairCopy}>
                <Text style={styles.eyebrow}>THE FAIR</Text>
                <Text style={styles.title}>More word games</Text>
                <Text style={styles.subtitle}>Cob Harvest, Pop-a-Word, Crossword Cob, and Twist & Spell</Text>
              </View>
            </View>
          </RaisedBoard>

          {nextRestoration ? (
            <RaisedBoard
              lip={claimableRestoration ? '#1d6a12' : '#1a3210'}
              face={claimableRestoration ? '#4a8c28' : '#314a1e'}
              rim={claimableRestoration ? '#246818' : '#243818'}
              style={styles.restorationCard}
            >
              <Image source={claimableRestoration ? wordMaizeAssets.characters.farmerMayCelebration : wordMaizeAssets.characters.farmerMayWelcome} style={styles.farmerMay} />
              <View style={styles.restorationCopy}>
                <Text style={styles.restorationEyebrow}>FARM PROJECT {Math.min(restorationStage + 1, RESTORATION_MILESTONES.length)}/{RESTORATION_MILESTONES.length}</Text>
                <Text style={styles.restorationTitle}>{nextRestoration.title}</Text>
                <Text style={styles.restorationText} numberOfLines={1}>
                  {claimableRestoration ? `Ready · +${nextRestoration.coins} coins` : `Complete Level ${nextRestoration.requiredLevel} to restore`}
                </Text>
              </View>
              {claimableRestoration
                ? <RaisedAction label="RESTORE" accessibilityLabel={`Claim ${claimableRestoration.title}`} onPress={claimRestoration} />
                : <Text style={styles.restoreLock}>🔒</Text>}
            </RaisedBoard>
          ) : null}

          <RaisedBoard wood radius={20} style={styles.levelPanel}>
            <View style={styles.levelTopline}>
              <View>
                <Text style={styles.cardEyebrow}>COB HARVEST</Text>
                <Text style={styles.levelLabel}>LEVEL {level.id}</Text>
                <Text style={styles.levelName}>{level.name}</Text>
              </View>
              <View style={styles.starsBadge}>
                <View style={styles.starsFace}>
                  <Text style={styles.starsText}>{'★'.repeat(levelProgress?.stars ?? 0)}{'☆'.repeat(3 - (levelProgress?.stars ?? 0))}</Text>
                </View>
              </View>
            </View>
            <View style={styles.objectives}>
              <RaisedChip lip="#8a6a38" face="#fff1bd">
                <Text style={styles.objectiveValue}>{level.objective.harvestPercent}%</Text>
                <Text style={styles.objectiveLabel}>HARVEST</Text>
              </RaisedChip>
              <RaisedChip lip="#8a6a38" face="#fff1bd">
                <Text style={styles.objectiveValue}>{extraGoal.value}</Text>
                <Text style={styles.objectiveLabel}>{extraGoal.label}</Text>
              </RaisedChip>
              <RaisedChip lip="#3a2410" face="#6b431a">
                <View style={styles.rewardInner}>
                  <Image source={wordMaizeAssets.ui.coin} style={styles.rewardCoin} />
                  <Text style={styles.rewardValue}>+{level.rewardCoins}</Text>
                </View>
              </RaisedChip>
            </View>
            <PlayButton onPress={play} />
            <Pressable accessibilityRole="button" accessibilityLabel="Open Cob Harvest farm map" onPress={() => router.push('/(tabs)/map')} style={styles.mapLink}>
              <Text style={styles.mapLinkText}>FARM MAP · four chapters</Text>
            </Pressable>
          </RaisedBoard>

          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={daily.alreadyClaimed ? 'Daily harvest already claimed' : `Daily harvest, day ${daily.day} ready`} style={styles.quickPress} onPress={() => router.push('/daily-harvest')}>
              <RaisedBoard lip="#6a4018" face="#fff2bd" rim="#6a4018" radius={16} wrapStyle={styles.quickWrap} style={styles.quickCard}>
                <Image source={wordMaizeAssets.props.chest} style={styles.chest} />
                <View style={styles.quickCopy}>
                  <Text style={styles.quickTitle}>DAILY HARVEST</Text>
                  <Text style={styles.quickText}>{daily.alreadyClaimed ? 'Claimed today' : `Day ${daily.day} is ready`}</Text>
                </View>
              </RaisedBoard>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={endlessUnlocked ? (endlessRun ? `Continue Endless Harvest cob ${endlessRun.stage}` : 'Start Endless Harvest') : 'Endless Harvest unlocks after Cob Harvest level 60'}
              disabled={!endlessUnlocked}
              onPress={playEndless}
              onLongPress={endlessRun ? abandonEndless : undefined}
              style={[styles.quickPress, !endlessUnlocked && styles.locked]}
            >
              <RaisedBoard lip="#1a1028" face="#2a1c3d" rim="#3a2850" radius={16} wrapStyle={styles.quickWrap} style={styles.quickCard}>
                <Text style={styles.endlessMark}>∞</Text>
                <View style={styles.quickCopy}>
                  <Text style={styles.endlessTitle}>ENDLESS HARVEST</Text>
                  <Text style={styles.endlessText}>{!endlessUnlocked ? 'Finish Cob Harvest 60' : endlessRun ? `Cob ${endlessRun.stage}` : `Best ${store.save.endlessHarvest.bestStage}`}</Text>
                </View>
              </RaisedBoard>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Play Crossword Cob" onPress={() => router.push('/puzzles?mode=crossword')}>
            <RaisedBoard lip="#123018" face="#16381e" rim="#1e4a24" radius={16} style={styles.gameCard}>
              <View style={styles.gameIcon}>
                <View style={styles.gameIconFace}>
                  <View pointerEvents="none" style={styles.iconShine} />
                  <Text style={styles.gameIconText}>Aa</Text>
                </View>
              </View>
              <View style={styles.gameCopy}>
                <Text style={styles.cardEyebrow}>CROSSWORD COB</Text>
                <Text style={styles.gameTitle}>Place letters on the ear</Text>
                <Text style={styles.gameText}>Authored crossings, then endless new puzzles</Text>
              </View>
              <Text style={styles.gameAction}>PLAY</Text>
            </RaisedBoard>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Play Twist and Spell" onPress={() => router.push('/puzzles?mode=twist')}>
            <RaisedBoard lip="#123018" face="#16381e" rim="#1e4a24" radius={16} style={styles.gameCard}>
              <View style={[styles.gameIcon, styles.twistWell]}>
                <View style={[styles.gameIconFace, styles.twistFace]}>
                  <View pointerEvents="none" style={styles.iconShine} />
                  <Text style={styles.gameIconText}>T</Text>
                </View>
              </View>
              <View style={styles.gameCopy}>
                <Text style={styles.cardEyebrow}>TWIST & SPELL</Text>
                <Text style={styles.gameTitle}>Turn the rings to harvest</Text>
                <Text style={styles.gameText}>Farm words first, then unlimited new cobs</Text>
              </View>
              <Text style={styles.gameAction}>PLAY</Text>
            </RaisedBoard>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Play Pop-a-Word" onPress={() => router.push('/pop-a-word')}>
            <RaisedBoard lip="#5a1a12" face="#7a2818" rim="#a33a22" radius={16} style={styles.gameCard}>
              <View style={[styles.gameIcon, styles.popWell]}>
                <View style={[styles.gameIconFace, styles.popFace]}>
                  <View pointerEvents="none" style={styles.iconShine} />
                  <Text style={styles.gameIconText}>P</Text>
                </View>
              </View>
              <View style={styles.gameCopy}>
                <Text style={styles.cardEyebrow}>POP-A-WORD</Text>
                <Text style={styles.gameTitle}>Pop the right kernels</Text>
                <Text style={styles.gameText}>Complete the word before time runs out</Text>
              </View>
              <Text style={styles.gameAction}>PLAY</Text>
            </RaisedBoard>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <FarmDialog
        visible={needEnergy}
        title="Out of energy"
        onClose={() => setNeedEnergy(false)}
        primary={{ label: store.save.adFree ? 'GET 1 ENERGY' : 'WATCH AD FOR ENERGY', onPress: refill }}
        actions={[{ label: 'BACK TO THE FAIR', onPress: () => setNeedEnergy(false), tone: 'slate' }]}
      >
        <DialogCopy>Energy grows back every 20 minutes, or watch a harvest ad for one extra ear.</DialogCopy>
      </FarmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8,28,20,0.18)' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 24, gap: 10 },
  hero: { paddingHorizontal: 14, paddingVertical: 12 },
  fairHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fairTent: { width: 52, height: 52, resizeMode: 'contain' },
  fairCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#e7c867', fontWeight: '900', fontSize: 10, letterSpacing: 1.4 },
  title: { color: '#fff6c6', fontWeight: '900', fontSize: 24, marginTop: 4 },
  subtitle: { color: '#f5dda0', fontWeight: '700', fontSize: 13, lineHeight: 18, marginTop: 4 },
  restorationCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 7 },
  farmerMay: { width: 48, height: 58, resizeMode: 'contain', alignSelf: 'flex-end' },
  restorationCopy: { flex: 1, minWidth: 0 },
  restorationEyebrow: { color: '#d7bd73', fontWeight: '900', fontSize: 7, letterSpacing: 1 },
  restorationTitle: { color: '#fff4bb', fontWeight: '900', fontSize: 12, marginTop: 1 },
  restorationText: { color: '#dbe9b7', fontWeight: '700', fontSize: 8, marginTop: 2 },
  restoreLock: { fontSize: 20, opacity: .75 },
  levelPanel: { padding: 12, gap: 9, alignItems: 'center' },
  levelTopline: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardEyebrow: { color: '#e7c867', fontWeight: '900', fontSize: 8, letterSpacing: 1.1 },
  levelLabel: { color: '#ffffff', fontWeight: '900', fontSize: 18, letterSpacing: 1.2 },
  levelName: { color: '#fadd74', fontWeight: '800', fontSize: 12, marginTop: 1 },
  starsBadge: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#0c0703' },
  starsFace: { backgroundColor: '#1a0e05', paddingHorizontal: 10, paddingVertical: 6, marginBottom: 3, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  starsText: { color: '#ffd759', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  objectives: { width: '100%', flexDirection: 'row', gap: 6 },
  objectiveValue: { color: '#4f7f26', fontWeight: '900', fontSize: 17 },
  objectiveLabel: { color: '#60401f', fontWeight: '900', fontSize: 7, letterSpacing: .5 },
  rewardInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardCoin: { width: 24, height: 24, resizeMode: 'contain' },
  rewardValue: { color: '#fff1a0', fontWeight: '900', fontSize: 15 },
  mapLink: { paddingVertical: 2 },
  mapLinkText: { color: '#e7c867', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8 },
  quickPress: { flex: 1 },
  quickWrap: { flex: 1 },
  quickCard: { minHeight: 72, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
  quickCopy: { marginTop: 2 },
  chest: { width: 36, height: 36, resizeMode: 'contain' },
  quickTitle: { color: '#51351f', fontWeight: '900', fontSize: 10 },
  quickText: { color: '#7a582c', fontWeight: '800', fontSize: 10, marginTop: 2 },
  endlessMark: { color: '#fff4b4', fontWeight: '900', fontSize: 26, lineHeight: 28 },
  locked: { opacity: 0.72 },
  endlessTitle: { color: '#fff4b4', fontWeight: '900', fontSize: 10 },
  endlessText: { color: '#d9c7ea', fontWeight: '800', fontSize: 10, marginTop: 2 },
  gameCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  gameIcon: { width: 42, height: 45, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1d6a12' },
  gameIconFace: { flex: 1, marginBottom: 3, borderBottomLeftRadius: 11, borderBottomRightRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#58c22e' },
  twistWell: { backgroundColor: '#3a1a58' },
  twistFace: { backgroundColor: '#6c3d91' },
  popWell: { backgroundColor: '#8a1d12' },
  popFace: { backgroundColor: '#d62828' },
  iconShine: { position: 'absolute', top: 0, left: 6, right: 6, height: 10, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)' },
  gameIconText: { color: '#fff6c6', fontWeight: '900', fontSize: 16 },
  gameCopy: { flex: 1, minWidth: 0 },
  gameTitle: { color: '#fff6c6', fontWeight: '900', fontSize: 15, marginTop: 2 },
  gameText: { color: '#dbe9b7', fontWeight: '700', fontSize: 11, marginTop: 2 },
  gameAction: { color: '#f7d85a', fontWeight: '900', fontSize: 11 },
});
