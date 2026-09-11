import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createElement, DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { playGameSound } from '../audio/sounds';
import { CrosswordCob, CrosswordCobHandle } from '../components/CornCob/CrosswordCob';
import { TwistCob } from '../components/CornCob/TwistCob';
import { DialogCopy, FarmDialog } from '../components/FarmDialog';
import { ModeHelpDialog } from '../components/ModeHelpDialog';
import { HarvestMeter } from '../components/HarvestMeter';
import { WoodPanel } from '../components/WoodPanel';
import { WordSubmitButton } from '../components/WordSubmitButton';
import { crosswordAt, twistAt, crosswordLetter, crosswordTiles, placeCrosswordTile, slotCells, solvedSlots, turnRing, twistLine, harvestTwist, undoTwist, twistRemoved, twistProgress, restoreTwistHistory, TwistHarvest, restoreTwistOffsets, TWIST_SAVE_VERSION, wrap, Placements, CROSSWORDS, TWISTS } from '../game/cobPuzzles';
import { fairPuzzleCoins, fairRewardId } from '../game/economy';
import { useCobRotation } from '../hooks/useCobRotation';
import { useGameStore } from '../store/GameStore';
import { COB_PUZZLE_SAVE_KEY as SAVE_KEY } from '../store/types';
type Run = { mode: 'crossword' | 'twist'; index: number; placements: Placements; checked: string[]; offsets: number[]; moves: number; won: boolean; twistVersion?: number; harvests?: TwistHarvest[] };
const fresh = (mode: Run['mode'], index = 0): Run => ({ mode, index, placements: {}, checked: [], offsets: [...twistAt(index).offsets], moves: 0, won: false, twistVersion: TWIST_SAVE_VERSION, harvests: [] });

function restoreRun(value: unknown): Run | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const saved = value as Run;
  if ((saved.mode !== 'crossword' && saved.mode !== 'twist') || !Number.isInteger(saved.index) || saved.index < 0
    || !saved.placements || typeof saved.placements !== 'object' || !Array.isArray(saved.checked) || !Number.isFinite(saved.moves)) return undefined;
  if (saved.mode === 'crossword') return { ...saved, offsets: [...twistAt(saved.index).offsets] };
  if (saved.twistVersion !== TWIST_SAVE_VERSION) return fresh('twist', saved.index);
  const offsets = restoreTwistOffsets(saved.index, saved.twistVersion, saved.offsets)!;
  const harvests = restoreTwistHistory(twistAt(saved.index), saved.harvests);
  return { ...saved, offsets, harvests, won: twistProgress(twistAt(saved.index), harvests).complete };
}

