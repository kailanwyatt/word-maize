import { memo, useEffect, useMemo, Fragment } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import type { MazeFarmerId } from '../../data/mazeFarmers';
import { farmerWalkFrame, liveCobs, MAZE_RENDER, type MazeCob, type MazePuzzle, type MazeRun } from '../../game/maze';
import { remainingMazeFinds } from '../../game/mazeFinds';
import { detailVisible, tileVisible } from '../../game/mazeVisibility';
import { landmarkArtPlacements } from './sceneLayout';
import { MazeToolFxLayer, type MazeToolFx } from './MazeToolFx';

const TILE = MAZE_RENDER.tile;
const noop = () => {};
type Props = {
  puzzle: MazePuzzle; run: MazeRun; selectedId?: string; revealedIds?: string[];
  originX: number; originY: number; viewportWidth: number; viewportHeight: number;
  moving: boolean; reducedMotion: boolean; reducedMist?: boolean;
  shakeCobId?: string; shakeNonce?: number;
  mood?: 'sunny' | 'fog';
  toolFx?: MazeToolFx | null;
  onToolFxDone?: () => void;
  farmerId?: MazeFarmerId;
};

export function MazeScene({ puzzle, run, selectedId, revealedIds, originX, originY, viewportWidth, viewportHeight, moving, reducedMotion, reducedMist, shakeCobId, shakeNonce, mood = 'sunny', toolFx = null, onToolFxDone, farmerId = 'may' }: Props) {
  const landmarks = useMemo(() => landmarkArtPlacements(puzzle), [puzzle]);
  const props = useMemo(() => new Set(landmarks.map(item => `${item.artCell.col},${item.artCell.row}`)), [landmarks]);
  const tiles = useMemo(() => puzzle.terrain.flatMap((row, r) => row.map((terrain, col) => ({ terrain, col, row: r }))), [puzzle]);
  const cobs = liveCobs(puzzle, run);
  const onScreen = (col: number, row: number) => col * TILE + originX > -2 * TILE && col * TILE + originX < viewportWidth + TILE && row * TILE + originY > -2 * TILE && row * TILE + originY < viewportHeight + TILE;
  const shown = (col: number, row: number) => onScreen(col, row) && tileVisible(puzzle, run, col, row, reducedMist);
  const ghosts = useMemo(() => {
    const pad = Math.max(10, Math.ceil(Math.max(viewportWidth, viewportHeight) / TILE) + 2);
    const cells: { col: number; row: number }[] = [];
    for (let row = -pad; row < puzzle.rows + pad; row++) {
      for (let col = -pad; col < puzzle.cols + pad; col++) {
        if (col * TILE + originX <= -2 * TILE || col * TILE + originX >= viewportWidth + TILE || row * TILE + originY <= -2 * TILE || row * TILE + originY >= viewportHeight + TILE) continue;
        const inside = col >= 0 && row >= 0 && col < puzzle.cols && row < puzzle.rows;
        if (inside) continue;
        cells.push({ col, row });
      }
    }
    return cells;
  }, [originX, originY, puzzle.cols, puzzle.rows, viewportHeight, viewportWidth]);
  const cobWalls = useMemo(() => new Set(cobs.map(cob => `${cob.wall.col},${cob.wall.row}`)), [cobs]);
  const mowed = new Set(run.mowedKeys);
  const farmerPack = mazeAssets.farmers[farmerId];
  const farmerArt = farmerPack[run.facing];
  const walkFrame = farmerWalkFrame(moving, reducedMotion, run.traveledDistance);
  const farmerBox = MAZE_RENDER.farmerSprite;
  return <View pointerEvents="none" style={[styles.world, { width: puzzle.cols * TILE, height: puzzle.rows * TILE, left: originX, top: originY, backgroundColor: mood === 'fog' ? '#8a6a32' : '#c9872c', overflow: 'visible' }]}>
    {tiles.filter(tile => onScreen(tile.col, tile.row)).map(tile => <GroundTile key={`${tile.col},${tile.row}`} {...tile} veil={1} fog={mood === 'fog'} />)}
    {ghosts.map(cell => (
      <Fragment key={`ghost-${cell.col},${cell.row}`}>
        <GroundTile col={cell.col} row={cell.row} terrain="wall" veil={1} fog={mood === 'fog'} />
        <Foliage col={cell.col} row={cell.row} veil={0.82} ghost />
      </Fragment>
    ))}
    {tiles.filter(tile => tile.terrain === 'wall' && onScreen(tile.col, tile.row) && !props.has(`${tile.col},${tile.row}`) && !mowed.has(`${tile.col},${tile.row}`) && !(cobWalls.has(`${tile.col},${tile.row}`) && shown(tile.col, tile.row))).map(tile => (
      <Foliage key={`leaf-${tile.col},${tile.row}`} col={tile.col} row={tile.row} veil={1} />
    ))}
    {landmarks.filter(item => shown(item.artCell.col, item.artCell.row)).map(item => {
      const key = landmarkArtId(item.id);
      return <View key={item.id} accessibilityLabel={item.name} style={[styles.landmark, { left: item.artCell.col * TILE - 6, top: item.artCell.row * TILE - 18, zIndex: item.artCell.row * 10 + 3, opacity: detailVisible(puzzle, run, item.artCell.col, item.artCell.row, reducedMist) ? 1 : 0.45 }]}>
        <Image source={mazeAssets.landmarks[key]} style={styles.landmarkArt} resizeMode="contain" fadeDuration={0} />
      </View>;
    })}
    {run.mowedKeys.filter(key => {
      const [col, row] = key.split(',').map(Number);
      return shown(col, row);
    }).map(key => {
      const [col, row] = key.split(',').map(Number);
      return <View key={`mowed-${key}`} style={[styles.plant, { left: col * TILE, top: row * TILE - 28, zIndex: row * 10 + 4 }]}>
        <Image source={mazeAssets.plants.empty} style={styles.plantArt} resizeMode="contain" fadeDuration={0} />
      </View>;
    })}
    {run.vacated.filter(cell => shown(cell.col, cell.row)).map(cell => (
      <View key={`vacant-${cell.col}-${cell.row}`} style={[styles.plant, { left: cell.col * TILE, top: cell.row * TILE - 28, zIndex: cell.row * 10 + 4 }]}>
        <Image source={mazeAssets.plants.empty} style={styles.plantArt} resizeMode="contain" fadeDuration={0} />
      </View>
    ))}
    {cobs.filter(cob => shown(cob.wall.col, cob.wall.row)).map(cob => {
      const revealed = revealedIds?.includes(cob.id) ? cob.letter : null;
      const visited = run.inspectedCobIds.includes(cob.id);
      const harvested = run.harvestedCobIds.includes(cob.id);
      const helped = run.helpMarker?.cobId === cob.id;
      const shaking = shakeCobId === cob.id ? shakeNonce : 0;
      return <Plant key={cob.id} cob={cob} visited={visited} harvested={harvested} revealed={revealed} selected={selectedId === cob.id} helped={helped} dim={!detailVisible(puzzle, run, cob.wall.col, cob.wall.row, reducedMist)} shakeNonce={shaking} reducedMotion={reducedMotion} />;
    })}
    {remainingMazeFinds(puzzle, run).filter(find => shown(find.cell.col, find.cell.row)).map(find => (
      <PathCrate key={find.id} col={find.cell.col} row={find.cell.row} dim={!detailVisible(puzzle, run, find.cell.col, find.cell.row, reducedMist)} reducedMotion={reducedMotion} />
    ))}
    <View accessibilityLabel={`Farmer facing ${run.facing}`} style={[styles.farmer, { left: run.player.x * TILE - farmerBox.width / 2, top: run.player.y * TILE - (farmerBox.height - farmerBox.footOffsetY), zIndex: Math.floor(run.player.y) * 10 + 12, opacity: toolFx?.kind === 'tractor' ? 0 : 1 }]}>
      <View style={styles.shadow} />
      <Image source={farmerArt.idle} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 'idle' ? 1 : 0 }]} />
      <Image source={farmerArt.walk[0]} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 0 ? 1 : 0 }]} />
      <Image source={farmerArt.walk[1]} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 1 ? 1 : 0 }]} />
    </View>
    <MazeToolFxLayer fx={toolFx} reducedMotion={reducedMotion} onDone={onToolFxDone ?? noop} />
    <View pointerEvents="none" style={styles.preload} accessibilityElementsHidden>
      {(['up', 'down', 'left', 'right'] as const).flatMap(dir => [
        <Image key={`${dir}-idle`} source={farmerPack[dir].idle} fadeDuration={0} style={styles.preloadArt} />,
        <Image key={`${dir}-a`} source={farmerPack[dir].walk[0]} fadeDuration={0} style={styles.preloadArt} />,
        <Image key={`${dir}-b`} source={farmerPack[dir].walk[1]} fadeDuration={0} style={styles.preloadArt} />,
      ])}
    </View>
  </View>;
}
const WALLS = mazeAssets.walls;
const FOLIAGE_W = MAZE_RENDER.wallSprite.width;
const FOLIAGE_H = MAZE_RENDER.wallSprite.height;
function landmarkArtId(id: string): keyof typeof mazeAssets.landmarks {
  if (id === 'west-loop') return 'hay';
  if (id === 'east-loop') return 'cart';
  if (id === 'sunflower') return 'sunflowers';
  if (id in mazeAssets.landmarks) return id as keyof typeof mazeAssets.landmarks;
  return 'well';
}
const GroundTile = memo(function GroundTile({ col, row, terrain, veil, fog }: { col: number; row: number; terrain: string; veil: number; fog: boolean }) {
  const warm = (col + row) % 3 === 0;
  const garnish = terrain === 'path' ? (col * 19 + row * 37) % 13 : -1;
  return <View style={[styles.tile, { left: col * TILE, top: row * TILE, backgroundColor: fog ? '#8a6a32' : warm ? '#d39a3c' : '#c9872c', opacity: veil }]}>
    <Image source={mazeAssets.dirt} fadeDuration={0} style={styles.groundArt} />
    {garnish === 0 ? <View style={[styles.speckPebble, { left: 18 + (col % 3) * 8, top: 28 + (row % 2) * 6 }]} /> : null}
    {garnish === 1 ? <View style={[styles.speckWeed, { left: 22 + (row % 3) * 10, top: 16 }]} /> : null}
    {garnish === 2 ? (
      <>
        <View style={[styles.speckPrint, { left: 16, top: 24 }]} />
        <View style={[styles.speckPrint, { left: 28, top: 30 }]} />
      </>
    ) : null}
  </View>;
});
const Foliage = memo(function Foliage({ col, row, veil, ghost }: { col: number; row: number; veil: number; ghost?: boolean }) {
  const flipped = (col * 3 + row) % 2 === 1;
  const source = WALLS[(col * 7 + row * 13) % WALLS.length];
  return (
    <View style={[styles.foliageWrap, { left: col * TILE - (FOLIAGE_W - TILE) / 2, top: row * TILE - (FOLIAGE_H - TILE) + 6, zIndex: row * 10 + 1, opacity: veil }]}>
      {!ghost ? <View style={styles.foliageShadow} /> : null}
      <Image source={source} fadeDuration={0} resizeMode="contain" style={[styles.foliage, flipped && styles.foliageFlip]} />
    </View>
  );
});
const Plant = memo(function Plant({ cob, visited, harvested, revealed, selected, helped, dim, shakeNonce, reducedMotion }: { cob: MazeCob; visited: boolean; harvested: boolean; revealed: string | null; selected: boolean; helped: boolean; dim: boolean; shakeNonce?: number; reducedMotion: boolean }) {
  const source = harvested ? mazeAssets.plants.empty : revealed ? mazeAssets.plants.open : visited ? mazeAssets.plants.inspected : mazeAssets.plants.closed;
  const shakeX = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!shakeNonce || reducedMotion) return;
    const snap = { duration: 42, easing: Easing.linear };
    shakeX.value = withSequence(
      withTiming(-8, snap),
      withTiming(8, snap),
      withTiming(-6, snap),
      withTiming(5, snap),
      withTiming(0, { duration: 48, easing: Easing.linear }),
    );
  }, [reducedMotion, shakeNonce, shakeX]);
  useEffect(() => {
    if (reducedMotion) return;
    if (revealed) {
      pop.value = withSequence(withTiming(1.12, { duration: 90 }), withTiming(1, { duration: 180 }));
      return;
    }
    if (!harvested) return;
    pop.value = withSequence(withTiming(1.14, { duration: 90 }), withTiming(1, { duration: 160 }));
  }, [harvested, pop, reducedMotion, revealed]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { scale: pop.value }, { rotateZ: `${shakeX.value * 0.7}deg` }] }));
  const closed = !visited && !revealed && !harvested;
  return <Animated.View accessibilityLabel={harvested ? 'Harvested plant' : revealed ? `Revealed ${revealed}` : visited ? 'Visited plant' : 'Letter plant'} style={[styles.plant, { left: cob.wall.col * TILE, top: cob.wall.row * TILE - 28, zIndex: cob.wall.row * 10 + 4 }, shakeStyle]}>
    <View style={styles.plantShadow} />
    {(selected || helped) && !harvested && <View style={[styles.selection, helped && styles.helpRing]} />}
    <Image source={source} style={[styles.plantArt, closed && styles.plantArtClosed, dim && styles.plantArtDim]} resizeMode="contain" fadeDuration={0} />
    {revealed && !harvested ? <PeekLetter letter={revealed} /> : null}
  </Animated.View>;
});
const PEEK_OUTLINE = [
  { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 },
  { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 },
];
function PeekLetter({ letter }: { letter: string }) {
  return (
    <View pointerEvents="none" style={styles.cobLetterWrap}>
      {PEEK_OUTLINE.map(offset => (
        <Text key={`${offset.x},${offset.y}`} style={[styles.cobLetterOutline, { transform: [{ translateX: offset.x }, { translateY: offset.y }] }]}>{letter}</Text>
      ))}
      <Text style={styles.cobLetter}>{letter}</Text>
    </View>
  );
}
const CRATE = Math.round(TILE * 0.92);
const PathCrate = memo(function PathCrate({ col, row, dim, reducedMotion }: { col: number; row: number; dim: boolean; reducedMotion: boolean }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    bob.value = withRepeat(withSequence(
      withTiming(-5, { duration: 720, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 720, easing: Easing.inOut(Easing.quad) }),
    ), -1, true);
  }, [bob, reducedMotion]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View accessibilityLabel="Barn crate" style={[styles.crate, { left: col * TILE + (TILE - CRATE) / 2, top: row * TILE - 10, zIndex: row * 10 + 5, opacity: dim ? 0.72 : 1 }, bobStyle]}>
      <View style={styles.crateGlow} />
      <Image source={mazeAssets.crate} style={styles.crateArt} resizeMode="contain" fadeDuration={0} />
    </Animated.View>
  );
});
const styles = StyleSheet.create({
  world: { position: 'absolute' },
  tile: { position: 'absolute', width: TILE, height: TILE },
  groundArt: { width: TILE, height: TILE },
  foliageWrap: { position: 'absolute', width: FOLIAGE_W, height: FOLIAGE_H },
  foliage: { width: FOLIAGE_W, height: FOLIAGE_H },
  foliageFlip: { transform: [{ scaleX: -1 }] },
  foliageShadow: { position: 'absolute', bottom: 8, left: FOLIAGE_W * 0.22, width: FOLIAGE_W * 0.56, height: 14, borderRadius: 10, backgroundColor: '#2a1c0855' },
  landmark: { position: 'absolute', width: TILE + 12, height: TILE + 24 },
  landmarkArt: { width: '100%', height: '100%' },
  plant: { position: 'absolute', width: TILE, height: MAZE_RENDER.plantSprite.height, alignItems: 'center' },
  plantArt: { position: 'absolute', left: (TILE - MAZE_RENDER.plantSprite.art) / 2, width: MAZE_RENDER.plantSprite.art, height: MAZE_RENDER.plantSprite.art },
  plantArtClosed: { transform: [{ scale: 1.04 }] },
  plantArtDim: { opacity: 0.72 },
  plantShadow: { position: 'absolute', bottom: 4, left: TILE * 0.18, width: TILE * 0.64, height: 12, borderRadius: 8, backgroundColor: '#2a1c0855' },
  selection: { position: 'absolute', bottom: 6, left: 4, width: TILE - 8, height: 18, borderRadius: 20, borderWidth: 2, borderColor: '#fff9c7', backgroundColor: '#ead07166' },
  helpRing: { borderColor: '#7ee04a', backgroundColor: '#7ee04a55' },
  cobLetterWrap: { position: 'absolute', top: 30, width: TILE, height: 36, alignItems: 'center', justifyContent: 'center' },
  cobLetterOutline: {
    position: 'absolute',
    width: TILE,
    color: '#fff8d4',
    fontWeight: '900',
    fontSize: 31,
    lineHeight: 34,
    textAlign: 'center',
    includeFontPadding: false,
  },
  cobLetter: {
    width: TILE,
    color: '#3b1a08',
    fontWeight: '900',
    fontSize: 31,
    lineHeight: 34,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: '#fff6c6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  speckPebble: { position: 'absolute', width: 7, height: 5, borderRadius: 3, backgroundColor: '#8a6a3288' },
  speckWeed: { position: 'absolute', width: 3, height: 9, borderRadius: 2, backgroundColor: '#4a7a2888' },
  speckPrint: { position: 'absolute', width: 8, height: 4, borderRadius: 4, backgroundColor: '#5a3a1488', transform: [{ rotate: '-18deg' }] },
  farmer: { position: 'absolute', width: MAZE_RENDER.farmerSprite.width, height: MAZE_RENDER.farmerSprite.height },
  farmerArt: {
    position: 'absolute',
    left: (MAZE_RENDER.farmerSprite.width - MAZE_RENDER.farmerSprite.art) / 2,
    top: MAZE_RENDER.farmerSprite.height - MAZE_RENDER.farmerSprite.art,
    width: MAZE_RENDER.farmerSprite.art,
    height: MAZE_RENDER.farmerSprite.art,
  },
  shadow: { position: 'absolute', bottom: 0, left: 8, width: 34, height: 12, borderRadius: 20, backgroundColor: '#1a1208aa' },
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  preloadArt: { width: 1, height: 1 },
  crate: { position: 'absolute', width: CRATE, height: CRATE, alignItems: 'center', justifyContent: 'flex-end' },
  crateGlow: { position: 'absolute', bottom: 4, width: CRATE * 0.72, height: 14, borderRadius: 10, backgroundColor: '#ffe08a66' },
  crateArt: { width: CRATE, height: CRATE },
});
