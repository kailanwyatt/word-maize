import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameplayStatusBar } from '../components/maze/GameplayStatusBar';
import { MazeScene } from '../components/maze/MazeScene';
import { FogOverlay } from '../components/maze/FogOverlay';
import { MazeChrome, mazeChromeArt, mazeFooterArt } from '../components/maze/MazeChrome';
import { MazeWeatherLayer } from '../components/maze/MazeWeatherLayer';
import { WordProgressPanel } from '../components/maze/WordProgressPanel';
import { playGameSound } from '../audio/sounds';
import { FarmDialog, DialogCopy } from '../components/FarmDialog';
import { MAZE_CAMPAIGN_TARGETS, MAZE_CHAPTER_META } from '../data/mazeCatalog';
import { mazePuzzleById, MAZE_PUZZLES } from '../data/mazeLevels';
import { TOOL_INFO } from '../data/shop';
import { mazeClearCoins } from '../game/economy';
import { nextMazeLevel } from '../game/mazeCampaign';
import {
  cobsInRange,
  createMazeRun,
  currentTarget,
  farmerFacesCob,
  harvestCob,
  MAZE_RENDER,
  MAZE_STICK_DEADZONE,
  mazeScore,
  mazeUnaided,
  needsSolvePhase,
  restoreMazeRun,
  revealIfActive,
  unusedBarnFinds,
  visibleLetterCobs,
  type MazeReveal,
  type MazeRun,
} from '../game/maze';
import { mazeFindsFor } from '../game/mazeFinds';
import { advanceMazePlay } from '../game/mazePlay';
import { applyMazeTool, barnChargesFor, mazeToolReason } from '../game/mazeTools';
import { nextStoryBeat } from '../game/mazeStory';
import { StoryBeatOverlay } from '../components/maze/StoryBeatOverlay';
import { MAZE_TOOL_IDS } from '../game/types';
import { parseMazeVisibility } from '../game/mazeVisibility';
import { beginMazeRun, findNextLetterHelp, remindInspectedLetter, revealMazeAnswer, solvePromptSlots, submitMazeSolve } from '../game/mazeSolve';
import { canEarnStormRibbon, continueStormUntimed, stormPhase, stormRemainingMs } from '../game/mazeStorm';
import { clearWildlife, wildlifeActionLabel, wildlifeHoldMs, wildlifeInRange } from '../game/mazeWildlife';
import { useGameStore } from '../store/GameStore';

const TILE = MAZE_RENDER.tile;

