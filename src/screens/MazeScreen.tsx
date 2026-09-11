import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Image, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameplayStatusBar } from '../components/maze/GameplayStatusBar';
import { MazeScene } from '../components/maze/MazeScene';
import { MazeFarmerPicker } from '../components/maze/MazeFarmerPicker';
import { FogOverlay } from '../components/maze/FogOverlay';
import { MazeChrome } from '../components/maze/MazeChrome';
import { FieldBarnDialog, type FieldBarnRestock } from '../components/maze/FieldBarnDialog';
import { MazeToolBelt } from '../components/maze/MazeToolBelt';
import { type MazeToolFx } from '../components/maze/MazeToolFx';
import { MazePest } from '../components/maze/MazePest';
import { MazeWeatherLayer } from '../components/maze/MazeWeatherLayer';
import { WordProgressPanel } from '../components/maze/WordProgressPanel';
import { playGameSound } from '../audio/sounds';
import { FarmDialog, DialogCopy } from '../components/FarmDialog';
import { ModeHelpDialog } from '../components/ModeHelpDialog';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { MAZE_CAMPAIGN_TARGETS } from '../data/mazeCatalog';
import { mazePuzzleById, MAZE_PUZZLES } from '../data/mazeLevels';
import { TOOL_INFO, TOOL_PRIMER_HOW_TO, TOOL_PRIMER_IDS } from '../data/shop';
import { mazeClearCoins } from '../game/economy';
import { nextMazeLevel } from '../game/mazeCampaign';
import { applyFreePlayPrefs } from '../game/mazeFreePlay';
import {
  cobsInRange,
  createMazeRun,
  currentTarget,
  farmerFacesCob,
  harvestCob,
  harvestReadyCobs,
  inspectCob,
  liveCobs,
  MAZE_RENDER,
  MAZE_STICK_DEADZONE,
  mazeRevealedIds,
  mazeScore,
  mazeUnaided,
  nearbyLetterCobs,
  needsSolvePhase,
  restoreMazeRun,
  unusedBarnFinds,
  type MazeReveal,
  type MazeRun,
} from '../game/maze';
import { mazeFindsFor } from '../game/mazeFinds';
import { bestMazeScore, formatMazeScoreTime, type MazeFieldScore } from '../game/mazeScores';
import { advanceMazePlay } from '../game/mazePlay';
import { fieldDoubleTap, fieldPointerRelease, fieldWalkStick } from '../game/gestures';
import { nextStoryBeat } from '../game/mazeStory';
import { applyMazeTool, barnChargesFor } from '../game/mazeTools';
import { StoryBeatOverlay } from '../components/maze/StoryBeatOverlay';
import { parseMazeVisibility, lanternCountFor } from '../game/mazeVisibility';
import { beginMazeRun, findNextLetterHelp, remindInspectedLetter, revealMazeAnswer, solvePromptSlots, submitMazeSolve } from '../game/mazeSolve';
import { canEarnStormRibbon, continueStormUntimed, stormPhase, stormRemainingMs } from '../game/mazeStorm';
import { clearWildlife, wildlifeActionLabel, wildlifeHoldMs, wildlifeInRange } from '../game/mazeWildlife';
import { MAZE_TOOL_IDS, type ToolId } from '../game/types';
import { useMessages } from '../i18n';
import { useGameStore } from '../store/GameStore';

const TILE = MAZE_RENDER.tile;

