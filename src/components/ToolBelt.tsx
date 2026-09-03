import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { ToolId } from '../game/types';

export type Tool = ToolId;

const tools: { id: Tool; label: string; image: ImageSourcePropType }[] = [
  { id: 'scarecrow', label: 'Scarecrow', image: wordMaizeAssets.powerups.scarecrow },
  { id: 'butterBrush', label: 'Butter', image: wordMaizeAssets.powerups.butterBrush },
  { id: 'cornPicker', label: 'Picker', image: wordMaizeAssets.powerups.cornPicker },
];

export function ToolBelt({
  counts,
  active,
  onUse,
}: {
  counts: Record<Tool, number>;
  active?: Tool;
  onUse: (tool: Tool) => void;
}) {
  return (
    <View style={styles.row}>
      {tools.map(tool => (
        <Pressable
          key={tool.id}
          onPress={() => onUse(tool.id)}
          style={[styles.tool, active === tool.id && styles.active, counts[tool.id] === 0 && styles.empty]}
        >
          <Image source={tool.image} style={styles.image} />
          <Text style={styles.label}>{tool.label}</Text>
          <Text style={styles.count}>×{counts[tool.id]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: 'rgba(47,33,16,0.88)',
    borderWidth: 2,
    borderColor: '#916028',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tool: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: 'rgba(255,240,190,0.96)',
    borderWidth: 2,
    borderColor: '#8b562c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: '#dfff79', backgroundColor: '#fff9b2', transform: [{ scale: 1.06 }] },
  empty: { opacity: 0.45 },
  image: { width: 38, height: 38, resizeMode: 'contain', marginTop: -3 },
  label: { fontSize: 8, color: '#543319', fontWeight: '900', marginTop: -2 },
  count: {
    position: 'absolute',
    right: -4,
    top: -6,
    color: '#fff9dc',
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: '#6e431f',
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
});
