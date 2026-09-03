import { Tabs } from 'expo-router';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

function TabIcon({ label, focused, image }: { label: string; focused: boolean; image?: ImageSourcePropType }) {
  return (
    <View style={styles.iconWrap}>
      {image ? (
        <Image source={image} style={[styles.image, focused && styles.imageOn]} />
      ) : (
        <Text style={[styles.glyph, focused && styles.focused]}>{label[0]}</Text>
      )}
      <Text style={[styles.caption, focused && styles.focused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="play"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: { flex: 1 },
        tabBarStyle: {
          backgroundColor: '#2f2110',
          borderTopColor: '#e5b72f',
          borderTopWidth: 2,
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon label="MAP" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="PLAY" focused={focused} image={wordMaizeAssets.corn.fullV2} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon label="SHOP" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  glyph: { color: '#c9b48a', fontSize: 15, fontWeight: '900' },
  caption: { color: '#c9b48a', fontSize: 11, fontWeight: '900', marginTop: 1 },
  focused: { color: '#ffe676' },
  image: { width: 22, height: 22, resizeMode: 'contain', opacity: 0.7 },
  imageOn: { opacity: 1 },
});
