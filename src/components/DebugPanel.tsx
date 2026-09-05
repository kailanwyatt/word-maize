import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Tuning } from '../game/types';

const numberFields: [keyof Tuning, string, number][] = [
  ['kernelSize', 'Kernel size', 2], ['touchMultiplier', 'Touch area', 0.1],
  ['movementThreshold', 'Move threshold', 2], ['rotationSensitivity', 'Rotation sensitivity', 0.01],
  ['rotationSnap', 'Rotation snap', 0.1], ['visibleColumns', 'Visible columns', 1],
  ['harvestTarget', 'Harvest goal', 5],
];
type DebugAction = { label: string; onPress: () => void; danger?: boolean };
type DebugPanelProps = { open: boolean; onToggle: () => void; tuning: Tuning; onChange: (tuning: Tuning) => void; debug: string; actions?: DebugAction[] };

export function DebugPanel({ open, onToggle, tuning, onChange, debug, actions = [] }: DebugPanelProps) {
  if (!__DEV__) return null;
  if (!open) return <Pressable accessibilityLabel="Open developer tuning" onPress={onToggle} style={styles.gear}><Text style={styles.gearText}>DEV</Text></Pressable>;
  return (
    <View style={styles.panel}>
      <Pressable onPress={onToggle}><Text style={styles.title}>PLAYTEST  ×</Text></Pressable>
      <ScrollView style={styles.scroll}>
        {actions.length ? <View style={styles.actionGrid}>{actions.map(action => (
          <Pressable key={action.label} accessibilityRole="button" onPress={action.onPress} style={[styles.action, action.danger && styles.danger]}>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}</View> : null}
        {numberFields.map(([key, label, step]) => <View key={key} style={styles.line}>
          <Text style={styles.text}>{label}: {Number(tuning[key]).toFixed(step < 1 ? 2 : 0)}</Text>
          <View style={styles.buttons}>
            <Pressable onPress={() => onChange({ ...tuning, [key]: Math.max(0, Number(tuning[key]) - step) })}><Text style={styles.button}>−</Text></Pressable>
            <Pressable onPress={() => onChange({ ...tuning, [key]: Number(tuning[key]) + step })}><Text style={styles.button}>+</Text></Pressable>
          </View>
        </View>)}
        <View style={styles.line}><Text style={styles.text}>Haptics</Text><Switch value={tuning.haptics} onValueChange={haptics => onChange({ ...tuning, haptics })} /></View>
        <Text style={styles.debug}>{debug}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gear: { position: 'absolute', zIndex: 20, bottom: 90, left: 8, width: 34, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,35,24,.75)', borderWidth: 1, borderColor: '#d9c783' },
  gearText: { fontSize: 9, fontWeight: '900', color: '#fff2ae' }, panel: { position: 'absolute', zIndex: 20, top: 52, right: 10, width: 270, borderRadius: 14, padding: 10, borderWidth: 2, borderColor: '#ecd580', backgroundColor: 'rgba(25,42,29,.97)' },
  title: { color: '#f7dc80', fontWeight: '900', textAlign: 'right' }, scroll: { maxHeight: 480, marginTop: 6 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }, action: { backgroundColor: '#527f2d', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: '#a9d56a' }, danger: { backgroundColor: '#7b3429', borderColor: '#e2947f' }, actionText: { color: 'white', fontSize: 10, fontWeight: '900' },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 31 }, text: { color: 'white', fontSize: 11 }, buttons: { flexDirection: 'row', gap: 6 }, button: { color: 'white', fontSize: 19, width: 28, textAlign: 'center', borderRadius: 4, backgroundColor: '#537446' }, debug: { color: '#bceba7', fontFamily: 'monospace', fontSize: 10, marginTop: 7 },
});
