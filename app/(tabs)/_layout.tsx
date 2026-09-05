import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '../../src/components/TabIcons';

function TabBarWood() {
  return (
    <View style={styles.wood}>
      <View style={styles.woodRim} />
    </View>
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
  wood: { flex: 1, backgroundColor: '#3b2410' },
  woodRim: { height: 5, backgroundColor: '#5c3a18' },
});
