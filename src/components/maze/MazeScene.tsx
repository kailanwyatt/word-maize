import { memo, useEffect, useMemo, Fragment } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { mazeAssets } from '../../../assets/word-maize/maze/assets';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { farmerWalkFrame, liveCobs, MAZE_RENDER, type MazeCob, type MazePuzzle, type MazeRun } from '../../game/maze';
import { remainingMazeFinds } from '../../game/mazeFinds';
import { detailVisible, tileVisible } from '../../game/mazeVisibility';
import { landmarkArtPlacements } from './sceneLayout';

const TILE = MAZE_RENDER.tile;
type Props = {
  puzzle: MazePuzzle; run: MazeRun; selectedId?: string; revealedIds?: string[];
  originX: number; originY: number; viewportWidth: number; viewportHeight: number;
  moving: boolean; reducedMotion: boolean; reducedMist?: boolean;
  shakeCobId?: string; shakeNonce?: number;
  mood?: 'sunny' | 'fog';
};

export function MazeScene({ puzzle, run, selectedId, revealedIds, originX, originY, viewportWidth, viewportHeight, moving, reducedMotion, reducedMist, shakeCobId, shakeNonce, mood = 'sunny' }: Props) {
  const landmarks = useMemo(() => landmarkArtPlacements(puzzle), [puzzle]);
  const props = useMemo(() => new Set(landmarks.map(item => `${item.artCell.col},${item.artCell.row}`)), [landmarks]);
  const tiles = useMemo(() => puzzle.terrain.flatMap((row, r) => row.map((terrain, col) => ({ terrain, col, row: r }))), [puzzle]);
  const cobs = liveCobs(puzzle, run);
  const onScreen = (col: number, row: number) => col * TILE + originX > -2 * TILE && col * TILE + originX < viewportWidth + TILE && row * TILE + originY > -2 * TILE && row * TILE + originY < viewportHeight + TILE;
  const shown = (col: number, row: number) => onScreen(col, row) && tileVisible(puzzle, run, col, row, reducedMist);
  const ghosts = useMemo(() => {
    const pad = 8;
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
  const farmerArt = mazeAssets.farmer[run.facing];
  const walkFrame = farmerWalkFrame(moving, reducedMotion, run.traveledDistance);
  const farmerBox = MAZE_RENDER.farmerSprite;
  const wildlifeArt = run.wildlife?.kind === 'squirrel' ? wordMaizeAssets.obstacles.squirrel : run.wildlife?.kind === 'caterpillar' ? wordMaizeAssets.obstacles.caterpillar : wordMaizeAssets.obstacles.crow;
  const wildlifeCob = cobs.find(cob => cob.id === run.wildlife?.cobId);
  return <View pointerEvents="none" style={[styles.world, { width: puzzle.cols * TILE, height: puzzle.rows * TILE, left: originX, top: originY, backgroundColor: mood === 'fog' ? '#243628' : '#3f6f2c', overflow: 'visible' }]}>
    {tiles.filter(tile => onScreen(tile.col, tile.row)).map(tile => <GroundTile key={`${tile.col},${tile.row}`} {...tile} veil={1} fog={mood === 'fog'} />)}
    {ghosts.map(cell => (
      <Fragment key={`ghost-${cell.col},${cell.row}`}>
        <View style={[styles.tile, { left: cell.col * TILE, top: cell.row * TILE, backgroundColor: mood === 'fog' ? '#4a7a3c' : '#45803a', zIndex: 0 }]} />
        <Foliage col={cell.col} row={cell.row} veil={0.82} ghost />
      </Fragment>
    ))}
    {tiles.filter(tile => tile.terrain === 'wall' && onScreen(tile.col, tile.row) && !props.has(`${tile.col},${tile.row}`) && !mowed.has(`${tile.col},${tile.row}`) && !(cobWalls.has(`${tile.col},${tile.row}`) && shown(tile.col, tile.row))).map(tile => (
      <Foliage key={`leaf-${tile.col},${tile.row}`} col={tile.col} row={tile.row} veil={1} />
    ))}
    {landmarks.filter(item => shown(item.artCell.col, item.artCell.row)).map(item => {
      const key = item.id === 'west-loop' ? 'hay' : item.id === 'east-loop' ? 'cart' : item.id as keyof typeof mazeAssets.landmarks;
      return <View key={item.id} accessibilityLabel={item.name} style={[styles.landmark, { left: item.artCell.col * TILE, top: item.artCell.row * TILE - 5, zIndex: item.artCell.row * 10 + 3, opacity: detailVisible(puzzle, run, item.artCell.col, item.artCell.row, reducedMist) ? 1 : 0.45 }]}>
        <Image source={mazeAssets.landmarks[key] ?? mazeAssets.landmarks.well} style={styles.landmarkArt} resizeMode="contain" fadeDuration={0} />
      </View>;
    })}
    {run.mowedKeys.filter(key => {
      const [col, row] = key.split(',').map(Number);
      return shown(col, row);
    }).map(key => {
      const [col, row] = key.split(',').map(Number);
      return <View key={`mowed-${key}`} style={[styles.plant, { left: col * TILE, top: row * TILE - 22, zIndex: row * 10 + 4 }]}>
        <Image source={mazeAssets.plants.empty} style={styles.plantArt} resizeMode="contain" fadeDuration={0} />
      </View>;
    })}
    {run.vacated.filter(cell => shown(cell.col, cell.row)).map(cell => (
      <View key={`vacant-${cell.col}-${cell.row}`} style={[styles.plant, { left: cell.col * TILE, top: cell.row * TILE - 22, zIndex: cell.row * 10 + 4 }]}>
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
    {wildlifeCob && shown(wildlifeCob.wall.col, wildlifeCob.wall.row) ? (
      <Image source={wildlifeArt} fadeDuration={0} style={[styles.critter, { left: wildlifeCob.wall.col * TILE + 4, top: wildlifeCob.wall.row * TILE - 22, zIndex: wildlifeCob.wall.row * 10 + 6 }]} />
    ) : null}
    {remainingMazeFinds(puzzle, run).filter(find => shown(find.cell.col, find.cell.row)).map(find => (
      <View key={find.id} accessibilityLabel="Barn crate" style={[styles.crate, { left: find.cell.col * TILE + 8, top: find.cell.row * TILE + 8, zIndex: find.cell.row * 10 + 5 }]}>
        <View style={styles.crateFace} />
      </View>
    ))}
    <View accessibilityLabel={`Farmer facing ${run.facing}`} style={[styles.farmer, { left: run.player.x * TILE - farmerBox.width / 2, top: run.player.y * TILE - (farmerBox.height - farmerBox.footOffsetY), zIndex: Math.floor(run.player.y) * 10 + 12 }]}>
      <View style={styles.shadow} />
      <Image source={farmerArt.idle} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 'idle' ? 1 : 0 }]} />
      <Image source={farmerArt.walk[0]} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 0 ? 1 : 0 }]} />
      <Image source={farmerArt.walk[1]} fadeDuration={0} resizeMode="contain" style={[styles.farmerArt, { opacity: walkFrame === 1 ? 1 : 0 }]} />
    </View>
    {cobs.filter(cob => shown(cob.wall.col, cob.wall.row) && revealedIds?.includes(cob.id) && !run.harvestedCobIds.includes(cob.id)).map(cob => (
      <View
        key={`letter-${cob.id}`}
        pointerEvents="none"
        style={[styles.letterFloat, { left: cob.wall.col * TILE + 10, top: cob.wall.row * TILE - 28, zIndex: cob.wall.row * 10 + 40 }]}
      >
        <Text style={styles.letter}>{cob.letter}</Text>
      </View>
    ))}
    <View pointerEvents="none" style={styles.preload} accessibilityElementsHidden>
      {(['up', 'down', 'left', 'right'] as const).flatMap(dir => [
        <Image key={`${dir}-idle`} source={mazeAssets.farmer[dir].idle} fadeDuration={0} style={styles.preloadArt} />,
        <Image key={`${dir}-a`} source={mazeAssets.farmer[dir].walk[0]} fadeDuration={0} style={styles.preloadArt} />,
        <Image key={`${dir}-b`} source={mazeAssets.farmer[dir].walk[1]} fadeDuration={0} style={styles.preloadArt} />,
      ])}
    </View>
  </View>;
}
const WALLS = [mazeAssets.wall, mazeAssets.wallAlt, mazeAssets.wallDense];
const GroundTile = memo(function GroundTile({ col, row, veil, fog }: { col: number; row: number; terrain: string; veil: number; fog: boolean }) {
  const warm = (col + row) % 3 === 0;
  return <View style={[styles.tile, { left: col * TILE, top: row * TILE, backgroundColor: fog ? '#8a6a32' : warm ? '#d39a3c' : '#c9872c', opacity: veil }]}>
    <Image source={mazeAssets.dirt} fadeDuration={0} style={styles.groundArt} />
  </View>;
});
const Foliage = memo(function Foliage({ col, row, veil, ghost }: { col: number; row: number; veil: number; ghost?: boolean }) {
  const variant = (col * 5 + row * 3) % 3;
  const flipped = (col * 3 + row) % 2 === 1;
  const scale = 0.9 + (variant % 3) * 0.07;
  const dx = ((col * 7 + row * 2) % 7) - 3;
  return (
    <View style={[styles.foliageWrap, { left: col * TILE - 10 + dx, top: row * TILE - 20, zIndex: ghost ? 0 : row * 10 + 1, opacity: veil }]}>
      {!ghost ? <View style={styles.foliageShadow} /> : null}
      <Image source={WALLS[variant]} fadeDuration={0} resizeMode="stretch" style={[styles.foliage, { transform: [{ scale }, { scaleX: flipped ? -1 : 1 }] }]} />
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
    if (!harvested || reducedMotion) return;
    pop.value = withSequence(withTiming(1.14, { duration: 90 }), withTiming(1, { duration: 160 }));
  }, [harvested, pop, reducedMotion]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }, { scale: pop.value }, { rotateZ: `${shakeX.value * 0.7}deg` }] }));
  const closed = !visited && !revealed && !harvested;
  return <Animated.View accessibilityLabel={harvested ? 'Harvested plant' : revealed ? `Revealed ${revealed}` : visited ? 'Visited plant' : 'Letter plant'} style={[styles.plant, { left: cob.wall.col * TILE, top: cob.wall.row * TILE - 22, zIndex: cob.wall.row * 10 + 4 }, shakeStyle]}>
    <View style={styles.plantShadow} />
    {(selected || helped) && !harvested && <View style={[styles.selection, helped && styles.helpRing]} />}
    <Image source={source} style={[styles.plantArt, closed && styles.plantArtClosed, dim && styles.plantArtDim]} resizeMode="contain" fadeDuration={0} />
  </Animated.View>;
});
const styles = StyleSheet.create({
  world: { position: 'absolute' },
  tile: { position: 'absolute', width: TILE, height: TILE },
  groundArt: { width: TILE, height: TILE },
  foliageWrap: { position: 'absolute', width: 68, height: 76 },
  foliage: { width: 68, height: 76 },
  foliageShadow: { position: 'absolute', bottom: 4, left: 16, width: 34, height: 10, borderRadius: 8, backgroundColor: '#2a1c0844' },
  landmark: { position: 'absolute', width: TILE, height: TILE + 5 },
  landmarkArt: { width: '100%', height: '100%' },
  plant: { position: 'absolute', width: 48, height: 70, alignItems: 'center' },
  plantArt: { position: 'absolute', left: -16, width: 80, height: 80 },
  plantArtClosed: { transform: [{ scale: 1.04 }] },
  plantArtDim: { opacity: 0.72 },
  plantShadow: { position: 'absolute', bottom: 4, left: 8, width: 32, height: 10, borderRadius: 8, backgroundColor: '#2a1c0855' },
  selection: { position: 'absolute', bottom: 6, left: 2, width: 44, height: 16, borderRadius: 20, borderWidth: 2, borderColor: '#fff9c7', backgroundColor: '#ead07166' },
  helpRing: { borderColor: '#7ee04a', backgroundColor: '#7ee04a55' },
  letterFloat: {
    position: 'absolute',
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#3a2410',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 20,
    textAlign: 'center',
    textShadowColor: '#fff6d8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  farmer: { position: 'absolute', width: MAZE_RENDER.farmerSprite.width, height: MAZE_RENDER.farmerSprite.height },
  farmerArt: {
    position: 'absolute',
    left: (MAZE_RENDER.farmerSprite.width - MAZE_RENDER.farmerSprite.art) / 2,
    top: MAZE_RENDER.farmerSprite.height - MAZE_RENDER.farmerSprite.art,
    width: MAZE_RENDER.farmerSprite.art,
    height: MAZE_RENDER.farmerSprite.art,
  },
  shadow: { position: 'absolute', bottom: 0, left: 9, width: 22, height: 9, borderRadius: 20, backgroundColor: '#32271344' },
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  preloadArt: { width: 1, height: 1 },
  critter: { position: 'absolute', width: 28, height: 28, resizeMode: 'contain' },
  crate: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  crateFace: { width: 22, height: 18, borderRadius: 4, backgroundColor: '#c9842c', borderWidth: 2, borderColor: '#ffe08a' },
});
