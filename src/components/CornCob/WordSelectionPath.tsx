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
                top: from.y - 6,
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
    height: 12, // Thicker line
    borderRadius: 6,
    backgroundColor: '#4d8a28', // Solid dark green
    borderWidth: 2,
    borderColor: '#dfffad', // Light green / whiteish border
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 3,
  },
});