export function MazeScreen() {
  const router = useRouter();
  const t = useMessages();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { id, free, fx } = useLocalSearchParams<{ id?: string; free?: string; fx?: string }>();
  const store = useGameStore();
  const catalogId = Array.isArray(id) ? id[0] : id ?? 'sunny-acres-corn';
  const campaign = free !== '1';
  const puzzle = useMemo(() => {
    const catalog = mazePuzzleById(catalogId);
    if (campaign) return catalog;
    const savedFree = store.save.maze.freePlay;
    const prefs = savedFree?.puzzleId === catalog.id && savedFree.prefs
      ? savedFree.prefs
      : store.save.settings.freePlay;
    return applyFreePlayPrefs(catalog, prefs);
  }, [campaign, catalogId]);
  const saved = campaign ? store.save.maze.runs[puzzle.id] : (store.save.maze.freePlay?.puzzleId === puzzle.id ? store.save.maze.freePlay.run : undefined);
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const [chromeH, setChromeH] = useState({ top: 118, bottom: 88 });
  const [run, setRun] = useState<MazeRun>(() => restoreMazeRun(puzzle, saved));
  const [reveal, setReveal] = useState<MazeReveal | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [barnRestock, setBarnRestock] = useState<FieldBarnRestock | null>(null);
  const [guess, setGuess] = useState('');
  const [solveError, setSolveError] = useState('');
  const [scorecard, setScorecard] = useState<{ letters: number; bonus: number; total: number; coins: number; priorBest: MazeFieldScore | null; barnNote: boolean } | null>(
    run.completed ? { ...mazeScore(puzzle, run, true), coins: 0, priorBest: bestMazeScore(store.save.maze.scores, puzzle.id), barnNote: false } : null,
  );
  const [rejectShake, setRejectShake] = useState({ id: '', nonce: 0 });
  const [toast, setToast] = useState('');
  const [toastTool, setToastTool] = useState<ToolId | null>(null);
  const [storyLine, setStoryLine] = useState(0);
  const [toolFx, setToolFx] = useState<MazeToolFx | null>(null);
  const [toolPrimer, setToolPrimer] = useState<ToolId | null>(null);
  const stick = useRef({ x: 0, y: 0 });
  const runRef = useRef(run);
  const puzzleRef = useRef(puzzle);
  const storeRef = useRef(store);
  const pausedRef = useRef(paused);
  const scorecardRef = useRef(scorecard);
  const revealRef = useRef(reveal);
  const nearbyPeekRef = useRef<Set<string>>(new Set());
  const appActiveRef = useRef(true);
  const rewardedRef = useRef(false);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const fxLockRef = useRef(false);
  runRef.current = run;
  puzzleRef.current = puzzle;
  storeRef.current = store;
  pausedRef.current = paused || mapOpen || !!barnRestock;
  scorecardRef.current = scorecard;
  revealRef.current = reveal;

  useEffect(() => {
    const next = restoreMazeRun(puzzle, saved);
    const campaignRun = { ...next, campaign };
    runRef.current = campaignRun;
    setRun(campaignRun);
    setReveal(null);
    setSelectedId(null);
    setGuess('');
    setSolveError('');
    setScorecard(campaignRun.completed ? { ...mazeScore(puzzle, campaignRun, true), coins: 0, priorBest: bestMazeScore(store.save.maze.scores, puzzle.id), barnNote: false } : null);
    rewardedRef.current = campaign && store.save.maze.rewardedIds.includes(puzzle.id);
    setStoryLine(0);
    setToast('');
    setToastTool(null);
    setBarnRestock(null);
    setToolFx(null);
    fxLockRef.current = false;
    nearbyPeekRef.current = new Set();
  }, [puzzle.id, campaign]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast('');
      setToastTool(null);
    }, 2800);
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
      const playing = appActiveRef.current && !pausedRef.current && !fxLockRef.current && !runRef.current.completed && !scorecardRef.current;
      if (playing) {
        const picked = new Set(runRef.current.pickedFindIds);
        const next = advanceMazePlay(puzzleRef.current, runRef.current, stick.current.x, stick.current.y, dt);
        const freshId = next.pickedFindIds.find(id => !picked.has(id));
        if (freshId) {
          const find = mazeFindsFor(puzzleRef.current).find(item => item.id === freshId);
          if (find) {
            const needsPrimer = TOOL_PRIMER_IDS.includes(find.tool) && !storeRef.current.save.seenToolHelp.includes(find.tool);
            if (needsPrimer) setToolPrimer(find.tool);
            else {
              setToast(`${TOOL_INFO[find.tool].title} found`);
              setToastTool(find.tool);
            }
            playGameSound('tool', 0.78);
            if (!fxLockRef.current) {
              setToolFx({ nonce: Date.now(), kind: 'find', tool: find.tool, at: find.cell });
            }
          }
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

  const nearbyCobs = useMemo(() => nearbyLetterCobs(puzzle, run), [puzzle, run]);
  const selected = nearbyCobs.find(cob => cob.id === selectedId)
    ?? nearbyCobs.find(cob => farmerFacesCob(run, cob))
    ?? nearbyCobs[0];
  const target = currentTarget(puzzle, run);
  const waiting = !run.started || !run.solved;
  const revealedIds = mazeRevealedIds(run, reveal);
  const harvestPick = harvestReadyCobs(puzzle, run, revealedIds)[0] ?? null;
  const canHarvest = !!(harvestPick && !waiting);
  const nearPlant = nearbyCobs.length > 0;
  const harvestPulse = canHarvest;
  const livePhase = stormPhase(puzzle, run);
  const previewFx = __DEV__ ? (Array.isArray(fx) ? fx[0] : fx) : undefined;
  const phase = previewFx === 'rain' ? 'rain' : livePhase;
  const slots = solvePromptSlots(puzzle.displayAnswer ?? puzzle.answer, puzzle.givenMask ?? null, run.solved, run.nextAnswerIndex);
  const animalReady = wildlifeInRange(puzzle, run);
  const wildlifeCob = run.wildlife ? liveCobs(puzzle, run).find(cob => cob.id === run.wildlife?.cobId) : undefined;

  const commit = (next: MazeRun, nextReveal: MazeReveal | null = reveal) => {
    runRef.current = next;
    setRun(next);
    setReveal(nextReveal);
  };

  useEffect(() => {
    if (waiting || run.completed || paused || mapOpen || barnRestock) return;
    const current = runRef.current;
    const nearbyNow = nearbyLetterCobs(puzzle, current);
    const stillNearby = new Set(nearbyNow.map(cob => cob.id));
    for (const id of nearbyPeekRef.current) {
      if (!stillNearby.has(id)) nearbyPeekRef.current.delete(id);
    }
    const entered = nearbyNow.filter(cob => !nearbyPeekRef.current.has(cob.id));
    if (!entered.length) return;
    let next = current;
    let nextReveal = revealRef.current;
    let peeked = false;
    for (const cob of entered) {
      const result = inspectCob(puzzle, next, cob.id, next.elapsedActiveMs);
      if (result.ok) {
        next = result.run;
        nextReveal = result.reveal;
        nearbyPeekRef.current.add(cob.id);
        peeked = true;
      } else if (result.reason !== 'blocked') {
        nearbyPeekRef.current.add(cob.id);
      }
    }
    if (!peeked) return;
    commit(next, nextReveal);
    playGameSound('tap', 0.4);
  }, [run.player.x, run.player.y, run.started, run.solved, waiting, run.completed, paused, mapOpen, barnRestock, puzzle]);

  const harvest = (cobId?: string) => {
    if (waiting || runRef.current.completed) return;
    const ready = harvestReadyCobs(puzzle, runRef.current, mazeRevealedIds(runRef.current, revealRef.current));
    const pickId = cobId && ready.some(cob => cob.id === cobId) ? cobId : (!cobId ? ready[0]?.id : undefined);
    if (cobId) setSelectedId(cobId);
    const faced = selected ?? cobsInRange(puzzle, runRef.current).find(cob => farmerFacesCob(runRef.current, cob));
    const reject = (id?: string) => {
      if (id) setRejectShake(prev => ({ id, nonce: prev.nonce + 1 }));
      playGameSound('invalid', 0.62);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    if (!pickId) {
      reject(cobId ?? faced?.id);
      return;
    }
    const result = harvestCob(puzzle, runRef.current, pickId, null);
    if (!result.ok) {
      reject(pickId);
      return;
    }
    commit(result.run, null);
    playGameSound(result.completedNow ? 'complete' : 'basket', 0.78);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    store.saveMazeRun(result.run);
    if (result.completedNow) {
      const already = campaign && store.save.maze.rewardedIds.includes(puzzle.id);
      const storm = canEarnStormRibbon(puzzle, result.run) && !!puzzle.stormSeconds;
      const leftover = unusedBarnFinds(result.run);
      const coins = campaign && !already ? mazeClearCoins(puzzle.chapter, storm) : 0;
      const score = mazeScore(puzzle, result.run, !!already);
      const priorBest = bestMazeScore(store.save.maze.scores, puzzle.id);
      store.recordMazeFieldScore({
        puzzleId: puzzle.id,
        points: score.total,
        letters: score.letters,
        bonus: score.bonus,
        elapsedMs: result.run.elapsedActiveMs,
        unaided: mazeUnaided(result.run),
        storm,
        coins,
        at: Date.now(),
      });
      if (campaign && !rewardedRef.current) {
        rewardedRef.current = true;
        if (!already) {
          store.markMazeRewarded(puzzle.id, {
            unaided: mazeUnaided(result.run),
            storm,
            coins,
            tools: leftover,
          });
        }
      }
      setScorecard({
        ...score,
        coins,
        priorBest,
        barnNote: campaign && Object.values(leftover).some(count => (count ?? 0) > 0),
      });
    }
  };

  const clearToolFx = useCallback(() => {
    fxLockRef.current = false;
    setToolFx(null);
  }, []);

  const openBarn = (target: FieldBarnRestock = 'browse') => {
    if (runRef.current.completed || fxLockRef.current) return;
    setStick(0, 0);
    setBarnRestock(target);
    playGameSound('tap', 0.62);
  };

  const useMazeTool = (tool: ToolId) => {
    if (waiting || runRef.current.completed || fxLockRef.current) return;
    if (barnChargesFor(runRef.current, storeRef.current.save.inventory, tool) < 1) {
      openBarn(tool);
      return;
    }
    const current = runRef.current;
    const pest = current.wildlife
      ? liveCobs(puzzleRef.current, current).find(cob => cob.id === current.wildlife?.cobId)
      : undefined;
    const result = applyMazeTool(puzzleRef.current, current, tool, storeRef.current.save.inventory);
    if (!result.ok) {
      setToast(result.reason);
      setToastTool(null);
      playGameSound('invalid', 0.62);
      return;
    }
    if (result.consumeInventory && !storeRef.current.consumeTool(tool)) {
      playGameSound('invalid', 0.62);
      return;
    }
    commit(result.run, reveal);
    setToast(result.toast);
    setToastTool(tool);
    playGameSound('tool', 0.78);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (TOOL_PRIMER_IDS.includes(tool) && !storeRef.current.save.seenToolHelp.includes(tool)) {
      setToolPrimer(tool);
    }
    const nonce = Date.now();
    if (tool === 'mower' || tool === 'tractor') {
      fxLockRef.current = true;
      setStick(0, 0);
      setToolFx({ nonce, kind: tool, facing: current.facing, tiles: result.tiles ?? [], mowed: result.mowed });
      return;
    }
    if (tool === 'scarecrow') {
      setToolFx({ nonce, kind: 'scarecrow', at: pest?.wall ?? { col: Math.floor(current.player.x), row: Math.floor(current.player.y) } });
      return;
    }
    if (tool === 'huskClip') {
      const cob = liveCobs(puzzleRef.current, result.run).find(item => item.id === result.cobId);
      setToolFx({
        nonce,
        kind: 'huskClip',
        at: cob ? { x: cob.wall.col + 0.5, y: cob.wall.row + 0.5 } : current.player,
      });
      return;
    }
    if (tool === 'lantern' || tool === 'raincoat') {
      setToolFx({ nonce, kind: tool, at: current.player });
    }
  };

  const harvestRef = useRef(harvest);
  harvestRef.current = harvest;
  const selectRef = useRef((id: string) => { setSelectedId(id); });
  selectRef.current = (id: string) => { setSelectedId(id); };

  const setStick = useCallback((x: number, y: number) => {
    stick.current = { x, y };
  }, []);

  const cobAt = useCallback((x: number, y: number) => {
    const origin = originRef.current;
    const revealed = mazeRevealedIds(runRef.current, revealRef.current);
    let best: { id: string; d: number } | null = null;
    for (const cob of liveCobs(puzzleRef.current, runRef.current)) {
      if (runRef.current.harvestedCobIds.includes(cob.id)) continue;
      const cx = origin.x + cob.wall.col * TILE + TILE / 2;
      const cy = origin.y + cob.wall.row * TILE + TILE * 0.22;
      const d = Math.hypot(x - cx, y - cy);
      const hit = revealed.includes(cob.id) ? TILE * 1.1 : TILE * 0.85;
      if (d < hit && (!best || d < best.d)) best = { id: cob.id, d };
    }
    return best?.id ?? null;
  }, []);

  const tapPlant = useCallback((x: number, y: number) => {
    const id = cobAt(x, y);
    if (id) selectRef.current(id);
  }, [cobAt]);

  const harvestPlant = useCallback((x: number, y: number) => {
    const id = cobAt(x, y);
    if (id) {
      harvestRef.current(id);
      return;
    }
    const ready = harvestReadyCobs(
      puzzleRef.current,
      runRef.current,
      mazeRevealedIds(runRef.current, revealRef.current),
    )[0];
    if (ready) harvestRef.current(ready.id);
  }, [cobAt]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const held = new Set<string>();
    const keys = new Set(['arrowright', 'arrowleft', 'arrowdown', 'arrowup', 'w', 'a', 's', 'd']);
    const typing = (target: EventTarget | null) => {
      const el = target as { tagName?: string; isContentEditable?: boolean } | null;
      return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || !!el?.isContentEditable;
    };
    const applyWalk = () => {
      if (pausedRef.current || scorecardRef.current || runRef.current.completed) {
        setStick(0, 0);
        return;
      }
      const x = (held.has('arrowright') || held.has('d') ? 1 : 0) - (held.has('arrowleft') || held.has('a') ? 1 : 0);
      const y = (held.has('arrowdown') || held.has('s') ? 1 : 0) - (held.has('arrowup') || held.has('w') ? 1 : 0);
      if (x === 0 && y === 0) {
        setStick(0, 0);
        return;
      }
      const length = Math.hypot(x, y);
      setStick(x / length, y / length);
    };
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (keys.has(key) && !typing(event.target)) {
        event.preventDefault();
        held.add(key);
        applyWalk();
        return;
      }
      if (event.code !== 'Space' && event.key !== ' ') return;
      if (event.repeat || typing(event.target) || pausedRef.current || scorecardRef.current || runRef.current.completed) return;
      event.preventDefault();
      harvestRef.current();
    };
    const onUp = (event: KeyboardEvent) => {
      held.delete(event.key.toLowerCase());
      applyWalk();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [setStick]);

  const restart = () => {
    const fresh = createMazeRun(puzzle, campaign);
    commit(fresh, null);
    rewardedRef.current = campaign && store.save.maze.rewardedIds.includes(puzzle.id);
    setSelectedId(null);
    setScorecard(null);
    setPaused(false);
    setGuess('');
    setSolveError('');
    setToolFx(null);
    fxLockRef.current = false;
    nearbyPeekRef.current = new Set();
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
  const overlayBottom = Math.max(insets.bottom, 8);
  const playTop = Math.min(chromeH.top, Math.max(0, fieldH - 80));
  const playBottom = Math.max(playTop + 80, fieldH - chromeH.bottom);
  const playMidX = fieldW / 2;
  const playMidY = (playTop + playBottom) / 2;
  const originX = worldW <= fieldW
    ? (fieldW - worldW) / 2
    : Math.min(0, Math.max(fieldW - worldW, playMidX - run.player.x * TILE));
  const originY = worldH <= playBottom - playTop
    ? playTop + (playBottom - playTop - worldH) / 2
    : Math.min(playTop, Math.max(playBottom - worldH, playMidY - run.player.y * TILE));
  originRef.current = { x: originX, y: originY };
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
  pausedRef.current = paused || mapOpen || !!storyBeat || !!barnRestock || !!toolPrimer;
  const sight = parseMazeVisibility(puzzle.visibility);
  const fogActive = sight.mode === 'mist';
  const foggy = fogActive || sight.mode === 'evening' || (sight.mode === 'storm' && !!sight.radius);
  const stormFx = phase === 'overcast' || phase === 'dark' || phase === 'rain' || phase === 'grace' || phase === 'expired' || phase === 'untimed';
  const mood = stormFx && (phase === 'dark' || phase === 'rain' || phase === 'grace' || phase === 'expired') ? 'fog' : 'sunny';
  const showPad = store.save.settings.showMazePad;
  const instructorOpen = !!storyBeat || !!toolPrimer;
  const timedStorm = !!(puzzle.stormSeconds && !run.stormUntimed);
  const harvestLetters = puzzle.answer.replace(/[^A-Z]/g, '').length;

  return (
    <View style={[styles.shell, { backgroundColor: mood === 'fog' ? '#8a6a32' : '#c9872c' }]}>
      <FieldSteer
        onStick={setStick}
        onTap={tapPlant}
        onHarvest={harvestPlant}
        onLayout={event => {
          const next = event.nativeEvent.layout;
          setFieldSize(prev => (prev.width === next.width && prev.height === next.height ? prev : { width: next.width, height: next.height }));
        }}
        style={styles.viewport}
      >
        <MazeScene
          puzzle={puzzle} run={run} selectedId={selected?.id} revealedIds={revealedIds}
          originX={originX} originY={originY} viewportWidth={fieldW} viewportHeight={fieldH}
          moving={!waiting && !paused && !barnRestock && !run.completed && Math.hypot(stick.current.x, stick.current.y) > MAZE_STICK_DEADZONE}
          reducedMotion={store.save.settings.reducedMotion}
          reducedMist={store.save.settings.reducedMotion}
          shakeCobId={rejectShake.id}
          shakeNonce={rejectShake.nonce}
          mood={mood}
          toolFx={toolFx}
          onToolFxDone={clearToolFx}
          farmerId={store.save.settings.mazeFarmer}
        />
        <FogOverlay
          enabled={foggy}
          playerX={originX + run.player.x * TILE}
          playerY={originY + run.player.y * TILE}
          sight={sight}
          phase={phase}
          viewportWidth={fieldW}
          viewportHeight={fieldH}
          paused={paused || mapOpen || waiting || !!scorecard || !!barnRestock}
          reducedMotion={store.save.settings.reducedMotion}
          lantern={lanternCountFor(run)}
          bottomInset={0}
        />
        {stormFx ? (
          <MazeWeatherLayer
            phase={phase}
            sight={sight}
            farmerX={originX + run.player.x * TILE}
            farmerY={originY + run.player.y * TILE}
            paused={paused || mapOpen || waiting || !!scorecard || !!barnRestock}
            reducedMotion={store.save.settings.reducedMotion}
            width={fieldW}
            height={fieldH}
          />
        ) : null}
        {wildlifeCob && run.wildlife ? (
          <MazePest
            kind={run.wildlife.kind}
            phase={run.wildlife.phase}
            left={originX + wildlifeCob.wall.col * TILE}
            top={originY + wildlifeCob.wall.row * TILE}
            reducedMotion={store.save.settings.reducedMotion}
          />
        ) : null}
        {toast ? (
          <Pressable onPress={() => { setToast(''); setToastTool(null); }} style={[styles.toast, { bottom: chromeH.bottom + 8 }]}>
            {toastTool ? <Image source={wordMaizeAssets.powerups[toastTool]} style={styles.toastIcon} /> : null}
            <Text style={styles.toastText}>{toast}</Text>
          </Pressable>
        ) : null}
      </FieldSteer>
      <MazeChrome
        fog={mood === 'fog'}
        style={[styles.topChrome, { paddingTop: overlayTop }]}
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          setChromeH(prev => (Math.abs(prev.top - height) < 1 ? prev : { ...prev, top: height }));
        }}
      >
        <View style={styles.hud}>
          <View style={styles.hudLeft}>
            <HudIconButton label="Pause" onPress={() => setPaused(true)}>
              <PauseBars />
            </HudIconButton>
            <GameplayStatusBar
              harvested={run.harvestedCobIds.length}
              total={harvestLetters}
              timed={timedStorm}
              timeValue={timedStorm ? formatMazeTime(stormRemainingMs(puzzle, run)) : undefined}
            />
          </View>
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
        {run.wildlife ? <Text style={styles.warn}>{run.wildlife.kind.toUpperCase()} {run.wildlife.phase === 'warning' ? 'incoming' : 'blocking a plant'}</Text> : null}
      </MazeChrome>
      <View pointerEvents="box-none" style={[styles.toolDock, { top: chromeH.top + 8 }]}>
        <MazeToolBelt
          counts={Object.fromEntries(MAZE_TOOL_IDS.map(tool => [tool, barnChargesFor(run, store.save.inventory, tool)])) as Record<ToolId, number>}
          disabled={waiting || run.completed || toolFx?.kind === 'mower' || toolFx?.kind === 'tractor'}
          shopLocked={run.completed || toolFx?.kind === 'mower' || toolFx?.kind === 'tractor'}
          flashTool={toastTool}
          onUse={useMazeTool}
          onEmpty={openBarn}
          onShop={() => openBarn()}
        />
      </View>
      <MazeChrome
        tone="footer"
        fog={mood === 'fog'}
        style={[styles.footer, showPad ? styles.footerPad : styles.footerSlim, { paddingBottom: overlayBottom }]}
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          setChromeH(prev => (Math.abs(prev.bottom - height) < 1 ? prev : { ...prev, bottom: height }));
        }}
      >
        <View style={[styles.controls, showPad ? styles.controlsPad : styles.controlsSlim]}>
          {showPad && !instructorOpen ? <Joystick onVector={setStick} /> : <View />}
          <View style={styles.actions}>
            {run.wildlife && animalReady && !instructorOpen ? (
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
            {!instructorOpen ? (
            <HarvestButton
              enabled={canHarvest}
              nearby={nearPlant}
              ready={harvestPulse}
              disabled={waiting || run.completed}
              reducedMotion={store.save.settings.reducedMotion}
              compact={!showPad}
              onPress={() => harvest()}
            />
            ) : null}
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
        visible={paused && !barnRestock}
        title="Paused"
        onClose={() => setPaused(false)}
        primary={{ label: 'RESUME', onPress: () => setPaused(false) }}
        actions={[
          {
            label: t.fieldBarn.shop,
            onPress: () => openBarn(),
            tone: 'gold' as const,
          },
          {
            label: showPad ? 'HIDE GAME PAD' : 'SHOW GAME PAD',
            onPress: () => {
              if (showPad) setStick(0, 0);
              store.setSetting('showMazePad', !showPad);
            },
            tone: 'slate' as const,
          },
          ...(run.solved ? [
            { label: 'FIND NEXT LETTER', onPress: helpNext, tone: 'slate' as const },
            { label: 'REMIND A VISIT', onPress: helpRemind, tone: 'slate' as const },
          ] : []),
          { label: 'RESTART MAZE', onPress: restart, tone: 'slate' as const },
          { label: 'LEAVE', onPress: () => { store.saveMazeRun(runRef.current); router.back(); }, tone: 'slate' as const },
        ]}
      >
        <DialogCopy>Drag the field to walk. Double-tap a plant to harvest the next letter. Weather waits until you return.</DialogCopy>
        <DialogCopy>{store.save.settings.farmerName || 'Farmer May'}</DialogCopy>
        <MazeFarmerPicker compact value={store.save.settings.mazeFarmer} onChange={id => store.setSetting('mazeFarmer', id)} />
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
        visible={!!scorecard && !storyBeat}
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
        {campaign ? <DialogCopy>{scorecard?.coins ? `+${scorecard.coins} coins added to the farm.` : 'Coins already claimed for this field.'}</DialogCopy> : null}
        {scorecard?.priorBest ? <DialogCopy>Best: {scorecard.priorBest.points} pts · {formatMazeScoreTime(scorecard.priorBest.elapsedMs)}</DialogCopy> : null}
        <DialogCopy>Time {formatMazeTime(run.elapsedActiveMs)}</DialogCopy>
        {campaign ? <DialogCopy>{mazeUnaided(run) ? 'Unaided ribbon earned.' : 'Assists were used.'}{puzzle.stormSeconds ? (canEarnStormRibbon(puzzle, run) ? ' Storm ribbon earned.' : ' Storm ribbon not earned.') : ''}</DialogCopy> : null}
        {scorecard?.barnNote ? <DialogCopy>Unused crate finds went to the Barn.</DialogCopy> : null}
      </FarmDialog>

      <FieldBarnDialog
        restock={barnRestock}
        onClose={() => setBarnRestock(null)}
        onBrowse={() => setBarnRestock('browse')}
        onPacked={message => { setToast(message); setToastTool(null); }}
      />

      <ModeHelpDialog mode="maize" blocked={!!storyBeat || !!toolPrimer} />

      {toolPrimer ? (
        <FarmDialog
          visible
          title={TOOL_INFO[toolPrimer].title}
          primary={{
            label: 'GOT IT',
            onPress: () => {
              store.markToolHelpSeen(toolPrimer);
              setToast(`${TOOL_INFO[toolPrimer].title} found`);
              setToastTool(toolPrimer);
              setToolPrimer(null);
            },
          }}
        >
          <DialogCopy>{TOOL_INFO[toolPrimer].blurb}</DialogCopy>
          <DialogCopy>{TOOL_PRIMER_HOW_TO[toolPrimer]}</DialogCopy>
        </FarmDialog>
      ) : null}

      {storyBeat ? (
        <StoryBeatOverlay
          beat={storyBeat}
          lineIndex={storyLine}
          farmerName={store.save.settings.farmerName}
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

function FieldSteer({
  onStick, onTap, onHarvest, onLayout, style, children,
}: {
  onStick: (x: number, y: number) => void;
  onTap: (x: number, y: number) => void;
  onHarvest: (x: number, y: number) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const stickRef = useRef(onStick);
  const tapRef = useRef(onTap);
  const harvestRef = useRef(onHarvest);
  const startRef = useRef({ t: 0, walking: false });
  const lastTapRef = useRef<{ x: number; y: number; at: number } | null>(null);
  stickRef.current = onStick;
  tapRef.current = onTap;
  harvestRef.current = onHarvest;

  const begin = useCallback(() => {
    startRef.current = { t: Date.now(), walking: false };
  }, []);
  const move = useCallback((dx: number, dy: number) => {
    const stick = fieldWalkStick(dx, dy);
    if (stick.x !== 0 || stick.y !== 0) startRef.current.walking = true;
    stickRef.current(stick.x, stick.y);
  }, []);
  const end = useCallback((dx: number, dy: number, x: number, y: number) => {
    stickRef.current(0, 0);
    const started = startRef.current;
    const walked = started.walking || fieldPointerRelease(dx, dy, Date.now() - started.t) === 'walk';
    startRef.current = { t: 0, walking: false };
    if (walked) {
      lastTapRef.current = null;
      return;
    }
    const now = Date.now();
    if (fieldDoubleTap(x, y, now, lastTapRef.current)) {
      lastTapRef.current = null;
      harvestRef.current(x, y);
      return;
    }
    lastTapRef.current = { x, y, at: now };
    tapRef.current(x, y);
  }, []);
  const cancel = useCallback(() => {
    startRef.current = { t: 0, walking: false };
    stickRef.current(0, 0);
  }, []);

  const gesture = useMemo(() => (
    Gesture.Pan()
      .minDistance(0)
      .maxPointers(1)
      .shouldCancelWhenOutside(false)
      .onBegin(() => {
        'worklet';
        runOnJS(begin)();
      })
      .onUpdate(event => {
        'worklet';
        runOnJS(move)(event.translationX, event.translationY);
      })
      .onEnd(event => {
        'worklet';
        runOnJS(end)(event.translationX, event.translationY, event.x, event.y);
      })
      .onFinalize((_event, success) => {
        'worklet';
        if (!success) runOnJS(cancel)();
      })
  ), [begin, cancel, end, move]);

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} onLayout={onLayout} style={style}>
        {children}
      </View>
    </GestureDetector>
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

function HarvestButton({ enabled, nearby, ready, disabled, reducedMotion, compact, onPress }: { enabled: boolean; nearby: boolean; ready: boolean; disabled: boolean; reducedMotion: boolean; compact?: boolean; onPress: () => void }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion || (!ready && !nearby)) {
      pulse.value = withTiming(1, { duration: 120 });
      return;
    }
    if (!ready && nearby) {
      pulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 640, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 640, easing: Easing.inOut(Easing.quad) })), -1, true);
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 420, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) })), -1, true);
  }, [pulse, ready, nearby, reducedMotion]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const far = !nearby && !ready;
  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Harvest"
        disabled={disabled}
        onPress={onPress}
        style={[
          compact ? styles.harvestRimSlim : styles.harvestRim,
          far && styles.harvestFar,
          nearby && !ready && styles.harvestNearby,
          (enabled || ready) && styles.harvestReady,
        ]}
      >
        {({ pressed }) => (
          <View style={compact ? styles.harvestLipSlim : styles.harvestLip}>
            <View style={[
              compact ? styles.harvestFaceSlim : styles.harvestFace,
              nearby && styles.harvestFaceNearby,
              (enabled || ready) && styles.harvestFaceReady,
              pressed && (compact ? styles.harvestPressedSlim : styles.harvestPressed),
            ]}>
              <Text style={[styles.harvestText, far && styles.harvestTextFar]}>{'HARVEST'}</Text>
            </View>
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
  topChrome: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 4, paddingBottom: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4, paddingTop: 4 },
  viewport: { flex: 1, position: 'relative', overflow: 'hidden' },
  toolDock: { position: 'absolute', left: 8, zIndex: 5 },
  hud: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 10, gap: 8 },
  hudLeft: { alignItems: 'center', width: 46 },
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
  warn: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(40, 24, 10, 0.86)',
    borderWidth: 2,
    borderColor: '#f0c43a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#fff6c6',
    fontWeight: '900',
    fontSize: 12,
    overflow: 'hidden',
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: 'center' },
  slot: { width: 22, height: 26, borderRadius: 6, backgroundColor: '#fff1bd', borderWidth: 2, borderColor: '#c78a32', alignItems: 'center', justifyContent: 'center' },
  slotGiven: { backgroundColor: '#d7f59a' },
  slotSpace: { width: 10, height: 26 },
  slotLetter: { color: '#4f7f26', fontWeight: '900', fontSize: 14 },
  controls: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },
  controlsPad: { minHeight: 120 },
  controlsSlim: { minHeight: 64, justifyContent: 'flex-end' },
  footerPad: { paddingTop: 8 },
  footerSlim: { paddingTop: 0 },
  stick: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(28,16,8,0.72)', borderWidth: 3, borderColor: '#d7ad4b', alignItems: 'center', justifyContent: 'center', touchAction: 'none' },
  stickTick: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#ead9a7' },
  stickTickN: { top: 10 },
  stickTickE: { right: 10 },
  stickTickS: { bottom: 10 },
  stickTickW: { left: 10 },
  knob: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f4e2b0', borderWidth: 3, borderColor: '#c48a32' },
  actions: { flex: 1, gap: 8, alignItems: 'flex-end' },
  action: { minWidth: 132, minHeight: 46, borderRadius: 14, backgroundColor: '#5cae31', borderWidth: 2, borderColor: '#b9e875', alignItems: 'center', justifyContent: 'center' },
  harvestRim: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#d7ad4b',
    borderWidth: 3,
    borderColor: '#fff3a8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffe08a',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  harvestRimSlim: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#d7ad4b',
    borderWidth: 3,
    borderColor: '#fff3a8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffe08a',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  harvestFar: { opacity: 0.58, borderColor: '#c9a15a', shadowOpacity: 0 },
  harvestReady: { borderColor: '#fffbe6', shadowOpacity: 0.72, shadowRadius: 14 },
  harvestNearby: { borderColor: '#ffe08a', shadowOpacity: 0.5, shadowRadius: 10 },
  harvestLip: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#4a2a0c',
    borderWidth: 2,
    borderColor: '#8a5a18',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  harvestLipSlim: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a2a0c',
    borderWidth: 2,
    borderColor: '#8a5a18',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  harvestFace: {
    width: 102,
    height: 94,
    borderRadius: 51,
    backgroundColor: '#f4e2b0',
    borderWidth: 2,
    borderColor: '#ead071',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestFaceSlim: {
    width: 80,
    height: 74,
    borderRadius: 40,
    backgroundColor: '#f4e2b0',
    borderWidth: 2,
    borderColor: '#ead071',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestFaceNearby: { backgroundColor: '#f8ebb8', borderColor: '#f0c56a' },
  harvestFaceReady: { backgroundColor: '#ffe08a', borderColor: '#fff6c6' },
  harvestPressed: { height: 98, marginTop: 4 },
  harvestPressedSlim: { height: 76, marginTop: 4 },
  harvestText: { color: '#5a2808', fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  harvestTextFar: { color: '#7a5a28' },
  actionText: { color: 'white', fontWeight: '900', fontSize: 16 },
  score: { fontSize: 28, fontWeight: '900', color: '#c78a32', textAlign: 'center', marginVertical: 8 },
  input: { marginVertical: 10, borderWidth: 2, borderColor: '#c78a32', borderRadius: 10, backgroundColor: '#fff8dc', paddingHorizontal: 10, paddingVertical: 8, fontWeight: '900', color: '#3b2410', textAlign: 'center' },
  mini: { alignSelf: 'center', marginVertical: 10, backgroundColor: '#1d3f18', padding: 4, borderRadius: 8 },
  miniRow: { flexDirection: 'row' },
  miniCell: { width: 6, height: 6, backgroundColor: '#16381e' },
  miniWall: { backgroundColor: '#1a4a16' },
  miniPath: { backgroundColor: '#d7c08a' },
  miniHere: { backgroundColor: '#7ee04a' },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 12, zIndex: 12, backgroundColor: 'rgba(40,24,10,0.92)', borderRadius: 12, borderWidth: 2, borderColor: '#c78a32', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  toastIcon: { width: 36, height: 36, resizeMode: 'contain' },
  toastText: { color: '#fff6c6', fontWeight: '800', textAlign: 'center' },
});