function TrayKernel({ letter, selected, onSelect, onDrop }: { letter: string; selected: boolean; onSelect: () => void; onDrop: (x: number, y: number) => void }) {
  const position = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const callbacks = useRef({ onSelect, onDrop }); callbacks.current = { onSelect, onDrop };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 7,
    onPanResponderGrant: () => { setDragging(true); callbacks.current.onSelect(); },
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
    onPanResponderRelease: (_, g) => { if (Math.abs(g.dx) + Math.abs(g.dy) > 7) callbacks.current.onDrop(g.moveX, g.moveY); position.setValue({ x: 0, y: 0 }); setDragging(false); },
    onPanResponderTerminate: () => { position.setValue({ x: 0, y: 0 }); setDragging(false); },
  })).current;
  const tile = (
    <Pressable accessibilityRole="button" accessibilityLabel={`Tray letter ${letter}`} accessibilityState={{ selected }} onPress={onSelect} style={[styles.trayHit, selected && styles.traySelected]}>
      <Image source={wordMaizeAssets.kernels.varieties.sweet.full} style={styles.trayArt} />
      <Text style={styles.trayLetter}>{letter}</Text>
    </Pressable>
  );
  if (Platform.OS === 'web') return createElement('div', {
    draggable: true,
    onDragStart: (event: DragEvent<HTMLDivElement>) => { event.dataTransfer.setData('text/plain', letter); onSelect(); },
    onDragEnd: (event: DragEvent<HTMLDivElement>) => onDrop(event.clientX, event.clientY),
    style: { cursor: 'grab', touchAction: 'none' },
  }, tile);
  return <Animated.View {...responder.panHandlers} style={{ transform: position.getTranslateTransform(), zIndex: dragging ? 100 : 1 }}>{tile}</Animated.View>;
}
function DropSurface({ children }: { children: import('react').ReactNode }) {
  const style = { flex: 1, width: '100%' as const, minHeight: 240, display: 'flex' as const, flexDirection: 'column' as const };
  return Platform.OS === 'web' ? createElement('div', { onDragOver: (event: DragEvent) => event.preventDefault(), onDrop: (event: DragEvent) => event.preventDefault(), style }, children) : <View style={{ flex: 1, width: '100%', minHeight: 240 }}>{children}</View>;
}
export function CobPuzzleScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const viewport = useWindowDimensions();
  const store = useGameStore();
  const reducedMotion = store.save.settings.reducedMotion;
  const [fairCoins, setFairCoins] = useState(0);
  const [harvesting, setHarvesting] = useState<string[]>([]);
  const harvestBusy = useRef(false);
  const cobRef = useRef<View>(null);
  const crosswordRef = useRef<CrosswordCobHandle>(null);
  const basketRef = useRef<View>(null);
  const gameWidth = Math.min(viewport.width, 430);
  const cobHeight = Math.min(viewport.height * 0.58, 520);
  const cobWidth = Math.min(gameWidth, cobHeight * (1024 / 1536));
  const cob = useCobRotation(0, 8, 6 / Math.max(1, cobWidth), 0.7, reducedMotion);
  const [board, setBoard] = useState({ width: cobWidth, height: cobHeight });
  const [harvestFlyTarget, setHarvestFlyTarget] = useState({ x: 42, y: cobHeight - 42 });
  const [harvestStatus, setHarvestStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  useEffect(() => {
    if (!harvesting.length) return;
    const timer = setTimeout(() => { setHarvesting([]); harvestBusy.current = false; setHarvestStatus('idle'); playGameSound('basket', .6); }, reducedMotion ? 100 : 720 + Math.max(0, harvesting.length - 1) * 70);
    return () => clearTimeout(timer);
  }, [harvesting, reducedMotion]);
  const [run, setRun] = useState<Run>(fresh('crossword'));
  const [ready, setReady] = useState(false);
  const modeRuns = useRef<Partial<Record<Run['mode'], Run>>>({});
  const saveQueue = useRef(Promise.resolve());
  const [saveError, setSaveError] = useState(false);
  const [activeClue, setActiveClue] = useState('1');
  const [selectedTile, setSelectedTile] = useState<string>();
  const [feedback, setFeedback] = useState('');
  const [twisting, setTwisting] = useState(false);
  const current = useRef(run); current.current = run;
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SAVE_KEY).then(raw => {
      if (!mounted || !raw) return;
      try {
        const data = JSON.parse(raw);
        const saved = restoreRun(data.active ?? data);
        if (saved) setRun(saved);
        for (const mode of ['crossword', 'twist'] as const) {
          const other = restoreRun(data.modes?.[mode]);
          if (other?.mode === mode) modeRuns.current[mode] = other;
        }
      } catch { /* A malformed prototype save starts a fresh puzzle. */ }
    }).catch(() => { if (mounted) setSaveError(true); }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    modeRuns.current[run.mode] = run;
    const value = JSON.stringify({ active: run, modes: modeRuns.current });
    saveQueue.current = saveQueue.current.then(() => AsyncStorage.setItem(SAVE_KEY, value)).catch(() => setSaveError(true));
  }, [run, ready]);
  const puzzle = crosswordAt(run.index);
  const twist = twistAt(run.index);
  const harvests = run.harvests ?? [];
  const removed = twistRemoved(harvests);
  const progress = twistProgress(twist, harvests);
  const clueIndex = Math.max(0, Math.min(harvests.length - (harvesting.length ? 1 : 0), twist.clues.length - 1));
  const clue = twist.clues[clueIndex];
  const lockedCells = [...new Set(puzzle.slots.filter(s => run.checked.includes(s.id)).flatMap(s => slotCells(s, puzzle.columns).map(c => c.id)))];
  const selectedSlot = puzzle.slots.find(s => s.id === activeClue) ?? puzzle.slots[0];
  const highlighted = slotCells(selectedSlot, puzzle.columns).map(c => c.id);
  const tiles = crosswordTiles(puzzle).filter(t => !Object.values(run.placements).includes(t.id));
  const change = (mode: Run['mode'], index = 0) => {
    setRun(fresh(mode, index)); cob.reset(0); setActiveClue('1'); setSelectedTile(undefined); setFeedback(''); setHarvestStatus('idle'); setFairCoins(0);
  };
  const switchMode = (mode: Run['mode']) => {
    if (mode === run.mode || harvesting.length) return;
    modeRuns.current[run.mode] = run;
    setRun(modeRuns.current[mode] ?? fresh(mode));
    setSelectedTile(undefined); setActiveClue('1'); cob.reset(0); setFeedback(''); setHarvestStatus('idle');
  };
  useEffect(() => {
    if (!ready) return;
    if (modeParam === 'twist' || modeParam === 'crossword') switchMode(modeParam);
  }, [ready, modeParam]);
  const focusSlot = (slot: typeof selectedSlot) => {
    setActiveClue(slot.id);
    cob.reset(wrap(slot.column + (slot.direction === 'across' ? Math.floor(slot.answer.length / 2) : 0), puzzle.columns));
  };
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
  }, [board.height, board.width, gameWidth, measureHarvestTarget, progress.percent, viewport.height, viewport.width, run.mode]);
  const place = (tileId: string, cellId: string) => {
    setRun(prev => {
      if (prev.mode !== 'crossword' || prev.won) return prev;
      const p = crosswordAt(prev.index);
      const locked = p.slots.filter(s => prev.checked.includes(s.id)).flatMap(s => slotCells(s, p.columns).map(c => c.id));
      const placements = placeCrosswordTile(p, prev.placements, tileId, cellId, locked);
      return placements === prev.placements ? prev : { ...prev, placements, moves: prev.moves + 1 };
    });
    setSelectedTile(undefined); setFeedback('');
  };
  const drop = (tileId: string, x: number, y: number) => {
    const started = current.current;
    crosswordRef.current?.hitCell(x, y).then(id => {
      if (current.current.mode !== started.mode || current.current.index !== started.index) return;
      if (id) place(tileId, id); else setFeedback('Drop onto an empty socket, or tap a letter then a socket.');
    });
  };
  const pressCell = (cellId: string) => {
    if (run.won || puzzle.givens.includes(cellId) || lockedCells.includes(cellId)) return;
    if (selectedTile) {
      place(selectedTile, cellId);
      return;
    }
    if (crosswordLetter(puzzle, run.placements, cellId)) {
      setRun(prev => {
        const placements = { ...prev.placements };
        delete placements[cellId];
        return { ...prev, placements };
      });
      setFeedback('');
      return;
    }
    setFeedback('Choose a letter from the tray first.');
  };
  const payFair = (mode: Run['mode'], index: number, id: string) => {
    const authored = mode === 'crossword' ? index < CROSSWORDS.length : index < TWISTS.length;
    const coins = fairPuzzleCoins(authored);
    if (store.markFairRewarded(fairRewardId(mode, id), coins)) {
      setFairCoins(coins);
      playGameSound('coin', 0.55);
    }
  };
  const check = () => {
    if (run.mode === 'crossword') {
      const solved = solvedSlots(puzzle, run.placements);
      const won = solved.length === puzzle.slots.length;
      const newly = solved.length > run.checked.length;
      if (won && !run.won) payFair('crossword', run.index, puzzle.id);
      setRun(prev => ({ ...prev, checked: solved, won }));
      setHarvestStatus(won || newly ? 'valid' : 'invalid');
      if (!won) setTimeout(() => setHarvestStatus('idle'), reducedMotion ? 120 : 480);
      setFeedback(won ? 'Every crossing fits. Your cob is golden!' : newly ? 'Word secured! Its letters help with the next crossing.' : 'Not quite. Check the clue and try another placement.');
      playGameSound(won ? 'complete' : newly ? 'valid' : 'invalid', 0.6);
    } else {
      if (twisting || harvestBusy.current || run.won) return;
      const next = harvestTwist(twist, run.offsets, harvests);
      if (next === harvests) {
        setFeedback('Not quite. Match the clue letters and every ○ empty socket.');
        setHarvestStatus('invalid');
        playGameSound('invalid', .6);
        setTimeout(() => setHarvestStatus('idle'), reducedMotion ? 120 : 480);
        return;
      }
      harvestBusy.current = true;
      setHarvesting(next[next.length - 1].ids);
      setHarvestStatus('valid');
      const won = twistProgress(twist, next).complete;
      if (won && !run.won) payFair('twist', run.index, twist.id);
      setRun(prev => ({ ...prev, harvests: next, won }));
      setFeedback(`${clue.pattern.replaceAll('.', '')} harvested!${won ? ' All clues complete.' : ''}`);
      playGameSound(won ? 'complete' : 'valid', .6);
    }
  };
  const nowLine = twistLine(twist, run.offsets, clue.lane, removed.filter(id => !harvesting.includes(id)));
  const canHarvest = harvestTwist(twist, run.offsets, harvests) !== harvests;
  const previewLetters = slotCells(selectedSlot, puzzle.columns).map(c => crosswordLetter(puzzle, run.placements, c.id));
  const crosswordWord = previewLetters.every(letter => letter) ? previewLetters.join('') : '';
  const crosswordPercent = Math.round((run.checked.length / Math.max(1, puzzle.slots.length)) * 100);
  if (!ready) return <View style={styles.shell}><Text style={styles.copy}>Opening the Fair…</Text></View>;
  if (run.mode === 'twist') {
    return (
      <View style={styles.twistShell}>
        <ImageBackground source={wordMaizeAssets.backgrounds.gameplayCobByType.sweet} style={styles.twistBg} resizeMode="cover">
          <SafeAreaView style={styles.twistSafe} edges={['top', 'bottom']}>
            <View style={styles.twistTop}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back to the Fair" style={styles.hudButton} onPress={() => router.replace('/(tabs)/fair')}>
                <Text style={styles.hudBack}>‹</Text>
              </Pressable>
              <WoodPanel style={styles.sign}>
                <Text style={styles.signTitle}>{twist.title.toUpperCase()}</Text>
                <Text style={styles.signClue} numberOfLines={2}>{clue.clue}</Text>
                <Text style={styles.signMeta}>CLUE {clueIndex + 1} / {twist.clues.length} · NEED {clue.pattern.replaceAll('.', '○').replace(/[A-Z]/g, '□')}</Text>
                <Text accessibilityLiveRegion="polite" style={styles.signNow}>NOW {nowLine.replaceAll('.', '○')}</Text>
              </WoodPanel>
              <View style={styles.topRight}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: false }} disabled={!!harvesting.length} onPress={() => switchMode('crossword')} style={styles.hudButton}>
                  <Text style={styles.modeChip}>Aa</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.wordRow}>
              <WordSubmitButton
                word={canHarvest ? clue.pattern.replaceAll('.', '') : ''}
                status={harvestStatus}
                canSubmit={!twisting && !harvesting.length && !run.won}
                onSubmit={check}
                reducedMotion={reducedMotion}
                emptyLabel="HARVEST WORD"
              />
            </View>
            <View
              style={styles.twistCob}
              onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                const nextHeight = Math.max(260, height);
                const nextWidth = Math.min(width, nextHeight * (1024 / 1536));
                setBoard(prev => (Math.abs(prev.width - nextWidth) < 2 && Math.abs(prev.height - nextHeight) < 2 ? prev : { width: nextWidth, height: nextHeight }));
                requestAnimationFrame(measureHarvestTarget);
              }}
            >
              <TwistCob
                ref={cobRef}
                puzzle={twist}
                offsets={run.offsets}
                removed={removed}
                harvesting={harvesting}
                reducedMotion={reducedMotion}
                locked={run.won || !!harvesting.length}
                width={board.width}
                height={board.height}
                harvestTarget={harvestFlyTarget}
                lane={clue.lane}
                onInteraction={setTwisting}
                onTurn={(row, step) => {
                  setRun(prev => ({ ...prev, offsets: turnRing(twist, prev.offsets, row, step), moves: prev.moves + 1 }));
                  setFeedback('');
                  setHarvestStatus('idle');
                }}
              />
            </View>
            <View style={styles.dock} onLayout={measureHarvestTarget}>
              <HarvestMeter ref={basketRef} percent={Math.round(progress.percent)} catching={harvesting.length > 0} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Undo last harvest"
                disabled={!harvests.length || !!harvesting.length || twisting}
                style={[styles.undoHit, !harvests.length && styles.undoOff]}
                onPress={() => {
                  const undo = undoTwist(harvests); if (!undo) return;
                  setRun(prev => ({ ...prev, harvests: undo.history, offsets: undo.offsets, won: false }));
                  setFeedback('Last word restored. Try a different placement.');
                  setHarvestStatus('idle');
                }}
              >
                <Text style={styles.undoText}>UNDO</Text>
              </Pressable>
              <WoodPanel style={styles.session}>
                <Text style={styles.sessionText}>{run.moves} TURNS</Text>
                <Text style={styles.signMeta}>{harvests.length}/{twist.clues.length} WORDS</Text>
              </WoodPanel>
              <Pressable accessibilityRole="button" accessibilityLabel="Restart puzzle" disabled={!!harvesting.length} style={styles.hudButton} onPress={() => change('twist', run.index)}>
                <Text style={styles.modeChip}>↺</Text>
              </Pressable>
            </View>
            {saveError ? <Text style={styles.twistHelp}>Progress could not be saved on this device.</Text> : null}
          </SafeAreaView>
        </ImageBackground>
        <ModeHelpDialog mode="twist" />
        {run.won && !harvesting.length ? (
          <FarmDialog
            key={`twist-win-${run.index}`}
            visible
            title="Beautiful harvest!"
            primary={{ label: 'NEXT PUZZLE', onPress: () => change('twist', run.index + 1) }}
            actions={[{ label: 'BACK TO THE FAIR', onPress: () => router.replace('/(tabs)/fair'), tone: 'slate' }]}
          >
            <DialogCopy>Puzzle {run.index + 1} complete · {Math.round(progress.percent)}% harvested · {run.moves} turns</DialogCopy>
            <DialogCopy>{fairCoins ? `${fairCoins} coins added to the farm.` : 'Coins already claimed for this puzzle.'}</DialogCopy>
          </FarmDialog>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.twistShell}>
        <ImageBackground source={wordMaizeAssets.backgrounds.gameplayCobByType.sweet} style={styles.twistBg} resizeMode="cover">
        <SafeAreaView style={styles.twistSafe} edges={['top', 'bottom']}>
          <View style={styles.twistTop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to the Fair" style={styles.hudButton} onPress={() => router.replace('/(tabs)/fair')}>
              <Text style={styles.hudBack}>‹</Text>
            </Pressable>
            <WoodPanel style={styles.sign}>
              <Text style={styles.signTitle}>{puzzle.title.toUpperCase()}</Text>
              <Text style={styles.signClue} numberOfLines={2}>{selectedSlot.clue}</Text>
              <Text style={styles.signMeta}>{selectedSlot.direction === 'across' ? 'ACROSS' : 'DOWN'} · {previewLetters.map(letter => letter || '·').join(' ')}</Text>
            </WoodPanel>
            <View style={styles.topRight}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: false }} onPress={() => switchMode('twist')} style={styles.hudButton}>
                <Text style={styles.modeChip}>T</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.clueRow}>
            {puzzle.slots.map(slot => (
              <Pressable
                key={slot.id}
                accessibilityRole="button"
                accessibilityLabel={`Clue ${slot.id}: ${slot.clue}`}
                accessibilityState={{ selected: activeClue === slot.id }}
                onPress={() => focusSlot(slot)}
                style={[styles.clueChip, activeClue === slot.id && styles.clueChipOn]}
              >
                <Text style={styles.clueChipText}>{run.checked.includes(slot.id) ? '✓' : slot.id}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.wordRow}>
            <WordSubmitButton
              word={crosswordWord}
              status={harvestStatus}
              canSubmit={!run.won}
              onSubmit={check}
              reducedMotion={reducedMotion}
              emptyLabel="CHECK WORDS"
            />
          </View>
          <DropSurface>
            <View
              style={styles.twistCob}
              onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                const nextHeight = Math.max(260, height);
                const nextWidth = Math.min(width, nextHeight * (1024 / 1536));
                setBoard(prev => (Math.abs(prev.width - nextWidth) < 2 && Math.abs(prev.height - nextHeight) < 2 ? prev : { width: nextWidth, height: nextHeight }));
              }}
            >
              <CrosswordCob
                ref={crosswordRef}
                puzzle={puzzle}
                placements={run.placements}
                rotation={cob.rotation}
                highlighted={highlighted}
                lockedCells={lockedCells}
                reducedMotion={reducedMotion}
                locked={run.won}
                width={board.width}
                height={board.height}
                onCellPress={pressCell}
                onRotateStart={cob.begin}
                onRotateMove={cob.move}
                onRotateEnd={velocityX => { cob.end(velocityX); playGameSound('rotate', 0.4); }}
              />
            </View>
          </DropSurface>
          <View style={styles.tray}>
            {tiles.map(tile => (
              <TrayKernel
                key={tile.id}
                letter={tile.letter}
                selected={selectedTile === tile.id}
                onSelect={() => setSelectedTile(prev => prev === tile.id ? undefined : tile.id)}
                onDrop={(x, y) => drop(tile.id, x, y)}
              />
            ))}
          </View>
          {feedback && !run.won ? <Text accessibilityLiveRegion="polite" style={styles.twistHelp}>{feedback}</Text> : null}
          <View style={styles.dock}>
            <HarvestMeter percent={crosswordPercent} catching={harvestStatus === 'valid'} />
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob left" style={styles.rotateHit} onPress={() => cob.nudge(-1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={[styles.rotateIcon, styles.rotateFlip]} />
            </Pressable>
            <WoodPanel style={styles.session}>
              <Text style={styles.sessionText}>{run.moves} MOVES</Text>
              <Text style={styles.signMeta}>{run.checked.length}/{puzzle.slots.length} WORDS</Text>
            </WoodPanel>
            <Pressable accessibilityRole="button" accessibilityLabel="Rotate cob right" style={styles.rotateHit} onPress={() => cob.nudge(1)}>
              <Image source={wordMaizeAssets.ui.btnRotate} style={styles.rotateIcon} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Restart puzzle" style={styles.hudButton} onPress={() => change('crossword', run.index)}>
              <Text style={styles.modeChip}>↺</Text>
            </Pressable>
          </View>
          {saveError ? <Text style={styles.twistHelp}>Progress could not be saved on this device.</Text> : null}
        </SafeAreaView>
      </ImageBackground>
      <ModeHelpDialog mode="crossword" />
      {run.won ? (
        <FarmDialog
          key={`crossword-win-${run.index}`}
          visible
          title="Beautiful harvest!"
          primary={{ label: 'NEXT PUZZLE', onPress: () => change('crossword', run.index + 1) }}
          actions={[{ label: 'BACK TO THE FAIR', onPress: () => router.replace('/(tabs)/fair'), tone: 'slate' }]}
        >
          <DialogCopy>Puzzle {run.index + 1} complete · {crosswordPercent}% harvested · {run.moves} moves</DialogCopy>
          <DialogCopy>{fairCoins ? `${fairCoins} coins added to the farm.` : 'Coins already claimed for this puzzle.'}</DialogCopy>
        </FarmDialog>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%', overflow: 'hidden', backgroundColor: '#16381e' },
  copy: { color: '#fff2c0', fontWeight: '700', fontSize: 13 },
  twistShell: { flex: 1, width: '100%', overflow: 'hidden', backgroundColor: '#1a3a18' },
  twistBg: { flex: 1, width: '100%' },
  twistSafe: { flex: 1, alignItems: 'stretch', paddingHorizontal: 8, paddingBottom: 6 },
  twistTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, zIndex: 8 },
  hudButton: { width: 46, height: 46, minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hudBack: { color: '#fff6c6', fontSize: 28, fontWeight: '900', marginTop: -2 },
  modeChip: { color: '#fff6c6', fontWeight: '900', fontSize: 14 },
  sign: { flex: 1, backgroundColor: '#38220f', borderWidth: 3, borderColor: '#e4bb40', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  signTitle: { color: '#ffffff', fontWeight: '900', fontSize: 14, letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  signClue: { color: '#fff6c6', fontWeight: '800', fontSize: 13, textAlign: 'center', marginTop: 2 },
  signMeta: { color: '#fadd74', fontWeight: '700', fontSize: 9, marginTop: 2, textAlign: 'center' },
  signNow: { color: '#ffe27f', fontWeight: '900', fontSize: 11, letterSpacing: 1.2, marginTop: 2 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clueRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  clueChip: { minWidth: 44, height: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#38220f', borderWidth: 2, borderColor: '#956b38', alignItems: 'center', justifyContent: 'center' },
  clueChipOn: { borderColor: '#e4bb40', backgroundColor: '#4c3515' },
  clueChipText: { color: '#fff6c6', fontWeight: '900', fontSize: 14 },
  wordRow: { alignItems: 'center', marginTop: 8, marginBottom: 4, minHeight: 44, zIndex: 6 },
  twistCob: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 240, zIndex: 11, overflow: 'visible' },
  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 6, zIndex: 12, overflow: 'visible' },
  trayHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  traySelected: { transform: [{ scale: 1.08 }] },
  trayArt: { position: 'absolute', width: 48, height: 48, resizeMode: 'contain' },
  trayLetter: { color: '#2e1a0c', fontWeight: '900', fontSize: 18, textShadowColor: 'rgba(255,236,150,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1.5, zIndex: 1 },
  dock: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, paddingHorizontal: 2, paddingTop: 6, zIndex: 10 },
  rotateHit: { width: 48, height: 48, minWidth: 44, minHeight: 44, borderRadius: 14, overflow: 'hidden' },
  rotateIcon: { width: 48, height: 48, resizeMode: 'cover' },
  rotateFlip: { transform: [{ scaleX: -1 }] },
  undoHit: { minWidth: 52, height: 48, borderRadius: 14, backgroundColor: '#4c3515', borderWidth: 3, borderColor: '#e5b72f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  undoOff: { opacity: 0.4 },
  undoText: { color: '#fff6c6', fontWeight: '900', fontSize: 11 },
  session: { flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(47,33,16,0.9)', borderWidth: 2, borderColor: '#e5b72f', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, minHeight: 44 },
  sessionText: { color: '#fff6c6', fontWeight: '900', fontSize: 12 },
  twistHelp: { color: '#fff2c0', fontWeight: '700', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
