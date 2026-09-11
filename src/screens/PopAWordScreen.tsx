import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { playGameSound } from '../audio/sounds';
import { DialogCopy, FarmDialog } from '../components/FarmDialog';
import { RaisedBoard } from '../components/RaisedBoard';
import {
  objectPose,
  popResults,
  resolvePop,
  setPopPaused,
  startPopSession,
  tapPop,
  targetLetter,
  tickPop,
  type PopObject,
  type PopRun,
  type PopTapResult,
} from '../game/popAWord';
import { useGameStore } from '../store/GameStore';

function formatClock(ms: number) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function PopAWordScreen() {
  const router = useRouter();
  const store = useGameStore();
  const reducedMotion = store.save.settings.reducedMotion;
  const hapticsOn = store.save.settings.haptics;
  const [session, setSession] = useState(0);
  const runRef = useRef<PopRun>(startPopSession(`pop-${session}`));
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [snap, setSnap] = useState(runRef.current);
  const [paused, setPaused] = useState(false);
  const [fieldSize, setFieldSize] = useState({ w: 0, h: 0 });
  const resolving = useRef(new Set<string>());

  const recordedBest = useRef(false);

  useEffect(() => {
    runRef.current = startPopSession(`pop-${Date.now()}`);
    setSnap(runRef.current);
    setPaused(false);
    resolving.current.clear();
    recordedBest.current = false;
  }, [session]);

  useEffect(() => {
    let last = Date.now();
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const now = Date.now();
      const dt = Math.min(33, now - last);
      last = now;
      if (!runRef.current.paused && runRef.current.phase !== 'results') {
        runRef.current = tickPop(runRef.current, dt);
        setSnap(runRef.current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [session]);

  const pulse = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsOn) Haptics.impactAsync(style).catch(() => {});
  };

  const finishResolve = (id: string) => {
    if (!resolving.current.has(id)) return;
    resolving.current.delete(id);
    runRef.current = resolvePop(runRef.current, id);
    setSnap(runRef.current);
  };

  const onTapObject = (object: PopObject) => {
    const pose = objectPose(object, runRef.current.elapsedMs);
    const result = tapPop(runRef.current, pose.x, pose.y);
    applyTap(result);
  };

  const applyTap = (result: PopTapResult) => {
    if (result.kind === 'none' || !result.object) return;
    runRef.current = result.run;
    setSnap(result.run);
    const id = result.object.id;
    resolving.current.add(id);
    if (result.kind === 'correct') {
      playGameSound(result.run.phase === 'wordClear' ? 'complete' : 'valid', 0.7);
      pulse(result.run.phase === 'wordClear' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    } else {
      playGameSound('invalid', 0.55);
      pulse(Haptics.ImpactFeedbackStyle.Light);
    }
    const wait = reducedMotion ? 80 : 320;
    const sessionAtTap = sessionRef.current;
    setTimeout(() => {
      if (sessionAtTap !== sessionRef.current) return;
      finishResolve(id);
    }, wait);
  };

  const pause = (value: boolean) => {
    setPaused(value);
    runRef.current = setPopPaused(runRef.current, value);
    setSnap(runRef.current);
  };

  const results = snap.phase === 'results' ? popResults(snap) : undefined;
  const best = store.save.fair.popAWordBest;

  useEffect(() => {
    if (!results || recordedBest.current) return;
    recordedBest.current = true;
    store.recordPopAWordBest({
      score: results.score,
      wordsCompleted: results.wordsCompleted,
      elapsedMs: results.elapsedMs,
      accuracy: results.accuracy,
      bestCombo: results.bestCombo,
      at: Date.now(),
    });
  }, [results, store]);
  const letter = targetLetter(snap);
  const slots = [...snap.currentWord];

  return (
    <ImageBackground source={wordMaizeAssets.backgrounds.homeFarmRestored} style={styles.bg} resizeMode="cover">
      <View pointerEvents="none" style={styles.scrim} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.hud}>
          <Pressable accessibilityRole="button" accessibilityLabel="Pause" onPress={() => pause(true)} style={styles.pause}>
            <View style={styles.pauseBars}><View style={styles.pauseBar} /><View style={styles.pauseBar} /></View>
          </Pressable>
          <RaisedBoard wood radius={14} depth={3} wrapStyle={styles.boardWrap} style={styles.board}>
            <View style={styles.slots}>
              {slots.map((slot, index) => (
                <View key={`${slot}-${index}`} style={[styles.tile, index < snap.targetIndex && styles.tileOn]}>
                  <Text style={styles.tileLetter}>{index < snap.targetIndex ? slot : ''}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.find}>FIND: {letter}</Text>
          </RaisedBoard>
          <View style={styles.timerChip}>
            <Text style={styles.timerIcon}>⏱</Text>
            <Text style={styles.timer}>{formatClock(snap.timeRemainingMs)}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{snap.score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Combo</Text>
            <Text style={styles.combo}>x{snap.combo}</Text>
          </View>
        </View>

        <View
          style={styles.field}
          onLayout={event => setFieldSize({ w: event.nativeEvent.layout.width, h: event.nativeEvent.layout.height })}
        >
          {fieldSize.w > 0 ? snap.activeObjects.map(object => {
            const pose = objectPose(object, snap.elapsedMs);
            const size = Math.max(58, 66 * pose.scale);
            const popping = object.flight === 'resolving';
            const isPopcorn = object.kind === 'popcorn' || popping;
            const source = isPopcorn
              ? wordMaizeAssets.fair.popAWord.popcorn
              : wordMaizeAssets.kernels.varieties.sweet.full;
            return (
              <Pressable
                key={object.id}
                accessibilityRole="button"
                accessibilityLabel={object.letter ? `Kernel ${object.letter}` : 'Popcorn'}
                onPress={() => onTapObject(object)}
                style={[
                  styles.kernel,
                  {
                    width: size,
                    height: size,
                    left: pose.x * fieldSize.w - size / 2,
                    top: pose.y * fieldSize.h - size / 2,
                    transform: [{ rotate: `${pose.rotation}deg` }, { scale: popping && !reducedMotion ? 1.18 : 1 }],
                  },
                ]}
                hitSlop={18}
              >
                <Image source={source} style={styles.kernelArt} />
                {object.letter && !isPopcorn ? <Text style={styles.kernelLetter}>{object.letter}</Text> : null}
              </Pressable>
            );
          }) : null}
          {snap.phase === 'wordClear' ? (
            <View pointerEvents="none" style={styles.completeBanner}>
              <Text style={styles.completeText}>WORD COMPLETE!</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.launcher} pointerEvents="none">
          <Image source={wordMaizeAssets.fair.popAWord.popcorn} style={styles.spillLeft} />
          <Image source={wordMaizeAssets.fair.popAWord.popcorn} style={styles.spillRight} />
          <Image source={wordMaizeAssets.fair.popAWord.bucket} style={styles.bucketArt} />
        </View>
      </SafeAreaView>

      <FarmDialog
        visible={paused && snap.phase !== 'results'}
        title="Paused"
        onClose={() => pause(false)}
        primary={{ label: 'RESUME', onPress: () => pause(false) }}
        actions={[{ label: 'BACK TO FAIR', onPress: () => router.back(), tone: 'slate' }]}
      >
        <DialogCopy>Pop the lettered kernels that match FIND. Plain popcorn is only a distraction.</DialogCopy>
      </FarmDialog>

      <FarmDialog
        visible={!!results}
        title="Pop-a-Word Complete"
        primary={{ label: 'PLAY AGAIN', onPress: () => setSession(value => value + 1), tone: 'gold' }}
        actions={[{ label: 'BACK TO FAIR', onPress: () => router.back(), tone: 'slate' }]}
      >
        {results ? (
          <>
            <DialogCopy>Score {results.score}{best ? ` · Best ${Math.max(best.score, results.score)}` : ''}</DialogCopy>
            <DialogCopy>Words {results.wordsCompleted}{best ? ` · Best ${Math.max(best.wordsCompleted, results.wordsCompleted)}` : ''}</DialogCopy>
            <DialogCopy>Time {formatClock(results.elapsedMs)}{best?.elapsedMs ? ` · Best run ${formatClock(best.elapsedMs)}` : ''}</DialogCopy>
            <DialogCopy>Best Combo x{Math.max(1, results.bestCombo)}</DialogCopy>
            <DialogCopy>Accuracy {Math.round(results.accuracy * 100)}%</DialogCopy>
          </>
        ) : null}
      </FarmDialog>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#16381e' },
  scrim: { position: 'absolute', inset: 0, backgroundColor: 'rgba(8, 28, 20, 0.28)' },
  safe: { flex: 1 },
  hud: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 10, paddingTop: 4, gap: 8 },
  pause: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3a2410',
    borderWidth: 2,
    borderColor: '#c9a15a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBars: { flexDirection: 'row', gap: 4 },
  pauseBar: { width: 5, height: 16, borderRadius: 1, backgroundColor: '#fff6c6' },
  boardWrap: { flex: 1 },
  board: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  slots: { flexDirection: 'row', gap: 4, justifyContent: 'center', flexWrap: 'wrap' },
  tile: {
    minWidth: 28,
    height: 34,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#fff8dc',
    borderWidth: 2,
    borderColor: '#c9a15a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: { backgroundColor: '#ffe9a0' },
  tileLetter: { color: '#3d2a14', fontWeight: '900', fontSize: 16 },
  find: { color: '#fff6c6', fontWeight: '900', fontSize: 13, marginTop: 6, letterSpacing: 1 },
  timerChip: {
    minWidth: 64,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3a2410',
    borderWidth: 2,
    borderColor: '#c9a15a',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
  },
  timerIcon: { fontSize: 12 },
  timer: { color: '#fff6c6', fontWeight: '900', fontSize: 14 },
  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  statCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(58, 36, 16, 0.88)',
    borderWidth: 2,
    borderColor: '#c9a15a',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statLabel: { color: '#ead9a7', fontWeight: '800', fontSize: 10 },
  statValue: { color: '#ffe36c', fontWeight: '900', fontSize: 18 },
  combo: { color: '#fff6c6', fontWeight: '900', fontSize: 18 },
  field: { flex: 1, marginTop: 6 },
  kernel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  kernelArt: { width: '100%', height: '100%', resizeMode: 'contain' },
  kernelLetter: {
    position: 'absolute',
    color: '#3d2a14',
    fontWeight: '900',
    fontSize: 22,
    textShadowColor: '#fff8dc',
    textShadowRadius: 3,
  },
  completeBanner: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    left: 24,
    right: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(58, 36, 16, 0.92)',
    borderWidth: 2,
    borderColor: '#f7d85a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeText: { color: '#fff6c6', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  launcher: { height: '13%', minHeight: 88, maxHeight: 118, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  bucketArt: { width: 168, height: 168, resizeMode: 'contain', marginBottom: -28 },
  spillLeft: { position: 'absolute', left: '28%', bottom: 78, width: 42, height: 42, resizeMode: 'contain', transform: [{ rotate: '-18deg' }] },
  spillRight: { position: 'absolute', right: '27%', bottom: 82, width: 38, height: 38, resizeMode: 'contain', transform: [{ rotate: '16deg' }] },
});
