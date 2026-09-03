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
import { harvestKernels, harvestPercent } from '../game/harvest';
import { findDiscoverablePath } from '../game/powerups';
import { coinsForWord, completionBonus, starsForLevel } from '../game/scoring';
import { extendSelection } from '../game/selection';
import { Kernel, Tuning } from '../game/types';
import { showRewardedAd } from '../monetization/ads';
import { useGameStore } from '../store/GameStore';

const defaultTuning: Tuning = {
  kernelSize: 42,
  touchMultiplier: 1.85,
  snapSensitivity: 0.75,
  movementThreshold: 18,
  directionalBias: 28,
  rotationSensitivity: 0.016,
  rotationSnap: 0.85,
  visibleColumns: 4,
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
  const start = (kernel: Kernel) => { setHints([]); setPath([kernel]); pulse(); };
  const extend = (kernel: Kernel) => {
    const next = extendSelection(selectedRef.current, kernel, level.columns);
    if (next.length !== selectedRef.current.length) { setPath(next); pulse(); }
  };
  const submit = () => {
    const path = selectedRef.current;
    const word = path.map(k => k.letter).join('');
    const result = validateWord(word);
    if (result.valid) {
      setStatus('valid');
      setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, path.map(k => k.id)) }));
      setFoundWords(v => (v.includes(result.word) ? v : [...v, result.word]));
      setInCoins(v => v + coinsForWord(result.word));
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
    setLevel(prev => ({ ...prev, kernels: harvestKernels(prev.kernels, [kernel.id]) }));
    setInCoins(v => v + 8);
    setActiveTool(undefined);
    animateHarvest();
    pulse(Haptics.ImpactFeedbackStyle.Heavy);
  };
  const resetBoard = () => {
    setLevel(resetLevel(source));
    setSelected([]); selectedRef.current = [];
    setFoundWords([]); setInCoins(0); setHints([]);
    setActiveTool(undefined); setRotation(1.5); setStatus('idle'); setShuffles(1); setDoubled(false);
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
  const cobHeight = Math.min(viewport.height * 0.66, 560);
  const cobWidth = Math.min(gameWidth, cobHeight * (1024 / 1536));

  return (
    <View style={styles.shell}>
      <ImageBackground source={wordMaizeAssets.backgrounds.gameplayFarmV2} style={[styles.bg, { width: gameWidth, height: viewport.height }]} resizeMode="cover">
        <SafeAreaView style={styles.safe}>
          <Pressable style={styles.pause} onPress={() => setPaused(true)}><Text style={styles.pauseText}>Ⅱ</Text></Pressable>
          <View style={styles.sign}>
            <Text style={styles.level}>LEVEL {levelId}</Text>
            <Text style={styles.objective}>HARVEST {tuning.harvestTarget}% OF THE COB</Text>
          </View>
          <Pressable style={styles.hintButton} onPress={() => useTool('scarecrow')}>
            <Image source={wordMaizeAssets.powerups.scarecrow} style={styles.hintIcon} />
            <Text style={styles.hintCount}>{store.save.inventory.scarecrow}</Text>
          </Pressable>
          <View style={styles.wordOverlay}>
            <CurrentWord word={activeTool === 'cornPicker' ? 'PICK ONE KERNEL' : currentWord} status={status} />
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
              pickerMode={activeTool === 'cornPicker'}
              butterHints={activeTool === 'butterBrush'}
              onStart={start}
              onExtend={extend}
              onSubmit={submit}
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
          <ToolBelt counts={store.save.inventory} active={activeTool} onUse={useTool} />
          <View pointerEvents="none" style={styles.flyLayer}>
            <Animated.Image
              source={wordMaizeAssets.kernels.flying}
              style={[styles.flying, {
                opacity: fly.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 220] }) },
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
          <Panel>
            <Image source={wordMaizeAssets.effects.sparkleBurst} style={styles.sparkles} />
            <Image source={wordMaizeAssets.props.tractor} style={styles.tractor} />
            <Text style={styles.crop}>BUMPER CROP!</Text>
            <Text style={styles.done}>Level {levelId} Complete</Text>
            <Text style={styles.stats}>
              {harvestedCount} Kernels Harvested{'\n'}
              {foundWords.length} Words Found{'\n'}
              Longest Word: {longest}{'\n'}
              +{payout} coins{doubled ? ' (doubled)' : ''}
            </Text>
            {!store.save.adFree && !doubled ? (
              <>
                <View style={{ height: 10 }} />
                <FarmButton label="DOUBLE REWARD" onPress={doubleReward} />
              </>
            ) : null}
            <View style={{ height: 10 }} />
            <FarmButton label="CONTINUE" onPress={finish} />
          </Panel>
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
  pause: { position: 'absolute', zIndex: 8, top: 18, left: 13, width: 42, height: 42, borderRadius: 21, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center' },
  pauseText: { color: '#ffe676', fontSize: 19, fontWeight: '900' },
  hintButton: { position: 'absolute', zIndex: 8, top: 16, right: 13, width: 45, height: 45, borderRadius: 23, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center' },
  hintIcon: { width: 28, height: 28, resizeMode: 'contain' },
  hintCount: { position: 'absolute', right: -2, bottom: -9, color: '#fff3a5', fontWeight: '900', fontSize: 16, textShadowColor: '#241400', textShadowRadius: 2 },
  sign: { backgroundColor: 'rgba(74,48,21,0.97)', borderWidth: 2, borderColor: '#805023', borderRadius: 6, paddingHorizontal: 28, paddingVertical: 4, alignItems: 'center' },
  level: { color: '#fff5ca', fontWeight: '900', fontSize: 18, textShadowColor: '#24170e', textShadowRadius: 2 },
  objective: { color: '#f7dfa0', fontWeight: '800', fontSize: 10 },
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
  modalShade: { flex: 1, backgroundColor: 'rgba(20,40,30,0.68)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
  sparkles: { position: 'absolute', width: 280, height: 280, resizeMode: 'contain', opacity: 0.55 },
  tractor: { width: 120, height: 80, resizeMode: 'contain', alignSelf: 'center' },
  crop: { fontSize: 30, fontWeight: '900', color: '#5d8b31', textAlign: 'center' },
  done: { fontSize: 18, fontWeight: '800', color: '#74451f', marginBottom: 12, textAlign: 'center' },
  stats: { fontSize: 16, lineHeight: 25, textAlign: 'center', color: '#51351f', fontWeight: '700' },
});
