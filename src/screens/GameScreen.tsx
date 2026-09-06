import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { BumperCropModal } from '../components/BumperCropModal';
import { CornCob } from '../components/CornCob/CornCob';
import { DebugPanel } from '../components/DebugPanel';
import { FarmButton, Panel } from '../components/FarmButton';
import { HarvestMeter } from '../components/HarvestMeter';
import { Tool, ToolBelt } from '../components/ToolBelt';
import { WordSubmitButton } from '../components/WordSubmitButton';
import { WeatherOverlay } from '../components/WeatherOverlay';
import { playGameSound } from '../audio/sounds';
import { LEVELS, levelById } from '../data/levels';
import { chapterIndexForLevel } from '../game/campaign';
import { TOOL_INFO } from '../data/shop';
import { exposedKernels, resetLevel, shuffleExposedLetters } from '../game/board';
import { WORD_LIST } from '../game/dictionary';
import { completionReward } from '../game/economy';
import { harvestKernels, harvestPercent } from '../game/harvest';
import { advancePopCharge, dormantKernelIds, festivalCoinBonus, isDormantKernel, reducePopCharge, resolveFlintHarvest, restoreCornVarietyState, restoreFlintState, restorePopCharge, wakeDormantNeighbors } from '../game/cornVarieties';
import { advanceObstacles, blockedKernelIds, clearObstacle, initializeObstacles } from '../game/obstacles';
import { findDiscoverablePath } from '../game/powerups';
import { coinsForWord, evaluateLevelStars, objectiveComplete, starGoalComplete } from '../game/scoring';
import { canSubmitSelection, evaluateSubmission } from '../game/selection';
import { Kernel, Tuning } from '../game/types';
import { weatherCoinBonus, windStep } from '../game/weather';
import { generateEndlessLevel } from '../game/endless';
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
  const { id, seed: seedParam, stage: stageParam } = useLocalSearchParams<{ id: string; seed?: string; stage?: string }>();
  const router = useRouter();
  const viewport = useWindowDimensions();
  const store = useGameStore();
  const endless = id === 'endless';
  const endlessSeed = seedParam ?? store.save.endlessHarvest.active?.seed ?? 'preview';
  const endlessStage = Math.max(1, Number(stageParam) || store.save.endlessHarvest.active?.stage || 1);
  const source = useMemo(
    () => endless ? generateEndlessLevel(endlessSeed, endlessStage, LEVELS) : (levelById(Number(id) || 1) ?? levelById(1)!),
    [endless, endlessSeed, endlessStage, id],
  );
  const levelId = source.id;
  const savedRun = store.save.activeLevelRun?.levelId === levelId ? store.save.activeLevelRun : null;
  const restoredLevel = () => {
    const fresh = resetLevel(source);
    return savedRun ? {
      ...fresh,
      kernels: restoreCornVarietyState(
        restorePopCharge(
          restoreFlintState(harvestKernels(fresh.kernels, savedRun.harvestedIds), savedRun.crackedIds),
          savedRun.popCharges,
        ),
        fresh.columns,
      ),
    } : fresh;
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
  const [obstacles, setObstacles] = useState(() => savedRun?.obstacles ?? initializeObstacles(source.obstacles));
  const [acceptedTurns, setAcceptedTurns] = useState(savedRun?.acceptedTurns ?? savedRun?.foundWords.length ?? 0);
  const [clearingObstacleIds, setClearingObstacleIds] = useState<string[]>([]);
  const [weatherEventKey, setWeatherEventKey] = useState(0);
  const [weatherFeedback, setWeatherFeedback] = useState<string>();
  const busyRef = useRef(false);
  const finishingRef = useRef(false);
  const completionSoundRef = useRef(false);
  const hydratedRef = useRef(store.ready);
  const busy = harvestingIds.length > 0 || status === 'valid' || busyRef.current;
  const gameWidth = Math.min(viewport.width, 430);
  const cobHeight = Math.min(viewport.height * 0.58, 520);
  const cobWidth = Math.min(gameWidth, cobHeight * (1024 / 1536));
  const [board, setBoard] = useState({ width: cobWidth, height: cobHeight });
  const cobRef = useRef<View>(null);
  const basketRef = useRef<View>(null);
  const [harvestFlyTarget, setHarvestFlyTarget] = useState({ x: 42, y: cobHeight - 42 });
  const toolCount = store.save.inventory.scarecrow + store.save.inventory.butterBrush + store.save.inventory.cornPicker;
  const { energy } = store.energyNow();
  const cob = useCobRotation(
    1.5,
    level.columns,
    (tuning.visibleColumns / cobWidth) * (tuning.rotationSensitivity / defaultTuning.rotationSensitivity),
    tuning.rotationSnap,
    store.save.settings.reducedMotion,
  );
  const selection = useKernelTapSelection(level.columns, busy);
  const percent = harvestPercent(level.kernels);
  const layersRevealed = new Set(level.kernels.filter(kernel =>
    kernel.layer > 0 && level.kernels.some(other =>
      other.row === kernel.row && other.column === kernel.column && other.layer < kernel.layer && other.harvested,
    ),
  ).map(kernel => `${kernel.row}:${kernel.column}`)).size;
  const runStats = { percent, words: foundWords, toolsUsed, layersRevealed };
  const effectiveLevel = { ...source, objective: { ...source.objective, harvestPercent: tuning.harvestTarget } };
  const complete = objectiveComplete(effectiveLevel, runStats);
  const starResult = evaluateLevelStars(effectiveLevel, runStats);
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
  const blockedIds = new Set([...blockedKernelIds(obstacles), ...dormantKernelIds(level.kernels)]);
  // Keep the shipped playfield visually identical to the approved React demo.
  // Its full cob is part of the background composition; adding another cob or
  // core behind CornCob makes the board look doubled and breaks its alignment.
  const gameplayBackground = wordMaizeAssets.backgrounds.gameplayApprovedCob;

  useEffect(() => {
    if (complete && !completionSoundRef.current) {
      completionSoundRef.current = true;
      playGameSound('complete', 0.75);
    }
    if (!complete) completionSoundRef.current = false;
  }, [complete]);

  useEffect(() => {
    if (!store.ready || hydratedRef.current) return;
    hydratedRef.current = true;
    const run = store.save.activeLevelRun;
    if (!run || run.levelId !== levelId) return;
    const fresh = resetLevel(source);
    setLevel({
      ...fresh,
      kernels: restoreCornVarietyState(
        restorePopCharge(
          restoreFlintState(harvestKernels(fresh.kernels, run.harvestedIds), run.crackedIds),
          run.popCharges,
        ),
        fresh.columns,
      ),
    });
    setFoundWords(run.foundWords);
    setInCoins(run.earnedCoins);
    setToolsUsed(run.toolsUsed);
    setObstacles(run.obstacles ?? initializeObstacles(source.obstacles));
    setAcceptedTurns(run.acceptedTurns ?? run.foundWords.length);
  }, [levelId, source, store.ready, store.save.activeLevelRun]);

  useEffect(() => {
    if (!endless) return;
    const fresh = resetLevel(source);
    const run = store.save.activeLevelRun?.levelId === source.id ? store.save.activeLevelRun : null;
    setLevel(run ? {
      ...fresh,
      kernels: restoreCornVarietyState(
        restorePopCharge(restoreFlintState(harvestKernels(fresh.kernels, run.harvestedIds), run.crackedIds), run.popCharges),
        fresh.columns,
      ),
    } : fresh);
    setFoundWords(run?.foundWords ?? []);
    setInCoins(run?.earnedCoins ?? 0);
    setToolsUsed(run?.toolsUsed ?? 0);
    setAcceptedTurns(run?.acceptedTurns ?? run?.foundWords.length ?? 0);
    setObstacles(run?.obstacles ?? initializeObstacles(source.obstacles));
    setHarvestingIds([]); setHints([]); setActiveTool(undefined); setStatus('idle'); setShuffles(1); setDoubled(false);
    selection.clear();
    finishingRef.current = false;
    setIntroOpen(endlessStage === 1 && !store.save.seenLevelIntros.includes(source.id));
  }, [endless, endlessSeed, endlessStage, source.id]);

  useEffect(() => {
    if (!store.ready || !hydratedRef.current || finishingRef.current) return;
    store.saveLevelRun({
      levelId,
      harvestedIds: level.kernels.filter(kernel => kernel.harvested).map(kernel => kernel.id),
      crackedIds: level.kernels.filter(kernel => kernel.cracked && !kernel.harvested).map(kernel => kernel.id),
      popCharges: Object.fromEntries(level.kernels.filter(kernel => kernel.popKernel && !kernel.harvested).map(kernel => [kernel.id, kernel.popCharge ?? 0])),
      foundWords,
      earnedCoins: inCoins,
      toolsUsed,
      obstacles,
      acceptedTurns,
      updatedAt: Date.now(),
    });
  }, [acceptedTurns, foundWords, inCoins, level.kernels, levelId, obstacles, store.ready, store.saveLevelRun, toolsUsed]);

  const measureHarvestTarget = useCallback(() => {
    cobRef.current?.measureInWindow((cx, cy) => {
      basketRef.current?.measureInWindow((bx, by, bw, bh) => {
        const next = { x: bx + bw * 0.5 - cx, y: by + bh * 0.38 - cy };
        setHarvestFlyTarget(prev => (Math.abs(prev.x - next.x) < 2 && Math.abs(prev.y - next.y) < 2 ? prev : next));
      });
    });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(measureHarvestTarget);
    return () => cancelAnimationFrame(frame);
  }, [board.height, board.width, gameWidth, measureHarvestTarget, percent, viewport.height, viewport.width]);

  const pulse = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (tuning.haptics && store.save.settings.haptics) Haptics.impactAsync(style).catch(() => {});
  };
  const warn = () => {
    if (tuning.haptics && store.save.settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };
  const handleKernelTap = (kernel: Kernel) => {
    const frost = obstacles.find(obstacle => obstacle.kernelId === kernel.id && obstacle.kind === 'frost' && obstacle.status !== 'cleared');
    if (frost) {
      clearObstacleAnimated(frost);
      playGameSound('backtrack', 0.55);
      pulse(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (blockedIds.has(kernel.id)) { warn(); return; }
    const previousLength = selection.pathRef.current.length;
    const result = selection.applyTap({ kernel, visible: true });
    if (result.accepted) {
      pulse();
      playGameSound(result.path.length < previousLength ? 'backtrack' : 'tap', 0.55);
    }
    else warn();
  };
  const clearObstacleAnimated = (obstacle: typeof obstacles[number]) => {
    setClearingObstacleIds(ids => ids.includes(obstacle.id) ? ids : [...ids, obstacle.id]);
    setTimeout(() => {
      setObstacles(value => clearObstacle(value, obstacle.kernelId));
      setClearingObstacleIds(ids => ids.filter(id => id !== obstacle.id));
    }, store.save.settings.reducedMotion ? 40 : 360);
  };
  const triggerWeather = (message: string) => {
    setWeatherFeedback(message);
    setWeatherEventKey(value => value + 1);
    setTimeout(() => setWeatherFeedback(undefined), store.save.settings.reducedMotion ? 700 : 950);
  };
  const submit = () => {
    const result = evaluateSubmission(selection.pathRef.current, WORD_LIST, busy || busyRef.current);
    if (result.harvest) {
      const flint = resolveFlintHarvest(level.kernels, result.harvestIds);
      const popcorn = advancePopCharge(flint.kernels, level.columns);
      const actualHarvestIds = [...new Set([...flint.harvestIds, ...popcorn.poppedIds])];
      const nextAcceptedTurn = acceptedTurns + 1;
      busyRef.current = true;
      setStatus('valid');
      playGameSound('valid');
      setLevel(prev => {
        const nextFlint = resolveFlintHarvest(prev.kernels, result.harvestIds);
        return { ...prev, kernels: advancePopCharge(nextFlint.kernels, prev.columns).kernels };
      });
      setHarvestingIds(actualHarvestIds);
      pulse(Haptics.ImpactFeedbackStyle.Heavy);
      setAcceptedTurns(nextAcceptedTurn);
      const bonus = weatherCoinBonus(source.weather, result.word);
      const goldenBonus = festivalCoinBonus(level.kernels, result.harvestIds, result.word);
      if (source.weather?.kind === 'rain') triggerWeather(`RAIN BONUS +${bonus}`);
      if (source.weather?.kind === 'drought') {
        triggerWeather(bonus ? `DROUGHT BREAKER +${bonus}` : 'DROUGHT · TRY 5+ LETTERS');
      }
      if (flint.newlyCrackedIds.length) triggerWeather(`${flint.newlyCrackedIds.length > 1 ? 'ARMOR' : 'KERNEL'} CRACKED!`);
      if (popcorn.poppedIds.length) triggerWeather(`POP! +${popcorn.poppedIds.length} KERNEL${popcorn.poppedIds.length > 1 ? 'S' : ''}`);
      if (goldenBonus) triggerWeather(`FESTIVAL BONUS +${goldenBonus}`);
      const harvestDuration = store.save.settings.reducedMotion ? 80 : 720 + Math.max(0, actualHarvestIds.length - 1) * 70;
      setTimeout(() => {
        setLevel(prev => {
          const harvested = harvestKernels(prev.kernels, actualHarvestIds);
          return { ...prev, kernels: wakeDormantNeighbors(harvested, actualHarvestIds, prev.columns) };
        });
        setObstacles(prev => advanceObstacles(prev, actualHarvestIds));
        setFoundWords(v => (v.includes(result.word) ? v : [...v, result.word]));
        setInCoins(v => v + coinsForWord(result.word) + weatherCoinBonus(source.weather, result.word) + goldenBonus);
        setHarvestingIds([]);
        busyRef.current = false;
        selection.clear();
        setStatus('idle');
        playGameSound(actualHarvestIds.length ? 'basket' : 'backtrack', 0.7);
        const weatherStep = windStep(source.weather, nextAcceptedTurn);
        if (weatherStep) {
          triggerWeather(source.weather?.kind === 'storm' ? 'STORM SPIN!' : 'WIND GUST!');
          cob.nudge(weatherStep);
          pulse(Haptics.ImpactFeedbackStyle.Medium);
        }
      }, harvestDuration);
      return;
    }
    if (!selection.pathRef.current.length) return;
    setStatus('invalid');
    setLevel(prev => ({ ...prev, kernels: reducePopCharge(prev.kernels) }));
    playGameSound('invalid', 0.65);
    if (tuning.haptics && store.save.settings.haptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    setTimeout(() => setStatus('idle'), store.save.settings.reducedMotion ? 120 : 480);
  };
  const unusedPath = () => findDiscoverablePath(
    level.kernels.map(kernel => isDormantKernel(kernel) ? { ...kernel, harvested: true } : kernel),
    level.columns,
    WORD_LIST,
    WORD_LIST,
    foundWords,
    level.hintPaths,
  );
  const useTool = (tool: Tool) => {
    if (tool === 'cornPicker') {
      if (!store.save.inventory.cornPicker) { setOutOf('cornPicker'); return; }
      setActiveTool(activeTool === 'cornPicker' ? undefined : 'cornPicker');
      setHints([]);
      return;
    }
    if (!store.save.inventory[tool]) { setOutOf(tool); return; }
    const countered = obstacles.find(obstacle => obstacle.status !== 'cleared' && (
      (tool === 'scarecrow' && obstacle.kind === 'crow')
      || (tool === 'butterBrush' && (obstacle.kind === 'weed' || obstacle.kind === 'caterpillar' || obstacle.kind === 'web' || obstacle.kind === 'frost'))
    ));
    if (countered && store.consumeTool(tool)) {
      setToolsUsed(value => value + 1);
      clearObstacleAnimated(countered);
      pulse();
      return;
    }
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
    setObstacles(value => clearObstacle(value, kernel.id));
    setTimeout(() => {
      setLevel(prev => {
        const harvested = harvestKernels(prev.kernels, [kernel.id]);
        return { ...prev, kernels: wakeDormantNeighbors(harvested, [kernel.id], prev.columns) };
      });
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
    setAcceptedTurns(0);
    setObstacles(initializeObstacles(source.obstacles));
    busyRef.current = false;
  };
  const finish = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (endless) {
      store.completeEndlessStage(payout);
      router.replace({ pathname: '/game/[id]', params: { id: 'endless', seed: endlessSeed, stage: String(endlessStage + 1) } });
    } else {
      store.completeLevel(levelId, starResult.stars, percent, payout, {
        wordsFound: foundWords.length,
        longestWord: longest === '—' ? '' : longest,
        completedGoalIds: starResult.completedGoalIds,
      });
      router.replace(`/map/${chapterIndexForLevel(levelId) + 1}`);
    }
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
    playGameSound('rotate', 0.45);
    pulse();
  };


  return (
    <View style={styles.shell}>
      <ImageBackground source={gameplayBackground} style={[styles.bg, { width: gameWidth }]} resizeMode="cover">
        <WeatherOverlay
          weather={source.weather}
          eventKey={weatherEventKey}
          feedback={weatherFeedback}
          reducedMotion={store.save.settings.reducedMotion}
        />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Pause" style={styles.hudButton} onPress={() => setPaused(true)}>
              <Image source={wordMaizeAssets.ui.btnPause} style={styles.hudIcon} />
            </Pressable>
            <View style={styles.sign}>
              <Text style={styles.level}>{endless ? `ENDLESS ${endlessStage}` : `LEVEL ${levelId}`}</Text>
              <Text style={styles.objective} numberOfLines={2}>
                GOAL {tuning.harvestTarget}%
                {source.objective.minWords ? ` · ${source.objective.minWords} WORDS` : ''}
                {source.objective.minLongestWord ? ` · ${source.objective.minLongestWord}+ LETTER` : ''}
                {source.objective.minLayersRevealed ? ` · REVEAL ${source.objective.minLayersRevealed}` : ''}
              </Text>
            </View>
            <View style={styles.topRight}>
              <View style={styles.energyChip}>
                <Image source={wordMaizeAssets.ui.energy} style={styles.energyIcon} />
                <Text style={styles.energyText}>{energy}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Open tools" style={styles.hudButton} onPress={() => setPowerUpsOpen(true)}>
                <Image source={wordMaizeAssets.powerups.scarecrow} style={styles.toolIcon} />
                <Text style={styles.toolCount}>×{toolCount}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.wordRow}>
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
          <View
            style={styles.cob}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;
              const nextHeight = Math.max(260, height);
              const nextWidth = Math.min(width, nextHeight * (1024 / 1536));
              setBoard(prev => (Math.abs(prev.width - nextWidth) < 2 && Math.abs(prev.height - nextHeight) < 2 ? prev : { width: nextWidth, height: nextHeight }));
              requestAnimationFrame(measureHarvestTarget);
            }}
          >
            <CornCob
              ref={cobRef}
              kernels={level.kernels}
              rows={level.rows}
              columns={level.columns}
              rotation={cob.rotation}
              tuning={tuning}
              selected={selection.path}
              hints={hints}
              harvestingIds={harvestingIds}
              harvestTarget={harvestFlyTarget}
              pickerMode={activeTool === 'cornPicker'}
              butterHints={activeTool === 'butterBrush'}
              rejectedId={selection.rejectedId}
              faulted={status === 'invalid'}
              locked={busy}
              reducedMotion={store.save.settings.reducedMotion}
              obstacles={obstacles}
              clearingObstacleIds={clearingObstacleIds}
              blockedKernelIds={blockedIds}
              onKernelTap={handleKernelTap}
              onPick={pick}
              onRotateStart={cob.begin}
              onRotateMove={cob.move}
              onRotateEnd={() => { cob.end(); playGameSound('rotate', 0.4); }}
              width={board.width}
              height={board.height}
            />
          </View>
          <View style={styles.dock} onLayout={measureHarvestTarget}>
            <HarvestMeter ref={basketRef} percent={percent} catching={harvestingIds.length > 0} />
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob left" style={styles.rotateHit} onPress={() => spin(-1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={[styles.rotateIcon, styles.rotateFlip]} />
            </Pressable>
            <View style={styles.sessionCoins}>
              <Image source={wordMaizeAssets.ui.coin} style={styles.coin} />
              <Text style={styles.sessionText}>{inCoins}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob right" style={styles.rotateHit} onPress={() => spin(1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={styles.rotateIcon} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Shuffle letters" style={[styles.shuffle, !shuffles && styles.shuffleOff]} onPress={shuffle}>
              <Image source={wordMaizeAssets.ui.btnShuffle} style={styles.shuffleIcon} />
            </Pressable>
          </View>
          <Modal visible={powerUpsOpen} transparent animationType="slide">
            <View style={styles.modalShade}>
              <Panel>
                <Text style={styles.modalTitle}>Power-Ups</Text>
                <ToolBelt counts={store.save.inventory} active={activeTool} onUse={(t) => { useTool(t); setPowerUpsOpen(false); }} />
                <View style={{ height: 12 }} />
                <FarmButton label="CLOSE" onPress={() => setPowerUpsOpen(false)} />
              </Panel>
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
            <FarmButton label="RESTART" onPress={() => Alert.alert('Restart level?', 'Your progress in this level will be cleared.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Restart', style: 'destructive', onPress: () => { resetBoard(); setPaused(false); } }])} />
            <View style={{ height: 10 }} />
            <FarmButton label="HOW TO PLAY" onPress={() => { setPaused(false); router.push('/how-to-play'); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="SETTINGS" onPress={() => { setPaused(false); router.push('/settings'); }} />
            <View style={{ height: 10 }} />
            <FarmButton label="QUIT TO FARM" onPress={() => router.replace('/(tabs)/play')} />
          </Panel>
        </View>
      </Modal>

      <BumperCropModal
        visible={complete}
        levelId={endless ? endlessStage : levelId}
        stars={starResult.stars}
        payout={payout}
        harvestedCount={harvestedCount}
        wordsFound={foundWords.length}
        longest={longest}
        rewardDetail={`${firstClear ? `Words ${reward.wordCoins} · First clear ${reward.firstClearCoins} · Bonus ${reward.performanceCoins}` : `Replay word coins ${reward.wordCoins}`}${doubled ? ' · ×2' : ''}`}
        goals={source.starGoals.map(goal => ({ id: goal.id, label: goal.label, complete: starGoalComplete(goal, runStats) }))}
        showDouble={!store.save.adFree && !doubled}
        reducedMotion={store.save.settings.reducedMotion}
        onDouble={doubleReward}
        onContinue={finish}
        completionLabel={endless ? `Endless cob ${endlessStage} complete` : undefined}
      />

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
            {source.story?.speaker === 'Patch' ? <Image source={wordMaizeAssets.characters.patchPointing} style={styles.storyCharacter} /> : null}
            {source.story?.speaker === 'Farmer May' ? <Image source={wordMaizeAssets.characters.farmerMayWelcome} style={styles.storyCharacter} /> : null}
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
  safe: { flex: 1, alignItems: 'stretch', paddingHorizontal: 8, paddingBottom: 6 },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, zIndex: 8 },
  hudButton: { width: 46, height: 46, minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hudIcon: { width: 44, height: 44, borderRadius: 12, resizeMode: 'cover' },
  toolIcon: { width: 34, height: 34, resizeMode: 'contain' },
  toolCount: { position: 'absolute', right: -6, bottom: -8, color: '#ffffff', fontWeight: '900', fontSize: 11, backgroundColor: '#8a5a22', borderRadius: 8, paddingHorizontal: 5, overflow: 'hidden' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  energyChip: { minHeight: 44, minWidth: 52, borderRadius: 14, backgroundColor: '#38220f', borderWidth: 2, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 2 },
  energyIcon: { width: 22, height: 22, resizeMode: 'contain' },
  energyText: { color: '#fff6c6', fontWeight: '900', fontSize: 12 },
  sign: { flex: 1, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  level: { color: '#ffffff', fontWeight: '900', fontSize: 18, letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  objective: { color: '#fadd74', fontWeight: '700', fontSize: 10, marginTop: 1, textAlign: 'center' },
  wordRow: { alignItems: 'center', marginTop: 8, marginBottom: 4, minHeight: 44, zIndex: 6 },
  cob: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 240, zIndex: 11, overflow: 'visible' },
  dock: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, paddingHorizontal: 2, paddingTop: 6, zIndex: 10 },
  rotateHit: { width: 48, height: 48, minWidth: 44, minHeight: 44, borderRadius: 14, overflow: 'hidden' },
  rotateIcon: { width: 48, height: 48, resizeMode: 'cover' },
  rotateFlip: { transform: [{ scaleX: -1 }] },
  sessionCoins: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(47,33,16,0.9)', borderWidth: 2, borderColor: '#e5b72f', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, minHeight: 44 },
  coin: { width: 22, height: 22, resizeMode: 'contain' },
  sessionText: { color: '#fff6c6', fontWeight: '900', fontSize: 16, marginLeft: 4 },
  shuffle: { width: 48, height: 48, minWidth: 44, minHeight: 44, borderRadius: 24, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center' },
  shuffleOff: { opacity: 0.4 },
  shuffleIcon: { width: 48, height: 48, resizeMode: 'contain' },
  modalShade: { flex: 1, backgroundColor: 'rgba(10,25,18,0.85)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#5d8b31', textAlign: 'center', marginBottom: 12 },
  stats: { fontSize: 16, lineHeight: 25, textAlign: 'center', color: '#51351f', fontWeight: '700' },
  storySpeaker: { color: '#98702c', fontWeight: '900', fontSize: 12, letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
  storyCharacter: { width: 104, height: 126, resizeMode: 'contain', alignSelf: 'center', marginTop: -8, marginBottom: 4 },
  storyText: { color: '#51351f', fontWeight: '700', fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 12 },
  tutorialLine: { color: '#51351f', fontWeight: '700', fontSize: 14, lineHeight: 21, marginBottom: 5 },
  goalHeading: { color: '#5d8b31', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textAlign: 'center', marginTop: 8 },
});
