import { Tabs } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '../../src/components/TabIcons';
import { wordMaizeAssets } from '../../assets/word-maize/assets';
import { useMessages } from '../../src/i18n';

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
  const t = useMessages();
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
          height: 72 + padBottom,
          paddingTop: 8,
          paddingBottom: padBottom,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="play"
        options={{
          title: t.tabs.play,
          tabBarAccessibilityLabel: t.tabs.play,
          tabBarIcon: ({ focused }) => <TabIcon label={t.tabs.play} focused={focused} kind="play" />,
        }}
      />
      <Tabs.Screen
        name="fair"
        options={{
          title: t.tabs.fair,
          tabBarAccessibilityLabel: t.tabs.fair,
          tabBarIcon: ({ focused }) => <TabIcon label={t.tabs.fair} focused={focused} kind="fair" />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t.tabs.shop,
          tabBarAccessibilityLabel: t.tabs.shop,
          tabBarIcon: ({ focused }) => <TabIcon label={t.tabs.shop} focused={focused} kind="shop" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarAccessibilityLabel: t.tabs.profile,
          tabBarIcon: ({ focused }) => <TabIcon label={t.tabs.profile} focused={focused} kind="profile" />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{ href: null }}
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
