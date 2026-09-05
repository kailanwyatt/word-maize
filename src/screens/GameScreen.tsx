import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CornCob } from '../components/CornCob/CornCob';
import { DebugPanel } from '../components/DebugPanel';
import { FarmButton, Panel } from '../components/FarmButton';
import { HarvestMeter } from '../components/HarvestMeter';
import { Tool, ToolBelt } from '../components/ToolBelt';
import { WordSubmitButton } from '../components/WordSubmitButton';
import { levelById } from '../data/levels';
import { TOOL_INFO } from '../data/shop';
import { exposedKernels, resetLevel, shuffleExposedLetters } from '../game/board';
import { WORD_LIST, wordPrefixes } from '../game/dictionary';
import { completionReward } from '../game/economy';
import { harvestKernels, harvestPercent } from '../game/harvest';
import { findDiscoverablePath } from '../game/powerups';
import { coinsForWord, evaluateLevelStars, objectiveComplete, starGoalComplete } from '../game/scoring';
import { canSubmitSelection, evaluateSubmission } from '../game/selection';
import { Kernel, Tuning } from '../game/types';
import { useCobRotation } from '../hooks/useCobRotation';
import { useKernelTapSelection } from '../hooks/useKernelTapSelection';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const defaultTuning: Tuning = {
  kernelSize: 78,
  touchMultiplier: 1,
  movementThreshold: 28,
  rotationSensitivity: 0.018,
  rotationSnap: 0.7,
  visibleColumns: 6.2,
  harvestTarget: 70,
  haptics: true,
};

