import { View } from 'react-native';

export function GearIcon({ color, size = 20 }: { color: string; size?: number }) {
  const hub = size * 0.64;
  const hole = size * 0.26;
  const toothW = size * 0.24;
  const toothH = size * 0.38;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map(deg => (
        <View
          key={deg}
          style={{
            position: 'absolute',
            width: toothW,
            height: toothH,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
      <View
        style={{
          width: hub,
          height: hub,
          borderRadius: hub / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            backgroundColor: '#3a2410',
          }}
        />
      </View>
    </View>
  );
}
