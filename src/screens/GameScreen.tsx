import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { CornCob } from '../components/CornCob/CornCob';
import { CurrentWord } from '../components/CurrentWord';
import { DebugPanel } from '../components/DebugPanel';
import { FarmButton, Panel } from '../components/FarmButton';
import { HarvestMeter } from '../components/HarvestMeter';
import { Tool, ToolBelt } from '../components/ToolBelt';
import { levelById } from '../data/levels';
import { TOOL_INFO } from '../data/shop';
import { exposedKernels, resetLevel, shuffleExposedLetters } from '../game/board';
import { WORD_LIST, validateWord, wordPrefixes } from '../game/dictionary';
import { areAdjacent } from '../game/adjacency';
import { harvestKernels, harvestPercent } from '../game/harvest';
import { findDiscoverablePath } from '../game/powerups';
import { coinsForWord, completionBonus, starsForLevel } from '../game/scoring';
import { extendSelection } from '../game/selection';
import { Kernel, Tuning } from '../game/types';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const defaultTuning: Tuning = {
  kernelSize: 82,
  touchMultiplier: 1.85,
  snapSensitivity: 0.75,
  movementThreshold: 18,
  directionalBias: 28,
  rotationSensitivity: 0.016,
  rotationSnap: 0.85,
  visibleColumns: 5,
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
  const [level, setLevel] = useState(() => resetLevel(source));
  const [selected, setSelected] = useState<Kernel[]>([]);
  const [harvestingIds, setHarvestingIds] = useState<string[]>([]);
  const selectedRef = useRef<Kernel[]>([]);
  const [rotation, setRotation] = useState(1.5);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [activeTool, setActiveTool] = useState<Tool>();
  const [hints, setHints] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [inCoins, setInCoins] = useState(0);
  const [shuffles, setShuffles] = useState(1);
  const [tuning, setTuning] = useState({ ...defaultTuning, harvestTarget: source.targetHarvestPercent, haptics: store.save.settings.haptics });
  const [debugOpen, setDebugOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [outOf, setOutOf] = useState<Tool | 'energy' | undefined>();
  const [tutorial, setTutorial] = useState(levelId === 1 && !store.save.seenTutorial);
  const [doubled, setDoubled] = useState(false);
  const [powerUpsOpen, setPowerUpsOpen] = useState(false);
  const fly = useRef(new Animated.Value(0)).current;
  const prefixes = useMemo(() => wordPrefixes(WORD_LIST), []);
  const percent = harvestPercent(level.kernels);
  const complete = percent >= tuning.harvestTarget;
  const currentWord = selected.map(k => k.letter).join('');
  const harvestedCount = level.kernels.filter(k => k.harvested).length;
  const longest = foundWords.reduce((a, b) => (a.length >= b.length ? a : b), '—');
  const reward = inCoins + completionBonus(percent, tuning.harvestTarget);
  const payout = doubled ? reward * 2 : reward;

  const pulse = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (tuning.haptics && store.save.settings.haptics) Haptics.impactAsync(style).catch(() => {});
  };
  const animateHarvest = () => {
    fly.setValue(0);
    Animated.timing(fly, { toValue: 1, duration: 620, useNativeDriver: true }).start();
  };
  const setPath = (next: Kernel[]) => { selectedRef.current = next; setSelected(next); };
  
  const handleKernelTap = (kernel: Kernel) => {
    const current = selectedRef.current;
    if (current.length === 0) {
      setHints([]); setPath([kernel]); pulse();
      return;
    }
    const index = current.findIndex(k => k.id === kernel.id);
    if (index !== -1) {
      setPath(current.slice(0, index + 1));
      pulse();
      return;
    }
    const last = current[current.length - 1];
    if (areAdjacent(last, kernel, level.columns)) {
      setPath([...current, kernel]);
      pulse();
    } else {
      setHints([]); setPath([kernel]); pulse();
    }
  };
  const submit = () => {
    const path = selectedRef.current;
    const word = path.map(k => k.letter).join('');
    const result = validateWord(word);
    if (result.valid) {
      setStatus('valid');
      const ids = path.map(k => k.id);
      setHarvestingIds(ids);
      setTimeout(() => {
        setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, ids) }));
        setFoundWords(v => (v.includes(result.word) ? v : [...v, result.word]));
        setInCoins(v => v + coinsForWord(result.word));
        setHarvestingIds([]);
      }, 380);
      pulse(Haptics.ImpactFeedbackStyle.Heavy);
      animateHarvest();
    } else if (path.length) {
      setStatus('invalid');
      if (tuning.haptics && store.save.settings.haptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
    setPath([]);
    setTimeout(() => setStatus('idle'), 480);
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
    setHints(tool === 'scarecrow' ? [path[0].id] : path.map(k => k.id));
    setActiveTool(tool);
    pulse();
  };
  const pick = (kernel: Kernel) => {
    if (activeTool !== 'cornPicker') return;
    if (!store.consumeTool('cornPicker')) return;
    setHarvestingIds([kernel.id]);
    setTimeout(() => {
      setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, [kernel.id]) }));
      setInCoins(v => v + 8);
      setHarvestingIds([]);
    }, 380);
    setActiveTool(undefined);
    animateHarvest();
    pulse(Haptics.ImpactFeedbackStyle.Heavy);
  };
  const resetBoard = () => {
    setLevel(resetLevel(source));
    setSelected([]); selectedRef.current = [];
    setFoundWords([]); setInCoins(0); setHints([]);
    setActiveTool(undefined); setRotation(1.5); setStatus('idle'); setShuffles(1); setDoubled(false);
    setHarvestingIds([]);
  };
  const finish = () => {
    const stars = starsForLevel(percent, tuning.harvestTarget, foundWords.length);
    store.completeLevel(levelId, stars, percent, payout);
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

  const gameWidth = Math.min(viewport.width, 430);
  const cobHeight = Math.min(viewport.height * 0.82, 650);
  const cobWidth = Math.min(gameWidth, cobHeight * (1024 / 1536));

  return (
    <View style={styles.shell}>
      <ImageBackground source={wordMaizeAssets.backgrounds.gameplayFarmV8} style={[styles.bg, { width: gameWidth, height: viewport.height }]} resizeMode="cover">
        <SafeAreaView style={styles.safe}>
          <Pressable style={styles.pause} onPress={() => router.replace('/(tabs)/play')}>
            <Image source={wordMaizeAssets.ui.btnHome} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
          </Pressable>
          <View style={styles.sign}>
            <Text style={styles.level}>LEVEL {levelId}</Text>
            <Text style={styles.objective}>HARVEST {tuning.harvestTarget}% OF THE COB</Text>
          </View>
          <Pressable style={styles.hintButton} onPress={() => setPowerUpsOpen(true)}>
            <Image source={wordMaizeAssets.ui.btnHeart} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' }} />
            <Text style={styles.hintCount}>{store.save.energy || 5}</Text>
          </Pressable>
          <View style={styles.wordOverlay}>
            <Pressable onPress={() => currentWord.length > 0 && submit()}>
              <CurrentWord word={activeTool === 'cornPicker' ? 'PICK ONE KERNEL' : currentWord} status={status} />
            </Pressable>
          </View>
          <View style={styles.cob}>
            <CornCob
              kernels={level.kernels}
              rows={level.rows}
              columns={level.columns}
              rotation={rotation}
              tuning={tuning}
              selected={selected}
              hints={hints}
              harvestingIds={harvestingIds}
              pickerMode={activeTool === 'cornPicker'}
              butterHints={activeTool === 'butterBrush'}
              onKernelTap={handleKernelTap}
              onPick={pick}
              onRotation={setRotation}
              width={cobWidth}
              height={cobHeight}
            />
            <View style={styles.meter}><HarvestMeter percent={percent} /></View>
            <View style={styles.sessionCoins}>
              <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
              <Text style={styles.sessionText}>{inCoins}</Text>
            </View>
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
          <View pointerEvents="none" style={styles.flyLayer}>
            <Animated.Image
              source={wordMaizeAssets.kernels.flying}
              style={[styles.flying, {
                opacity: fly.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 450] }) },
                  { rotate: fly.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '300deg'] }) },
                  { scale: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                ],
              }]}
            />
          </View>
          <DebugPanel
            open={debugOpen}
            onToggle={() => setDebugOpen(v => !v)}
            tuning={tuning}
            onChange={setTuning}
            debug={`IDs: ${selected.map(k => k.id).join(', ') || '—'}\nWord: ${currentWord || '—'}\nRotation: ${rotation.toFixed(2)}\nVisible/exposed: ${exposedKernels(level.kernels).length}`}
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

      <Modal visible={tutorial} transparent animationType="fade">
        <View style={styles.modalShade}>
          <Panel>
            <Text style={styles.modalTitle}>Drag to make a word!</Text>
            <Text style={styles.stats}>Trace adjacent kernels, swipe empty cob to rotate, and harvest {source.targetHarvestPercent}% to finish.</Text>
            <View style={{ height: 12 }} />
            <FarmButton label="LET'S GROW" onPress={() => { store.markTutorialSeen(); setTutorial(false); }} />
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
  sessionCoins: { position: 'absolute', zIndex: 10, alignSelf: 'center', bottom: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(47,33,16,0.9)', borderWidth: 2, borderColor: '#e5b72f', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 3 },
  coin: { width: 22, height: 22, resizeMode: 'contain' },
  sessionText: { color: '#fff6c6', fontWeight: '900', fontSize: 16, marginLeft: 4 },
  shuffle: { position: 'absolute', zIndex: 10, right: 10, bottom: 18, width: 54, height: 54, borderRadius: 27, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center' },
  shuffleOff: { opacity: 0.4 },
  shuffleText: { color: '#ffe676', fontSize: 26, fontWeight: '900' },
  flying: { position: 'absolute', zIndex: 30, width: 58, height: 58, top: '48%', left: '45%', resizeMode: 'contain' },
  flyLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  modalShade: { flex: 1, backgroundColor: 'rgba(10,25,18,0.85)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
  stats: { fontSize: 16, lineHeight: 25, textAlign: 'center', color: '#51351f', fontWeight: '700' },
  
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
  
  bumperBasket: { position: 'absolute', bottom: -15, left: -40, width: 140, height: 110, resizeMode: 'contain', zIndex: 30 },
  bumperTractor: { position: 'absolute', bottom: 20, right: -40, width: 130, height: 100, resizeMode: 'contain', zIndex: 30 },
  bumperSparkles: { position: 'absolute', width: 350, height: 350, resizeMode: 'contain', opacity: 0.3, zIndex: 5, pointerEvents: 'none' },
});