export function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = Number(id) || 1;
  const source = levelById(levelId) ?? levelById(1)!;
  const router = useRouter();
  const viewport = useWindowDimensions();
  const store = useGameStore();
  const savedRun = store.save.activeLevelRun?.levelId === levelId ? store.save.activeLevelRun : null;
  const restoredLevel = () => {
    const fresh = resetLevel(source);
    return savedRun ? { ...fresh, kernels: harvestKernels(fresh.kernels, savedRun.harvestedIds) } : fresh;
  };
  const [level, setLevel] = useState(restoredLevel);
  const [harvestingIds, setHarvestingIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [activeTool, setActiveTool] = useState<Tool>();
  const [hints, setHints] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>(savedRun?.foundWords ?? []);
  const [inCoins, setInCoins] = useState(savedRun?.earnedCoins ?? 0);
  const [shuffles, setShuffles] = useState(1);
  const [tuning, setTuning] = useState({ ...defaultTuning, harvestTarget: source.targetHarvestPercent, haptics: store.save.settings.haptics });
  const [debugOpen, setDebugOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [outOf, setOutOf] = useState<Tool | 'energy' | undefined>();
  const [introOpen, setIntroOpen] = useState(!store.save.seenLevelIntros.includes(levelId) && (!!source.story || source.tutorial.length > 0));
  const [toolsUsed, setToolsUsed] = useState(savedRun?.toolsUsed ?? 0);
  const [doubled, setDoubled] = useState(false);
  const [powerUpsOpen, setPowerUpsOpen] = useState(false);
  const busyRef = useRef(false);
  const finishingRef = useRef(false);
  const hydratedRef = useRef(store.ready);
  const busy = harvestingIds.length > 0 || status === 'valid' || busyRef.current;
  const gameWidth = Math.min(viewport.width, 430);
  const cobHeight = Math.min(viewport.height * 0.82, 650);
  const cobWidth = Math.min(gameWidth, cobHeight * (1024 / 1536));
  const cob = useCobRotation(
    1.5,
    level.columns,
    (tuning.visibleColumns / cobWidth) * (tuning.rotationSensitivity / defaultTuning.rotationSensitivity),
    tuning.rotationSnap,
    store.save.settings.reducedMotion,
  );
  const selection = useKernelTapSelection(level.columns, busy);
  const prefixes = useMemo(() => wordPrefixes(WORD_LIST), []);
  const percent = harvestPercent(level.kernels);
  const layersRevealed = new Set(level.kernels.filter(kernel =>
    kernel.layer > 0 && level.kernels.some(other =>
      other.row === kernel.row && other.column === kernel.column && other.layer < kernel.layer && other.harvested,
    ),
  ).map(kernel => `${kernel.row}:${kernel.column}`)).size;
  const runStats = { percent, words: foundWords, toolsUsed, layersRevealed };
  const effectiveLevel = { ...source, objective: { ...source.objective, harvestPercent: tuning.harvestTarget } };
  const complete = objectiveComplete(effectiveLevel, runStats);
  const currentWord = selection.word;
  const canSubmit = canSubmitSelection(selection.path, { busy });
  const harvestedCount = level.kernels.filter(k => k.harvested).length;
  const longest = foundWords.reduce((a, b) => (a.length >= b.length ? a : b), '—');
  const firstClear = !store.save.levels[levelId]?.completed;
  const reward = completionReward({
    wordCoins: inCoins,
    levelReward: source.rewardCoins,
    harvestPercent: percent,
    harvestTarget: tuning.harvestTarget,
    firstClear,
    doubled,
  });
  const payout = reward.total;
  const gameplayBackground = source.world === 'Crow Creek' ? wordMaizeAssets.backgrounds.gameplayCrowCreek
    : source.world === 'Orchard Hollow' ? wordMaizeAssets.backgrounds.gameplayOrchardHollow
    : source.world === 'Moonlight Maize' ? wordMaizeAssets.backgrounds.gameplayMoonlightMaize
    : wordMaizeAssets.backgrounds.gameplayFarmV8;

  useEffect(() => {
    if (!store.ready || hydratedRef.current) return;
    hydratedRef.current = true;
    const run = store.save.activeLevelRun;
    if (!run || run.levelId !== levelId) return;
    const fresh = resetLevel(source);
    setLevel({ ...fresh, kernels: harvestKernels(fresh.kernels, run.harvestedIds) });
    setFoundWords(run.foundWords);
    setInCoins(run.earnedCoins);
    setToolsUsed(run.toolsUsed);
  }, [levelId, source, store.ready, store.save.activeLevelRun]);

  useEffect(() => {
    if (!store.ready || !hydratedRef.current || finishingRef.current) return;
    store.saveLevelRun({
      levelId,
      harvestedIds: level.kernels.filter(kernel => kernel.harvested).map(kernel => kernel.id),
      foundWords,
      earnedCoins: inCoins,
      toolsUsed,
      updatedAt: Date.now(),
    });
  }, [foundWords, inCoins, level.kernels, levelId, store.ready, store.saveLevelRun, toolsUsed]);

  const pulse = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (tuning.haptics && store.save.settings.haptics) Haptics.impactAsync(style).catch(() => {});
  };
  const warn = () => {
    if (tuning.haptics && store.save.settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };
  const handleKernelTap = (kernel: Kernel) => {
    const result = selection.applyTap({ kernel, visible: true });
    if (result.accepted) pulse();
    else warn();
  };
  const submit = () => {
    const result = evaluateSubmission(selection.pathRef.current, WORD_LIST, busy || busyRef.current);
    if (result.harvest) {
      busyRef.current = true;
      setStatus('valid');
      setHarvestingIds(result.harvestIds);
      pulse(Haptics.ImpactFeedbackStyle.Heavy);
      const harvestDuration = store.save.settings.reducedMotion ? 80 : 720 + Math.max(0, result.harvestIds.length - 1) * 70;
      setTimeout(() => {
        setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, result.harvestIds) }));
        setFoundWords(v => (v.includes(result.word) ? v : [...v, result.word]));
        setInCoins(v => v + coinsForWord(result.word));
        setHarvestingIds([]);
        busyRef.current = false;
        selection.clear();
        setStatus('idle');
      }, harvestDuration);
      return;
    }
    if (!selection.pathRef.current.length) return;
    setStatus('invalid');
    if (tuning.haptics && store.save.settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setTimeout(() => setStatus('idle'), store.save.settings.reducedMotion ? 120 : 480);
  };
  const unusedPath = () => findDiscoverablePath(level.kernels, level.columns, WORD_LIST, prefixes, foundWords, level.hintPaths);
  const useTool = (tool: Tool) => {
    if (tool === 'cornPicker') {
      if (!store.save.inventory.cornPicker) { setOutOf('cornPicker'); return; }
      setActiveTool(activeTool === 'cornPicker' ? undefined : 'cornPicker');
      setHints([]);
      return;
    }
    if (!store.save.inventory[tool]) { setOutOf(tool); return; }
    const path = unusedPath();
    if (!path) return;
    if (!store.consumeTool(tool)) return;
    setToolsUsed(value => value + 1);
    setHints(tool === 'scarecrow' ? [path[0].id] : path.map(k => k.id));
    setActiveTool(tool);
    pulse();
  };
  const pick = (kernel: Kernel) => {
    if (activeTool !== 'cornPicker' || busy || busyRef.current) return;
    if (!store.consumeTool('cornPicker')) return;
    setToolsUsed(value => value + 1);
    setHarvestingIds([kernel.id]);
    setTimeout(() => {
      setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, [kernel.id]) }));
      setInCoins(v => v + 8);
      setHarvestingIds([]);
    }, 380);
    setActiveTool(undefined);
    pulse(Haptics.ImpactFeedbackStyle.Heavy);
  };
  const resetBoard = () => {
    store.clearLevelRun();
    setLevel(resetLevel(source));
    selection.clear();
    cob.reset(1.5);
    setFoundWords([]); setInCoins(0); setHints([]);
    setActiveTool(undefined); setStatus('idle'); setShuffles(1); setDoubled(false);
    setHarvestingIds([]); setToolsUsed(0);
    busyRef.current = false;
  };
  const finish = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const result = evaluateLevelStars(effectiveLevel, runStats);
    store.completeLevel(levelId, result.stars, percent, payout, {
      wordsFound: foundWords.length,
      longestWord: longest === '—' ? '' : longest,
      completedGoalIds: result.completedGoalIds,
    });
    router.replace('/(tabs)/map');
  };
  const doubleReward = async () => {
    const result = await showRewardedAd('double_coins', store.save.adFree);
    if (result.rewarded) setDoubled(true);
  };
  const grantToolFromAd = async (tool: Tool) => {
    const result = await showRewardedAd('tool', store.save.adFree);
    if (result.rewarded) {
      store.addTools({ [tool]: 1 });
      setOutOf(undefined);
    }
  };
  const shuffle = () => {
    if (!shuffles) return;
    setLevel(prev => ({ ...prev, kernels: shuffleExposedLetters(prev.kernels) }));
    setShuffles(0);
    setHints([]);
    pulse();
  };

  const spin = (direction: 1 | -1) => {
    cob.nudge(direction);
    pulse();
  };


  return (
    <View style={styles.shell}>
      <ImageBackground source={gameplayBackground} style={[styles.bg, { width: gameWidth, height: viewport.height }]} resizeMode="cover">
        <SafeAreaView style={styles.safe}>
          <Pressable style={styles.pause} onPress={() => router.replace('/(tabs)/play')}>
            <Image source={wordMaizeAssets.ui.btnHome} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          </Pressable>
          <View style={styles.sign}>
            <Text style={styles.level}>LEVEL {levelId}</Text>
            <Text style={styles.objective}>
              HARVEST {tuning.harvestTarget}%
              {source.objective.minWords ? ` · ${source.objective.minWords} WORDS` : ''}
              {source.objective.minLongestWord ? ` · ${source.objective.minLongestWord}+ LETTER WORD` : ''}
              {source.objective.minLayersRevealed ? ` · REVEAL ${source.objective.minLayersRevealed}` : ''}
            </Text>
          </View>
          <Pressable style={styles.hintButton} onPress={() => setPowerUpsOpen(true)}>
            <Image source={wordMaizeAssets.ui.btnHeart} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
            <Text style={styles.hintCount}>{store.save.energy || 5}</Text>
          </Pressable>
          <View style={styles.wordOverlay}>
            <WordSubmitButton
              word={currentWord}
              status={status}
              canSubmit={canSubmit && activeTool !== 'cornPicker'}
              pickerMode={activeTool === 'cornPicker'}
              onSubmit={submit}
              onClear={selection.clear}
              reducedMotion={store.save.settings.reducedMotion}
            />
          </View>
          <View style={styles.cob}>
            <CornCob
              kernels={level.kernels}
              rows={level.rows}
              columns={level.columns}
              rotation={cob.rotation}
              tuning={tuning}
              selected={selection.path}
              hints={hints}
              harvestingIds={harvestingIds}
              pickerMode={activeTool === 'cornPicker'}
              butterHints={activeTool === 'butterBrush'}
              rejectedId={selection.rejectedId}
              faulted={status === 'invalid'}
              locked={busy}
              reducedMotion={store.save.settings.reducedMotion}
              onKernelTap={handleKernelTap}
              onPick={pick}
              onRotateStart={cob.begin}
              onRotateMove={cob.move}
              onRotateEnd={cob.end}
              width={cobWidth}
              height={cobHeight}
            />
            <View style={styles.meter}><HarvestMeter percent={percent} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob left" style={styles.rotateLeft} onPress={() => spin(-1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={[styles.rotateIcon, styles.rotateFlip]} />
            </Pressable>
            <View style={styles.sessionCoins}>
              <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
              <Text style={styles.sessionText}>{inCoins}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob right" style={styles.rotateRight} onPress={() => spin(1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={styles.rotateIcon} />
            </Pressable>
            <Pressable style={[styles.shuffle, !shuffles && styles.shuffleOff]} onPress={shuffle}>
              <Text style={styles.shuffleText}>↻</Text>
            </Pressable>
          </View>
          <Modal visible={powerUpsOpen} transparent animationType="slide">
            <View style={styles.modalShade}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 20, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 20 }}>POWER UPS</Text>
                <ToolBelt counts={store.save.inventory} active={activeTool} onUse={(t) => { useTool(t); setPowerUpsOpen(false); }} />
                <FarmButton label="CLOSE" onPress={() => setPowerUpsOpen(false)} />
              </View>
            </View>
          </Modal>
          <DebugPanel
            open={debugOpen}
            onToggle={() => setDebugOpen(v => !v)}
            tuning={tuning}
            onChange={setTuning}
            actions={[
              { label: 'PREVIOUS', onPress: () => router.replace(`/game/${Math.max(1, levelId - 1)}`) },
              { label: 'NEXT', onPress: () => router.replace(`/game/${Math.min(60, levelId + 1)}`) },
              { label: 'TOOLS +10', onPress: () => store.addTools({ scarecrow: 10, butterBrush: 10, cornPicker: 10 }) },
              { label: 'UNLOCK 1–60', onPress: store.unlockCampaign },
              { label: 'REPLAY INTRO', onPress: () => setIntroOpen(true) },
              { label: 'RESET SAVE', onPress: () => Alert.alert('Reset playtest save?', 'This clears coins, stars, tools, and chapter progress.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => { store.resetProgress(); router.replace('/game/1'); } },
              ]), danger: true },
            ]}
            debug={`IDs: ${selection.path.map(k => k.id).join(', ') || '—'}\nWord: ${currentWord || '—'}\nRotation: ${cob.rotation.toFixed(2)}\nVisible/exposed: ${exposedKernels(level.kernels).length}`}
          />
        </SafeAreaView>
      </ImageBackground>

      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.modalShade}>
          <Panel>
            <Text style={styles.modalTitle}>Paused</Text>
            <FarmButton label="RESUME" onPress={() => setPaused(false)} />
            <View style={{ height: 10 }} />
            <FarmButton label="RESTART" onPress={() => { resetBoard(); setPaused(false); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="HOW TO PLAY" onPress={() => { setPaused(false); router.push('/how-to-play'); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="SETTINGS" onPress={() => { setPaused(false); router.push('/settings'); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="QUIT TO FARM" onPress={() => router.replace('/(tabs)/play')} />
          </Panel>
        </View>
      </Modal>

      <Modal visible={complete} transparent animationType="fade">
        <View style={styles.modalShade}>
          <View style={styles.bumperPanel}>
            <View style={styles.bumperHeader}>
              <Text style={styles.bumperTitle}>BUMPER CROP!</Text>
            </View>
            <View style={styles.bumperSubHeader}>
              <Text style={styles.bumperSubTitle}>Level {levelId} Complete</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Image source={wordMaizeAssets.kernels.normalV2} style={styles.statIcon} />
                <Text style={styles.statValue}>{harvestedCount}</Text>
                <Text style={styles.statLabel}>Kernels Harvested</Text>
              </View>
              <View style={styles.statRow}>
                <View style={styles.circleIcon}><Text style={styles.circleText}>{foundWords.length}</Text></View>
                <Text style={styles.statValue}>{foundWords.length}</Text>
                <Text style={styles.statLabel}>Words Found</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.starIcon}>★</Text>
                <View>
                  <Text style={styles.statLabel}>Longest Word</Text>
                  <Text style={styles.statLongest}>{longest}</Text>
                </View>
              </View>
              <View style={styles.rewardBox}>
                <Image source={wordMaizeAssets.ui.coin} style={styles.coinIcon} />
                <Text style={styles.rewardText}>+{payout}</Text>
              </View>
              <Text style={styles.rewardDetail}>
                {firstClear ? `Words ${reward.wordCoins} · First clear ${reward.firstClearCoins} · Bonus ${reward.performanceCoins}` : `Replay word coins ${reward.wordCoins}`}
                {doubled ? ' · ×2' : ''}
              </Text>
              {source.starGoals.map(goal => (
                <Text key={goal.id} style={styles.goalResult}>
                  {starGoalComplete(goal, runStats) ? '★' : '☆'} {goal.label}
                </Text>
              ))}
            </View>
            
            <Image source={wordMaizeAssets.props.harvestBasket} style={styles.bumperBasket} />
            <Image source={wordMaizeAssets.props.tractor} style={styles.bumperTractor} />
            <Image source={wordMaizeAssets.effects.sparkleBurst} style={styles.bumperSparkles} />

            {!store.save.adFree && !doubled ? (
              <>
                <View style={{ height: 10 }} />
                <FarmButton label="DOUBLE REWARD" onPress={doubleReward} />
              </>
            ) : null}
            <View style={{ height: 15 }} />
            <FarmButton label="CONTINUE" onPress={finish} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!outOf && outOf !== 'energy'} transparent animationType="fade">
        <View style={styles.modalShade}>
          <Panel>
            <Text style={styles.modalTitle}>Out of {outOf ? TOOL_INFO[outOf as Tool].title : 'tools'}</Text>
            <Text style={styles.stats}>Watch a harvest ad for one more, or restock at the Farm Store.</Text>
            <View style={{ height: 12 }} />
            <FarmButton label={store.save.adFree ? 'GET 1 FREE' : 'WATCH AD GET 1 FREE'} onPress={() => outOf && outOf !== 'energy' && grantToolFromAd(outOf)} />
            <View style={{ height: 10 }} />
            <FarmButton label="VISIT SHOP" onPress={() => { setOutOf(undefined); router.push('/(tabs)/shop'); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="KEEP HARVESTING" onPress={() => setOutOf(undefined)} />
          </Panel>
        </View>
      </Modal>

      <Modal visible={introOpen} transparent animationType="fade">
        <View style={styles.modalShade}>
          <Panel>
            {source.story?.speaker === 'Patch' ? <Image source={wordMaizeAssets.characters.patchSpeaking} style={styles.storyCharacter} /> : null}
            <Text style={styles.storySpeaker}>{source.story?.speaker ?? 'PATCH'}</Text>
            <Text style={styles.modalTitle}>{source.story?.title ?? `Level ${levelId}`}</Text>
            {source.story ? <Text style={styles.storyText}>{source.story.text}</Text> : null}
            {source.tutorial.map((line, index) => <Text key={line} style={styles.tutorialLine}>{index + 1}. {line}</Text>)}
            <Text style={styles.goalHeading}>GOAL</Text>
            <Text style={styles.stats}>Harvest {source.objective.harvestPercent}%{source.objective.minWords ? ` and find ${source.objective.minWords} words` : ''}{source.objective.minLongestWord ? ` with a ${source.objective.minLongestWord}-letter word` : ''}{source.objective.minLayersRevealed ? ` and reveal ${source.objective.minLayersRevealed} hidden kernel${source.objective.minLayersRevealed > 1 ? 's' : ''}` : ''}.</Text>
            <View style={{ height: 12 }} />
            <FarmButton label="LET'S GROW" onPress={() => { if (levelId === 1) store.markTutorialSeen(); store.markLevelIntroSeen(levelId); setIntroOpen(false); }} />
          </Panel>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%', alignItems: 'center', backgroundColor: '#061a2e' },
  bg: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', paddingTop: 3, paddingBottom: 8 },
  pause: { position: 'absolute', zIndex: 8, top: 18, left: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4 },
  pauseText: { color: '#fadd74', fontSize: 22, fontWeight: '900' },
  hintButton: { position: 'absolute', zIndex: 8, top: 18, right: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4 },
  hintIcon: { width: 26, height: 26, resizeMode: 'contain', tintColor: '#fadd74' },
  hintCount: { position: 'absolute', right: -6, bottom: -10, color: '#ffffff', fontWeight: '900', fontSize: 14, backgroundColor: '#8a5a22', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#fadd74', overflow: 'hidden' },
  sign: { backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', borderTopWidth: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 36, paddingVertical: 8, alignItems: 'center', marginTop: -3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  level: { color: '#ffffff', fontWeight: '900', fontSize: 22, letterSpacing: 1.2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  objective: { color: '#fadd74', fontWeight: '700', fontSize: 11, marginTop: 2 },
  wordOverlay: { position: 'absolute', zIndex: 18, top: 58, alignSelf: 'center' },
  cob: { flex: 1, justifyContent: 'center', minHeight: 390, width: '100%' },
  meter: { position: 'absolute', zIndex: 10, left: 8, bottom: 18 },
  rotateLeft: { position: 'absolute', zIndex: 12, left: 98, bottom: 24, width: 52, height: 52, borderRadius: 16, overflow: 'hidden' },
  rotateRight: { position: 'absolute', zIndex: 12, right: 70, bottom: 24, width: 52, height: 52, borderRadius: 16, overflow: 'hidden' },
  rotateIcon: { width: 52, height: 52, resizeMode: 'cover' },
  rotateFlip: { transform: [{ scaleX: -1 }] },
  sessionCoins: { position: 'absolute', zIndex: 10, alignSelf: 'center', bottom: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(47,33,16,0.9)', borderWidth: 2, borderColor: '#e5b72f', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 3 },
  coin: { width: 22, height: 22, resizeMode: 'contain' },
  sessionText: { color: '#fff6c6', fontWeight: '900', fontSize: 16, marginLeft: 4 },
  shuffle: { position: 'absolute', zIndex: 10, right: 10, bottom: 18, width: 54, height: 54, borderRadius: 27, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center' },
  shuffleOff: { opacity: 0.4 },
  shuffleText: { color: '#ffe676', fontSize: 26, fontWeight: '900' },
  modalShade: { flex: 1, backgroundColor: 'rgba(10,25,18,0.85)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
  stats: { fontSize: 16, lineHeight: 25, textAlign: 'center', color: '#51351f', fontWeight: '700' },
  storySpeaker: { color: '#98702c', fontWeight: '900', fontSize: 12, letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  storyCharacter: { width: 104, height: 126, resizeMode: 'contain', alignSelf: 'center', marginTop: -8, marginBottom: 4 },
  storyText: { color: '#51351f', fontWeight: '700', fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 12 },
  tutorialLine: { color: '#51351f', fontWeight: '700', fontSize: 14, lineHeight: 21, marginBottom: 5 },
  goalHeading: { color: '#5d8b31', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textAlign: 'center', marginTop: 8 },
  goalResult: { color: '#51351f', fontWeight: '800', fontSize: 13 },
  
  bumperPanel: { backgroundColor: '#fdf1cd', borderWidth: 4, borderColor: '#73441f', borderRadius: 22, padding: 22, paddingTop: 60, paddingBottom: 25, width: '85%', maxWidth: 380, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 8, zIndex: 10 },
  bumperHeader: { position: 'absolute', top: -30, backgroundColor: '#58c22e', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 30, borderWidth: 4, borderColor: '#7ee04a', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5, zIndex: 20 },
  bumperTitle: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: 1.5, textShadowColor: 'rgba(40,100,20,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2, transform: [{ rotate: '-2deg' }] },
  bumperSubHeader: { backgroundColor: '#38220f', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16, marginBottom: 20, marginTop: -15, borderWidth: 2, borderColor: '#e4bb40' },
  bumperSubTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  
  statsContainer: { width: '100%', backgroundColor: 'rgba(215, 180, 130, 0.3)', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#c9a572' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 32, height: 32, resizeMode: 'contain' },
  circleIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#58c22e', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  circleText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  starIcon: { fontSize: 32, color: '#ffb300', textShadowColor: '#c27600', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#4c2e17' },
  statLabel: { fontSize: 16, fontWeight: '700', color: '#684525' },
  statLongest: { fontSize: 20, fontWeight: '900', color: '#3f7c19' },
  
  rewardBox: { flexDirection: 'row', backgroundColor: '#6e431f', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 8, borderWidth: 2, borderColor: '#a86f37' },
  coinIcon: { width: 28, height: 28, resizeMode: 'contain', marginRight: 8 },
  rewardText: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  rewardDetail: { color: '#684525', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  
  bumperBasket: { position: 'absolute', bottom: -15, left: -40, width: 140, height: 110, resizeMode: 'contain', zIndex: 30 },
  bumperTractor: { position: 'absolute', bottom: 20, right: -40, width: 130, height: 100, resizeMode: 'contain', zIndex: 30 },
  bumperSparkles: { position: 'absolute', width: 350, height: 350, resizeMode: 'contain', opacity: 0.3, zIndex: 5, pointerEvents: 'none' },
});