export function MazeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id, free, fx } = useLocalSearchParams<{ id?: string; free?: string; fx?: string }>();
  const store = useGameStore();
  const campaign = free !== '1';
  const puzzle = mazePuzzleById(Array.isArray(id) ? id[0] : id ?? 'sunny-acres-corn');
  const saved = campaign ? store.save.maze.runs[puzzle.id] : (store.save.maze.freePlay?.puzzleId === puzzle.id ? store.save.maze.freePlay.run : undefined);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const [run, setRun] = useState<MazeRun>(() => restoreMazeRun(puzzle, saved));
  const [reveal, setReveal] = useState<MazeReveal | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [guess, setGuess] = useState('');
  const [solveError, setSolveError] = useState('');
  const [scorecard, setScorecard] = useState<{ letters: number; bonus: number; total: number; coins: number } | null>(
    run.completed ? { ...mazeScore(puzzle, run, true), coins: 0 } : null,
  );
  const [rejectShake, setRejectShake] = useState({ id: '', nonce: 0 });
  const [barnOpen, setBarnOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [storyLine, setStoryLine] = useState(0);
  const stick = useRef({ x: 0, y: 0 });
  const runRef = useRef(run);
  const puzzleRef = useRef(puzzle);
  const storeRef = useRef(store);
  const pausedRef = useRef(paused);
  const scorecardRef = useRef(scorecard);
  const appActiveRef = useRef(true);
  const rewardedRef = useRef(false);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  runRef.current = run;
  puzzleRef.current = puzzle;
  storeRef.current = store;
  pausedRef.current = paused || mapOpen || barnOpen;
  scorecardRef.current = scorecard;

  useEffect(() => {
    const next = restoreMazeRun(puzzle, saved);
    const campaignRun = { ...next, campaign };
    runRef.current = campaignRun;
    setRun(campaignRun);
    setReveal(null);
    setSelectedId(null);
    setGuess('');
    setSolveError('');
    setScorecard(campaignRun.completed ? { ...mazeScore(puzzle, campaignRun, true), coins: 0 } : null);
    rewardedRef.current = campaign && store.save.maze.rewardedIds.includes(puzzle.id);
    setStoryLine(0);
    setBarnOpen(false);
    setToast('');
  }, [puzzle.id, campaign]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  useFocusEffect(useCallback(() => () => {
    storeRef.current.saveMazeRun(runRef.current);
  }, []));

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      appActiveRef.current = state === 'active';
      if (state !== 'active') storeRef.current.saveMazeRun(runRef.current);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let last = performance.now();
    let lastPaint = 0;
    const tick = (now: number) => {
      if (cancelled) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const playing = appActiveRef.current && !pausedRef.current && !runRef.current.completed && !scorecardRef.current;
      if (playing) {
        const picked = new Set(runRef.current.pickedFindIds);
        const next = advanceMazePlay(puzzleRef.current, runRef.current, stick.current.x, stick.current.y, dt);
        const freshId = next.pickedFindIds.find(id => !picked.has(id));
        if (freshId) {
          const find = mazeFindsFor(puzzleRef.current).find(item => item.id === freshId);
          if (find) setToast(`${TOOL_INFO[find.tool].title} stowed in the Barn.`);
        }
        runRef.current = next;
        if (now - lastPaint > 16) {
          lastPaint = now;
          setRun(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const persist = setInterval(() => storeRef.current.saveMazeRun(runRef.current), 2000);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearInterval(persist);
    };
  }, []);

  const revealedCobs = useMemo(() => visibleLetterCobs(puzzle, run), [puzzle, run]);
  const activeReveal = revealIfActive(reveal, run.elapsedActiveMs);
  const selected = revealedCobs.find(cob => cob.id === selectedId) ?? (revealedCobs.length === 1 ? revealedCobs[0] : undefined);
  const target = currentTarget(puzzle, run);
  const waiting = !run.started || !run.solved;
  const revealedIds = [...revealedCobs.map(cob => cob.id), ...(activeReveal ? [activeReveal.cobId] : [])];
  const canHarvest = !!(selected && selected.letter === target && !waiting && revealedIds.includes(selected.id));
  const barnCount = MAZE_TOOL_IDS.reduce((sum, tool) => sum + barnChargesFor(run, store.save.inventory, tool), 0);
  const livePhase = stormPhase(puzzle, run);
  const previewFx = __DEV__ ? (Array.isArray(fx) ? fx[0] : fx) : undefined;
  const phase = previewFx === 'rain' ? 'rain' : livePhase;
  const slots = solvePromptSlots(puzzle.displayAnswer ?? puzzle.answer, puzzle.givenMask ?? null, run.solved, run.nextAnswerIndex);
  const animalReady = wildlifeInRange(puzzle, run);

  const commit = (next: MazeRun, nextReveal: MazeReveal | null = reveal) => {
    runRef.current = next;
    setRun(next);
    setReveal(nextReveal);
  };

  const harvest = () => {
    if (waiting || runRef.current.completed) return;
    const faced = selected ?? cobsInRange(puzzle, runRef.current).find(cob => farmerFacesCob(runRef.current, cob));
    const reject = (cobId?: string) => {
      if (cobId) setRejectShake(prev => ({ id: cobId, nonce: prev.nonce + 1 }));
      playGameSound('invalid', 0.62);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    if (!selected) {
      reject(faced?.id);
      return;
    }
    const result = harvestCob(puzzle, runRef.current, selected.id, null);
    if (!result.ok) {
      reject(selected.id);
      return;
    }
    commit(result.run, null);
    playGameSound(result.completedNow ? 'complete' : 'basket', 0.78);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.saveMazeRun(result.run);
    if (result.completedNow && campaign && !rewardedRef.current) {
      rewardedRef.current = true;
      const already = store.save.maze.rewardedIds.includes(puzzle.id);
      const score = mazeScore(puzzle, result.run, already);
      const storm = canEarnStormRibbon(puzzle, result.run) && !!puzzle.stormSeconds;
      const coins = already ? 0 : mazeClearCoins(puzzle.chapter, storm);
      if (!already) {
        store.markMazeRewarded(puzzle.id, {
          unaided: mazeUnaided(result.run),
          storm,
          coins,
          tools: unusedBarnFinds(result.run),
        });
      }
      setScorecard({ ...score, coins });
    } else if (result.completedNow && !campaign) {
      setScorecard({ ...mazeScore(puzzle, result.run, true), coins: 0 });
    }
  };

  const useBarnTool = (tool: typeof MAZE_TOOL_IDS[number]) => {
    if (waiting || runRef.current.completed) return;
    const result = applyMazeTool(puzzle, runRef.current, tool, store.save.inventory);
    if (!result.ok) {
      setToast(result.reason);
      playGameSound('invalid', 0.62);
      return;
    }
    if (result.consumeInventory && !store.consumeTool(tool)) {
      playGameSound('invalid', 0.62);
      return;
    }
    commit(result.run);
    setToast(result.toast);
    setBarnOpen(false);
    playGameSound('tool', 0.78);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const harvestRef = useRef(harvest);
  harvestRef.current = harvest;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const typing = (target: EventTarget | null) => {
      const el = target as { tagName?: string; isContentEditable?: boolean } | null;
      return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || !!el?.isContentEditable;
    };
    const onDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.repeat || typing(event.target) || pausedRef.current || scorecardRef.current || runRef.current.completed) return;
      event.preventDefault();
      harvestRef.current();
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, []);

  const restart = () => {
    const fresh = createMazeRun(puzzle, campaign);
    commit(fresh, null);
    rewardedRef.current = campaign && store.save.maze.rewardedIds.includes(puzzle.id);
    setSelectedId(null);
    setScorecard(null);
    setPaused(false);
    setGuess('');
    setSolveError('');
    store.saveMazeRun(fresh);
  };

  const solve = () => {
    const result = submitMazeSolve(puzzle, runRef.current, guess);
    if (!result.ok) {
      setSolveError('Not quite. Try again, or reveal the answer.');
      return;
    }
    commit(result.run, null);
    setSolveError('');
    playGameSound('tap', 0.7);
  };

  const startShown = () => commit(beginMazeRun(runRef.current), null);

  const helpNext = () => {
    const result = findNextLetterHelp(puzzle, runRef.current);
    if (!result.ok) return;
    commit(result.run, reveal);
    setPaused(false);
  };

  const helpRemind = () => {
    const cobId = selected?.id ?? run.inspectedCobIds.find(id => !run.harvestedCobIds.includes(id));
    if (!cobId) return;
    const result = remindInspectedLetter(puzzle, runRef.current, cobId);
    if (!result.ok) return;
    commit(result.run, result.reveal);
    setPaused(false);
  };

  const fieldW = Math.max(1, fieldSize.width);
  const fieldH = Math.max(1, fieldSize.height);
  const worldW = puzzle.cols * TILE;
  const worldH = puzzle.rows * TILE;
  const overlayTop = insets.top + 8;
  const overlayBottom = Math.max(insets.bottom, 10);
  const originX = worldW <= fieldW
    ? (fieldW - worldW) / 2
    : Math.min(0, Math.max(fieldW - worldW, fieldW / 2 - run.player.x * TILE));
  const originY = worldH <= fieldH
    ? (fieldH - worldH) / 2
    : Math.min(0, Math.max(fieldH - worldH, fieldH / 2 - run.player.y * TILE));
  const nextLevel = nextMazeLevel(MAZE_PUZZLES, [...store.save.maze.rewardedIds, puzzle.id], store.save.maze.unlockedIds);
  const chapterDone = campaign && (nextLevel.id === puzzle.id || nextLevel.chapter !== puzzle.chapter);
  const catalog = MAZE_CAMPAIGN_TARGETS.find(item => item.id === puzzle.id);
  const storyBeat = nextStoryBeat({
    campaign,
    skipStory: store.save.settings.skipStory,
    seen: store.save.seenStoryBeatIds,
    puzzleId: puzzle.id,
    chapter: puzzle.chapter,
    chapterLevel: catalog?.chapterLevel ?? 1,
    started: run.started,
    solved: run.solved,
    needsClue: needsSolvePhase(puzzle),
    mist: parseMazeVisibility(puzzle.visibility).mode === 'mist',
    storm: !!puzzle.stormSeconds,
    wildlife: !!run.wildlife,
    completed: !!scorecard && run.completed,
    chapterDone,
    finale: puzzle.id === MAZE_PUZZLES[MAZE_PUZZLES.length - 1]?.id,
  });
  pausedRef.current = paused || mapOpen || barnOpen || !!storyBeat;
  const sight = parseMazeVisibility(puzzle.visibility);
  const fogActive = sight.mode === 'mist';
  const foggy = fogActive || sight.mode === 'evening' || (sight.mode === 'storm' && !!sight.radius);
  const stormFx = phase === 'overcast' || phase === 'dark' || phase === 'rain' || phase === 'grace' || phase === 'expired' || phase === 'untimed';
  const chrome = mazeChromeArt(sight.mode, stormFx);
  const footerArt = mazeFooterArt(sight.mode, stormFx);
  const mood = stormFx && (phase === 'dark' || phase === 'rain' || phase === 'grace' || phase === 'expired') ? 'fog' : 'sunny';
  const timedStorm = !!(puzzle.stormSeconds && !run.stormUntimed);
  const harvestLetters = puzzle.answer.replace(/[^A-Z]/g, '').length;
  const chapterName = MAZE_CHAPTER_META.find(item => item.id === puzzle.chapter)?.title ?? puzzle.title;

  return (
    <View style={[styles.shell, { backgroundColor: mood === 'fog' ? '#243628' : '#3f6f2c' }]}>
      <MazeChrome source={chrome} style={[styles.topChrome, { paddingTop: overlayTop }]}>
        <View style={styles.hud}>
          <HudIconButton label="Pause" onPress={() => setPaused(true)}>
            <PauseBars />
          </HudIconButton>
          <WordProgressPanel
            title={puzzle.displayAnswer ?? puzzle.answer}
            slots={slots}
            target={run.solved && !run.completed ? target : ''}
            complete={run.completed}
            compact={windowHeight < 720}
          />
          <HudIconButton label="Field map" onPress={() => setMapOpen(true)}>
            <MapFold />
          </HudIconButton>
        </View>
        <View style={styles.statusWrap}>
          <GameplayStatusBar
            timeValue={formatMazeTime(timedStorm ? stormRemainingMs(puzzle, run) : run.elapsedActiveMs)}
            timeCaption={timedStorm ? 'TIME REMAINING' : 'TIME'}
            harvested={run.harvestedCobIds.length}
            total={harvestLetters}
            fogActive={fogActive}
            chapterName={chapterName}
            chapterNumber={puzzle.chapter}
          />
        </View>
        {run.wildlife ? <Text style={styles.warn}>{run.wildlife.kind.toUpperCase()} {run.wildlife.phase === 'warning' ? 'incoming' : 'blocking a plant'}</Text> : null}
      </MazeChrome>
      <View
        collapsable={false}
        onLayout={event => {
          const next = event.nativeEvent.layout;
          setFieldSize(prev => (prev.width === next.width && prev.height === next.height ? prev : { width: next.width, height: next.height }));
        }}
        style={styles.viewport}
      >
        <MazeScene
          puzzle={puzzle} run={run} selectedId={selected?.id} revealedIds={revealedIds}
          originX={originX} originY={originY} viewportWidth={fieldW} viewportHeight={fieldH}
          moving={!waiting && !paused && !run.completed && Math.hypot(stick.current.x, stick.current.y) > MAZE_STICK_DEADZONE}
          reducedMotion={store.save.settings.reducedMotion}
          reducedMist={store.save.settings.reducedMotion}
          shakeCobId={rejectShake.id}
          shakeNonce={rejectShake.nonce}
          mood={mood}
        />
        <FogOverlay
          enabled={foggy}
          playerX={originX + run.player.x * TILE}
          playerY={originY + run.player.y * TILE}
          sight={sight}
          phase={phase}
          viewportWidth={fieldW}
          viewportHeight={fieldH}
          paused={paused || mapOpen || waiting || !!scorecard}
          reducedMotion={store.save.settings.reducedMotion}
          lantern={run.lanternActive}
          bottomInset={0}
        />
        {stormFx ? (
          <MazeWeatherLayer
            phase={phase}
            sight={sight}
            farmerX={originX + run.player.x * TILE}
            farmerY={originY + run.player.y * TILE}
            paused={paused || mapOpen || waiting || !!scorecard}
            reducedMotion={store.save.settings.reducedMotion}
            width={fieldW}
            height={fieldH}
          />
        ) : null}
        {toast ? <Pressable onPress={() => setToast('')} style={styles.toast}><Text style={styles.toastText}>{toast}</Text></Pressable> : null}
      </View>
      <MazeChrome source={footerArt} tone="footer" style={[styles.footer, { paddingBottom: overlayBottom }]}>
        <View style={styles.controls}>
          <Joystick onVector={(x, y) => { stick.current = { x, y }; }} />
          <View style={styles.actions}>
            {revealedCobs.length > 1 ? (
              <View style={styles.picker}>
                {revealedCobs.map((cob, index) => (
                  <Pressable key={cob.id} onPress={() => setSelectedId(cob.id)} style={[styles.pick, selected?.id === cob.id && styles.pickOn]}>
                    <Text style={styles.pickText}>PLANT {index + 1}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {run.wildlife && animalReady ? (
              <Pressable
                accessibilityRole="button"
                onPressIn={() => {
                  if (store.save.settings.reducedMotion) {
                    commit(clearWildlife(runRef.current), reveal);
                    return;
                  }
                  holdRef.current = setTimeout(() => {
                    commit(clearWildlife(runRef.current), reveal);
                    playGameSound('tap', 0.7);
                  }, wildlifeHoldMs(run.wildlife!.kind));
                }}
                onPressOut={() => { if (holdRef.current) clearTimeout(holdRef.current); }}
                style={styles.action}
              >
                <Text style={styles.actionText}>{wildlifeActionLabel(run.wildlife.kind)}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Barn, ${barnCount} helpers`}
              disabled={waiting || run.completed}
              onPress={() => setBarnOpen(true)}
              style={styles.mowCircle}
            >
              {({ pressed }) => (
                <View style={[styles.mowFace, pressed && styles.mowPressed]}>
                  <Text style={styles.mowText}>BARN</Text>
                  <Text style={styles.barnCount}>×{barnCount}</Text>
                </View>
              )}
            </Pressable>
            <HarvestButton
              enabled={canHarvest}
              disabled={waiting || run.completed}
              reducedMotion={store.save.settings.reducedMotion}
              onPress={harvest}
            />
          </View>
        </View>
      </MazeChrome>

      <FarmDialog
        visible={waiting && !run.completed && !storyBeat}
        title={puzzle.title}
        onClose={() => { store.saveMazeRun(runRef.current); router.back(); }}
        primary={!run.solved ? { label: 'SUBMIT', onPress: solve } : { label: 'START HARVEST', onPress: startShown }}
        actions={!run.solved ? [{ label: 'REVEAL ANSWER', onPress: () => commit(revealMazeAnswer(puzzle, runRef.current), null), tone: 'slate' }] : undefined}
      >
        <DialogCopy>{puzzle.clue}</DialogCopy>
        <DialogCopy>{MAZE_PUZZLES.find(level => level.id === puzzle.id)?.objective ?? ''}</DialogCopy>
        <View style={styles.slots}>{slots.map((slot, index) => slot.space ? <View key={index} style={styles.slotSpace} /> : <View key={index} style={[styles.slot, slot.given && styles.slotGiven]}><Text style={styles.slotLetter}>{slot.filled ? slot.ch : ''}</Text></View>)}</View>
        {!run.solved ? (
          <>
            <TextInput accessibilityLabel="Answer guess" autoCapitalize="characters" autoCorrect={false} value={guess} onChangeText={setGuess} style={styles.input} placeholder="TYPE THE WORD" placeholderTextColor="#8a7350" />
            {solveError ? <DialogCopy>{solveError}</DialogCopy> : null}
          </>
        ) : null}
      </FarmDialog>

      <FarmDialog
        visible={paused}
        title="Paused"
        onClose={() => setPaused(false)}
        primary={{ label: 'RESUME', onPress: () => setPaused(false) }}
        actions={[
          ...(run.solved ? [
            { label: 'FIND NEXT LETTER', onPress: helpNext, tone: 'slate' as const },
            { label: 'REMIND A VISIT', onPress: helpRemind, tone: 'slate' as const },
          ] : []),
          { label: 'RESTART MAZE', onPress: restart, tone: 'slate' as const },
          { label: 'LEAVE', onPress: () => { store.saveMazeRun(runRef.current); router.back(); }, tone: 'slate' as const },
        ]}
      >
        <DialogCopy>Face a plant to peek its letter. Weather waits until you return.</DialogCopy>
      </FarmDialog>

      <FarmDialog visible={mapOpen} title="Field map" onClose={() => setMapOpen(false)} primary={{ label: 'CLOSE', onPress: () => setMapOpen(false), tone: 'slate' }}>
        <DialogCopy>Explored paths only. Letters stay hidden.</DialogCopy>
        <View style={styles.mini}>
          {puzzle.terrain.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.miniRow}>
              {row.map((cell, col) => {
                const explored = run.exploredKeys.includes(`${col},${rowIndex}`);
                const here = Math.floor(run.player.x) === col && Math.floor(run.player.y) === rowIndex;
                const walk = cell === 'path' || run.mowedKeys.includes(`${col},${rowIndex}`);
                return <View key={col} style={[styles.miniCell, cell === 'wall' && !walk && styles.miniWall, explored && walk && styles.miniPath, here && styles.miniHere]} />;
              })}
            </View>
          ))}
        </View>
      </FarmDialog>

      <FarmDialog
        visible={run.stormExpired && !run.completed}
        title="Take shelter"
        primary={{ label: 'CONTINUE UNTIMED', onPress: () => commit(continueStormUntimed(runRef.current), reveal) }}
        actions={[{ label: 'RETRY', onPress: restart, tone: 'slate' }]}
      >
        <DialogCopy>The forecast closed. Retry this field, or keep harvesting untimed. Untimed play still unlocks, but cannot earn the storm ribbon.</DialogCopy>
      </FarmDialog>

      <FarmDialog
        visible={!!scorecard}
        title={chapterDone ? 'Chapter harvested!' : campaign ? 'Bumper crop!' : 'Free Play finish'}
        primary={{ label: campaign ? (chapterDone ? 'CHAPTER MAP' : 'NEXT LEVEL') : 'FREE PLAY', onPress: () => router.replace(campaign ? (chapterDone ? '/maze' : `/maze/${nextLevel.id}`) : '/maze/free') }}
        actions={[
          { label: 'PLAY AGAIN', onPress: restart, tone: 'slate' },
          { label: 'WORLD MAP', onPress: () => router.replace('/maze'), tone: 'slate' },
        ]}
      >
        <DialogCopy>{(puzzle.displayAnswer ?? puzzle.answer)} is in the basket.</DialogCopy>
        <Text style={styles.score}>{scorecard?.total} POINTS</Text>
        <DialogCopy>{scorecard?.letters} from letters{scorecard?.bonus ? ` · ${scorecard.bonus} first harvest` : ' · bonus already claimed'}</DialogCopy>
        {campaign ? <DialogCopy>{scorecard?.coins ? `${scorecard.coins} coins added to the farm.` : 'Coins already claimed for this field.'}</DialogCopy> : null}
        <DialogCopy>Time {formatMazeTime(run.elapsedActiveMs)}</DialogCopy>
        {campaign ? <DialogCopy>{mazeUnaided(run) ? 'Unaided ribbon earned.' : 'Assists were used.'}{puzzle.stormSeconds ? (canEarnStormRibbon(puzzle, run) ? ' Storm ribbon earned.' : ' Storm ribbon not earned.') : ''}</DialogCopy> : null}
      </FarmDialog>

      <FarmDialog
        visible={barnOpen}
        title="Barn"
        onClose={() => setBarnOpen(false)}
        primary={{ label: 'FARM STORE', onPress: () => { setBarnOpen(false); router.push('/(tabs)/shop'); }, tone: 'gold' }}
        actions={[{ label: 'CLOSE', onPress: () => setBarnOpen(false), tone: 'slate' }]}
      >
        {barnCount < 1 ? <DialogCopy>The Barn is empty. Stock it at the Farm Store, or look for crates in the rows.</DialogCopy> : (
          MAZE_TOOL_IDS.map(tool => {
            const count = barnChargesFor(run, store.save.inventory, tool);
            const reason = mazeToolReason(puzzle, run, tool);
            return (
              <Pressable key={tool} disabled={count < 1 || !!reason} onPress={() => useBarnTool(tool)} style={[styles.barnRow, (count < 1 || reason) && styles.barnDim]}>
                <Text style={styles.barnTitle}>{TOOL_INFO[tool].title} ×{count}</Text>
                <Text style={styles.barnBlurb}>{reason ?? TOOL_INFO[tool].blurb}</Text>
              </Pressable>
            );
          })
        )}
      </FarmDialog>

      {storyBeat ? (
        <StoryBeatOverlay
          beat={storyBeat}
          lineIndex={storyLine}
          onAdvance={() => {
            if (storyLine + 1 < storyBeat.lines.length) setStoryLine(storyLine + 1);
            else {
              store.markStoryBeatSeen(storyBeat.id);
              setStoryLine(0);
            }
          }}
          onSkip={() => { store.markStoryBeatSeen(storyBeat.id); setStoryLine(0); }}
        />
      ) : null}
    </View>
  );
}

function Joystick({ onVector }: { onVector: (x: number, y: number) => void }) {
  const vector = useRef(onVector);
  vector.current = onVector;
  const knobX = useSharedValue(0);
  const knobY = useSharedValue(0);

  const send = useCallback((x: number, y: number) => {
    vector.current(x, y);
  }, []);

  const gesture = useMemo(() => (
    Gesture.Pan()
      .minDistance(0)
      .maxPointers(1)
      .shouldCancelWhenOutside(false)
      .onUpdate(event => {
        'worklet';
        const max = 38;
        const length = Math.hypot(event.translationX, event.translationY) || 1;
        const scale = Math.min(1, max / length);
        const x = (event.translationX * scale) / max;
        const y = (event.translationY * scale) / max;
        knobX.value = x * max;
        knobY.value = y * max;
        if (Math.hypot(x, y) < 0.16) {
          runOnJS(send)(0, 0);
          return;
        }
        runOnJS(send)(x, y);
      })
      .onEnd(() => {
        'worklet';
        knobX.value = 0;
        knobY.value = 0;
        runOnJS(send)(0, 0);
      })
      .onFinalize(() => {
        'worklet';
        knobX.value = 0;
        knobY.value = 0;
        runOnJS(send)(0, 0);
      })
  ), [knobX, knobY, send]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }, { translateY: knobY.value }],
  }));

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const held = new Set<string>();
    const keys = new Set(['arrowright', 'arrowleft', 'arrowdown', 'arrowup', 'w', 'a', 's', 'd']);
    const apply = () => {
      const x = (held.has('arrowright') || held.has('d') ? 1 : 0) - (held.has('arrowleft') || held.has('a') ? 1 : 0);
      const y = (held.has('arrowdown') || held.has('s') ? 1 : 0) - (held.has('arrowup') || held.has('w') ? 1 : 0);
      if (x === 0 && y === 0) {
        knobX.value = 0;
        knobY.value = 0;
        send(0, 0);
        return;
      }
      const length = Math.hypot(x, y);
      const nx = x / length;
      const ny = y / length;
      knobX.value = nx * 38;
      knobY.value = ny * 38;
      send(nx, ny);
    };
    const typing = (target: EventTarget | null) => {
      const el = target as { tagName?: string; isContentEditable?: boolean } | null;
      return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || !!el?.isContentEditable;
    };
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!keys.has(key) || typing(event.target)) return;
      event.preventDefault();
      held.add(key);
      apply();
    };
    const onUp = (event: KeyboardEvent) => {
      held.delete(event.key.toLowerCase());
      apply();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [knobX, knobY, send]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.stick} accessibilityLabel="Move joystick">
        <View style={[styles.stickTick, styles.stickTickN]} />
        <View style={[styles.stickTick, styles.stickTickE]} />
        <View style={[styles.stickTick, styles.stickTickS]} />
        <View style={[styles.stickTick, styles.stickTickW]} />
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
    </GestureDetector>
  );
}

function HarvestButton({ enabled, disabled, reducedMotion, onPress }: { enabled: boolean; disabled: boolean; reducedMotion: boolean; onPress: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!enabled || reducedMotion) {
      pulse.value = withTiming(1, { duration: 120 });
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1.06, { duration: 520, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) })), -1, true);
  }, [enabled, pulse, reducedMotion]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Harvest"
        disabled={disabled}
        onPress={onPress}
        style={[styles.harvestCircle, enabled && styles.harvestReady, !enabled && styles.actionDim]}
      >
        {({ pressed }) => (
          <View style={[styles.harvestFace, pressed && styles.harvestPressed]}>
            <Text style={styles.harvestText}>HARVEST</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function HudIconButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.hudBtn}>
      {({ pressed }) => (
        <View style={styles.hudBtnLip}>
          <View style={[styles.hudBtnFace, pressed && styles.hudBtnPressed]}>{children}</View>
        </View>
      )}
    </Pressable>
  );
}

function PauseBars() {
  return (
    <View style={styles.pauseRow}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  );
}

function MapFold() {
  return (
    <View style={styles.mapIcon}>
      <View style={styles.mapPanel} />
      <View style={[styles.mapPanel, styles.mapPanelMid]} />
      <View style={[styles.mapPanel, styles.mapPanelEnd]} />
    </View>
  );
}

function formatMazeTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  shell: { flex: 1, overflow: 'hidden', touchAction: 'none' },
  topChrome: { zIndex: 2, paddingBottom: 10 },
  footer: { zIndex: 3, paddingTop: 10 },
  viewport: { flex: 1, position: 'relative', overflow: 'hidden' },
  hud: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
  hudBtn: { width: 46, height: 48 },
  hudBtnLip: { width: 46, height: 48, borderRadius: 14, backgroundColor: '#5a3210', borderWidth: 2, borderColor: '#8a5a18' },
  hudBtnFace: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#3b2410',
    borderWidth: 2,
    borderColor: '#d7ad4b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudBtnPressed: { top: 4, height: 42 },
  pauseRow: { flexDirection: 'row', gap: 5 },
  pauseBar: { width: 5, height: 16, borderRadius: 2, backgroundColor: '#fff6c6' },
  mapIcon: { width: 22, height: 16, flexDirection: 'row' },
  mapPanel: { width: 8, height: 16, backgroundColor: '#ead9a7', borderWidth: 1, borderColor: '#8a5a18', transform: [{ skewY: '-8deg' }] },
  mapPanelMid: { backgroundColor: '#f4e2b0', transform: [{ skewY: '8deg' }], marginHorizontal: -1 },
  mapPanelEnd: { backgroundColor: '#d7c08a', transform: [{ skewY: '-8deg' }] },
  statusWrap: { paddingLeft: 10, paddingRight: 10, marginTop: 6 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: 'center' },
  slot: { width: 22, height: 26, borderRadius: 6, backgroundColor: '#fff1bd', borderWidth: 2, borderColor: '#c78a32', alignItems: 'center', justifyContent: 'center' },
  slotGiven: { backgroundColor: '#d7f59a' },
  slotSpace: { width: 10, height: 26 },
  slotLetter: { color: '#4f7f26', fontWeight: '900', fontSize: 14 },
  warn: { textAlign: 'center', color: '#fff1bd', fontWeight: '900', fontSize: 11, marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 128, gap: 12 },
  stick: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(28,16,8,0.72)', borderWidth: 3, borderColor: '#d7ad4b', alignItems: 'center', justifyContent: 'center', touchAction: 'none' },
  stickTick: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#ead9a7' },
  stickTickN: { top: 10 },
  stickTickE: { right: 10 },
  stickTickS: { bottom: 10 },
  stickTickW: { left: 10 },
  knob: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f4e2b0', borderWidth: 3, borderColor: '#c48a32' },
  actions: { flex: 1, gap: 8, alignItems: 'flex-end' },
  picker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  pick: { backgroundColor: 'rgba(59,36,16,0.88)', borderWidth: 2, borderColor: '#8a7350', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  pickOn: { borderColor: '#fff6c6' },
  pickText: { color: '#fff6c6', fontWeight: '900', fontSize: 10 },
  action: { minWidth: 132, minHeight: 46, borderRadius: 14, backgroundColor: '#5cae31', borderWidth: 2, borderColor: '#b9e875', alignItems: 'center', justifyContent: 'center' },
  harvestCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#8a4f12',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  harvestReady: { backgroundColor: '#a45c10' },
  harvestFace: {
    width: 108,
    height: 100,
    borderRadius: 54,
    backgroundColor: '#d48a22',
    borderWidth: 3,
    borderColor: '#f0c56a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  harvestPressed: { height: 104, marginTop: 4 },
  harvestText: { color: '#fff6c6', fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  mowCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b2410',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  mowFace: {
    width: 64,
    height: 58,
    borderRadius: 32,
    backgroundColor: '#5a7428',
    borderWidth: 2,
    borderColor: '#b7cc6a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mowPressed: { height: 60, marginTop: 4 },
  mowText: { color: '#fff6c6', fontWeight: '900', fontSize: 10, letterSpacing: 0.4 },
  actionDim: { opacity: 0.42 },
  actionText: { color: 'white', fontWeight: '900', fontSize: 16 },
  score: { fontSize: 28, fontWeight: '900', color: '#c78a32', textAlign: 'center', marginVertical: 8 },
  input: { marginVertical: 10, borderWidth: 2, borderColor: '#c78a32', borderRadius: 10, backgroundColor: '#fff8dc', paddingHorizontal: 10, paddingVertical: 8, fontWeight: '900', color: '#3b2410', textAlign: 'center' },
  mini: { alignSelf: 'center', marginVertical: 10, backgroundColor: '#1d3f18', padding: 4, borderRadius: 8 },
  miniRow: { flexDirection: 'row' },
  miniCell: { width: 6, height: 6, backgroundColor: '#16381e' },
  miniWall: { backgroundColor: '#1a4a16' },
  miniPath: { backgroundColor: '#d7c08a' },
  miniHere: { backgroundColor: '#7ee04a' },
  barnCount: { color: '#ffe08a', fontWeight: '900', fontSize: 9, marginTop: 1 },
  barnRow: { backgroundColor: '#fff1bd', borderWidth: 2, borderColor: '#c78a32', borderRadius: 12, padding: 10, marginBottom: 8 },
  barnDim: { opacity: 0.45 },
  barnTitle: { color: '#4f7f26', fontWeight: '900', fontSize: 15 },
  barnBlurb: { color: '#6a4522', fontWeight: '700', fontSize: 12, marginTop: 2 },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 12, zIndex: 12, backgroundColor: 'rgba(40,24,10,0.92)', borderRadius: 12, borderWidth: 2, borderColor: '#c78a32', padding: 10 },
  toastText: { color: '#fff6c6', fontWeight: '800', textAlign: 'center' },
});
