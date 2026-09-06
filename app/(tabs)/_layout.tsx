import { Tabs } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '../../src/components/TabIcons';
import { wordMaizeAssets } from '../../assets/word-maize/assets';

function TabBarWood() {
  return (
    <ImageBackground
      source={wordMaizeAssets.ui.materials.woodPlanks}
      resizeMode="repeat"
      imageStyle={styles.woodTexture}
      style={styles.wood}
    >
      <View style={styles.woodShade} />
      <View style={styles.woodRim} />
      <View style={styles.woodHighlight} />
    </ImageBackground>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      initialRouteName="play"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: { flex: 1 },
        tabBarBackground: () => <TabBarWood />,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 62 + padBottom,
          paddingTop: 6,
          paddingBottom: padBottom,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Farm',
          tabBarAccessibilityLabel: 'Farm',
          tabBarIcon: ({ focused }) => <TabIcon label="FARM" focused={focused} kind="farm" />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarAccessibilityLabel: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="PLAY" focused={focused} kind="play" />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarAccessibilityLabel: 'Shop',
          tabBarIcon: ({ focused }) => <TabIcon label="SHOP" focused={focused} kind="shop" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wood: { flex: 1, backgroundColor: '#3b2410', overflow: 'hidden' },
  woodTexture: { opacity: .9 },
  woodShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(26,11,3,.22)' },
  woodRim: { height: 6, backgroundColor: '#5c3216', borderTopWidth: 2, borderTopColor: '#d09a42', borderBottomWidth: 1, borderBottomColor: '#241006' },
  woodHighlight: { position: 'absolute', left: 0, right: 0, top: 6, height: 1, backgroundColor: 'rgba(255,211,107,.28)' },
});
