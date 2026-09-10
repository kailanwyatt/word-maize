import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { wordMaizeAssets } from '../../../assets/word-maize/assets';
import { TOOL_INFO } from '../../data/shop';
import { MAZE_TOOL_IDS, type ToolId } from '../../game/types';

export function MazeToolBelt({
  counts, disabled, shopLocked, flashTool, onUse, onEmpty, onShop,
}: {
  counts: Record<ToolId, number>;
  disabled?: boolean;
  shopLocked?: boolean;
  flashTool?: ToolId | null;
  onUse: (tool: ToolId) => void;
  onEmpty: (tool: ToolId) => void;
  onShop: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.col}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Farm Store"
        disabled={shopLocked}
        onPress={onShop}
        style={[styles.btn, styles.shop, shopLocked && styles.empty]}
      >
        <Image source={wordMaizeAssets.ui.tabShop} style={styles.shopIcon} />
      </Pressable>
      {MAZE_TOOL_IDS.map(tool => (
        <BeltSlot
          key={tool}
          tool={tool}
          count={counts[tool] ?? 0}
          disabled={disabled}
          flash={flashTool === tool}
          onUse={onUse}
          onEmpty={onEmpty}
        />
      ))}
    </View>
  );
}

function BeltSlot({
  tool, count, disabled, flash, onUse, onEmpty,
}: {
  tool: ToolId;
  count: number;
  disabled?: boolean;
  flash: boolean;
  onUse: (tool: ToolId) => void;
  onEmpty: (tool: ToolId) => void;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!flash) {
      pulse.value = withTiming(1, { duration: 120 });
      return;
    }
    pulse.value = withRepeat(withSequence(
      withTiming(1.12, { duration: 180, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 180, easing: Easing.in(Easing.quad) }),
    ), 3, false);
  }, [flash, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const empty = count < 1;
  return (
    <Animated.View style={pulseStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={empty ? `${TOOL_INFO[tool].title}, empty, restock from Farm Store` : `${TOOL_INFO[tool].title}, ${count}`}
        disabled={empty ? false : disabled}
        onPress={() => (empty ? onEmpty(tool) : onUse(tool))}
        style={[styles.btn, empty && styles.empty, flash && styles.flash]}
      >
        <Image source={wordMaizeAssets.powerups[tool]} style={styles.icon} />
        <Text style={[styles.count, empty && styles.countEmpty]}>×{count}</Text>
        {empty ? <Text style={styles.plus}>+</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 6, alignItems: 'flex-start' },
  btn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(40,24,10,0.86)',
    borderWidth: 2,
    borderColor: '#d7ad4b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shop: { backgroundColor: 'rgba(55, 32, 10, 0.92)' },
  shopIcon: { width: 34, height: 34, resizeMode: 'contain' },
  empty: { opacity: 0.72 },
  flash: { borderColor: '#fff4b0', borderWidth: 3, backgroundColor: 'rgba(90,50,12,0.96)' },
  icon: { width: 32, height: 32, resizeMode: 'contain' },
  count: {
    position: 'absolute',
    right: -4,
    top: -6,
    color: '#fff6c6',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: '#5a3210',
    borderRadius: 8,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  countEmpty: { backgroundColor: '#7a3a12' },
  plus: {
    position: 'absolute',
    right: -4,
    bottom: -5,
    color: '#3d2a14',
    fontSize: 11,
    fontWeight: '900',
    backgroundColor: '#f0c43a',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 4,
    lineHeight: 14,
  },
});
