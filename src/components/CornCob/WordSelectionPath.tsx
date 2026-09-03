import { StyleSheet, View } from 'react-native';
import { Kernel, Point } from '../../game/types';

export function WordSelectionPath({ path, centers }: { path: Kernel[]; centers: Record<string, Point> }) {
  return (
    <>
      {path.slice(1).map((kernel, index) => {
        const from = centers[path[index].id];
        const to = centers[kernel.id];
        if (!from || !to) return null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy);
        return (
          <View
            key={`seg-${kernel.id}`}
            pointerEvents="none"
            style={[
              styles.line,
              {
                left: from.x,
                top: from.y - 4,
                width: length,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    zIndex: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(199,255,133,0.92)',
    borderWidth: 1,
    borderColor: '#fff7c2',
  },
});
